import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Отримати всі бронювання (або за конкретну дату / кімнату)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { roomId, date } = req.query;

    const whereClause: any = {};

    if (roomId) {
      whereClause.roomId = String(roomId);
    }

    if (date) {
      const targetDate = new Date(String(date));
      const startOfDay = new Date(targetDate.setUTCHours(0, 0, 0, 0));
      const endOfDay = new Date(targetDate.setUTCHours(23, 59, 59, 999));

      whereClause.startAt = {
        gte: startOfDay,
        lte: endOfDay,
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

// Створити нове бронювання (з валідацією перетинів та UTC)
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, roomId, startAt, endAt } = req.body;
    const userId = req.user?.id;

    if (!title || !roomId || !startAt || !endAt || !userId) {
      return res.status(400).json({ error: 'Усі поля є обов’язковими' });
    }

    const start = new Date(startAt);
    const end = new Date(endAt);

    // 1. Час початку має бути раніше за час завершення
    if (start >= end) {
      return res.status(400).json({ error: 'Час початку має бути раніше за час завершення' });
    }

    // 2. Бронювання не може бути в минулому
    if (start < new Date()) {
      return res.status(400).json({ error: 'Неможливо забронювати час у минулому' });
    }

    // 3. Перевірка перетину слотів (start1 < end2 AND end1 > start2)
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

// Видалити бронювання (тільки власник)
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