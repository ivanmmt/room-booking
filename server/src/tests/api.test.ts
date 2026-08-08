import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth';
import roomRoutes from '../routes/rooms';
import bookingRoutes from '../routes/booking';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);

describe('Backend & Security Tests', () => {
  let userToken: string;
  let anotherUserToken: string;
  let createdBookingId: string;
  let testRoomId: string;

  const testUser = {
    email: `test_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Тестовий Юзер',
  };

  const anotherUser = {
    email: `another_${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Інший Юзер',
  };

  beforeAll(async () => {
    // Реєстрація першого користувача
    const res1 = await request(app).post('/api/auth/register').send(testUser);
    userToken = res1.body.token;

    // Реєстрація другого користувача (для тестів безпеки)
    const res2 = await request(app).post('/api/auth/register').send(anotherUser);
    anotherUserToken = res2.body.token;

    // Отримання ID кімнати
    const roomsRes = await request(app).get('/api/rooms');
    testRoomId = roomsRes.body[0].id;
  });

  // 1. Тести авторизації
  describe('Auth API', () => {
    it('має успішно авторизувати зареєстрованого користувача', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('має відхилити логін з невірним паролем (401)', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });
  });

  // 2. Юніт-тести та валідація перетинів (UTC)
  describe('Bookings Overlap Validation', () => {
    it('має створити бронювання на вільний час', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Важлива зустріч',
          roomId: testRoomId,
          startAt: '2026-09-01T10:00:00.000Z',
          endAt: '2026-09-01T11:00:00.000Z',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      createdBookingId = res.body.id;
    });

    it('має відхилити бронювання при частковому або повному перетині часу (409)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Конфліктна зустріч',
          roomId: testRoomId,
          startAt: '2026-09-01T10:30:00.000Z',
          endAt: '2026-09-01T11:30:00.000Z',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Обрана кімната вже заброньована на цей час');
    });
  });

  // 3. Тести безпеки
  describe('Security Checks', () => {
    it('має заборонити створення бронювання без JWT-токена (401)', async () => {
      const res = await request(app).post('/api/bookings').send({
        title: 'Несанкціонована зустріч',
        roomId: testRoomId,
        startAt: '2026-09-02T10:00:00.000Z',
        endAt: '2026-09-02T11:00:00.000Z',
      });

      expect(res.status).toBe(401);
    });

    it('має заборонити видалення чужого бронювання (403)', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Ви можете видаляти лише власні бронювання');
    });

    it('має дозволити власнику видалити своє бронювання (200)', async () => {
      const res = await request(app)
        .delete(`/api/bookings/${createdBookingId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
    });
  });
});