import { Router, Request, Response } from 'express';
import { prisma } from '../db';

const router = Router();

// Отримати всі кімнати
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Помилка отримання кімнат' });
  }
});

// Отримати одну кімнату за ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
    });
    if (!room) {
      return res.status(404).json({ error: 'Кімнату не знайдено' });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

export default router;