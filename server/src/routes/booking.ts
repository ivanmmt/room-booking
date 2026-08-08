import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Функція для перевірки робочих годин у часовому поясі Europe/Kyiv (09:00 - 19:00)
const isValidWorkingHoursInKyiv = (start: Date, end: Date): boolean => {
  const getKyivHourAndMin = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Kyiv',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    return hour + minute / 60;
  };

  const startHour = getKyivHourAndMin(start);
  const endHour = getKyivHourAndMin(end);

  return startHour >= 9 && endHour <= 19;
};

// Отримати всі бронювання
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, start, end } = req.query;

    const whereClause: any = {};

    if (roomId) {
      whereClause.roomId = String(roomId);
    }

    if (start && end) {
      whereClause.startAt = {
        gte: new Date(String(start)),
        lte: new Date(String(end)),
      };
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startAt: 'asc' },
    });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Помилка отримання бронювань' });
  }
});

// Створити нове бронювання
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, roomId, startAt, endAt } = req.body;
    const userId = req.user?.id;

    if (!title || !roomId || !startAt || !endAt || !userId) {
      return res.status(400).json({ error: "Усі поля є обов'язковими" });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);
    const now = new Date();

    // 1. Бронювання лише у майбутньому
    if (start < now) {
      return res.status(400).json({ error: 'Бронювання можливе лише у майбутньому часі' });
    }

    // 2. Час початку раніше за час завершення
    if (start >= end) {
      return res.status(400).json({ error: 'Час початку має бути раніше за час завершення' });
    }

    // 3. Кратність 30 хвилинам
    if (start.getMinutes() % 30 !== 0 || end.getMinutes() % 30 !== 0) {
      return res.status(400).json({ error: 'Час початку та завершення має бути кратним 30 хвилинам' });
    }

    // 4. Тривалість від 30 хв (0.5 год) до 4 годин (240 хв)
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    if (durationMinutes < 30 || durationMinutes > 240) {
      return res.status(400).json({ error: 'Тривалість бронювання має бути від 30 хвилин до 4 годин' });
    }

    // 5. Робочі години 09:00 - 19:00 за київським часом (Europe/Kyiv)
    if (!isValidWorkingHoursInKyiv(start, end)) {
      return res.status(400).json({ error: 'Бронювання можливе лише в робочий час (09:00 - 19:00 за Києвом)' });
    }

    // 6. Перевірка перетину інтервалів (start1 < end2 AND end1 > start2)
    const overlappingBooking = await prisma.booking.findFirst({
      where: {
        roomId,
        AND: [
          { startAt: { lt: end } },
          { endAt: { gt: start } },
        ],
      },
    });

    if (overlappingBooking) {
      return res.status(409).json({ error: 'Обрана кімната вже заброньована на цей час' });
    }

    const booking = await prisma.booking.create({
      data: {
        title,
        roomId,
        userId,
        startAt: start,
        endAt: end,
      },
      include: {
        room: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: 'Помилка створення бронювання' });
  }
});

// Видалити бронювання
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const booking = await prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      return res.status(404).json({ error: 'Бронювання не знайдено' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Ви можете видаляти лише власні бронювання' });
    }

    await prisma.booking.delete({ where: { id } });

    res.json({ message: 'Бронювання скасовано' });
  } catch (error) {
    res.status(500).json({ error: 'Помилка видалення бронювання' });
  }
});

export default router;