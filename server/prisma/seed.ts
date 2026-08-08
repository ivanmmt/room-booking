import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { createClient } from '@libsql/client';
import bcrypt from 'bcrypt';

const libsql = createClient({
  url: 'file:./prisma/dev.db',
});
const adapter = new PrismaLibSql({
  url: 'file:./prisma/dev.db',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  // Очистка перед заповненням
  await prisma.booking.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');

  // 1. Хешуємо паролі для тестових користувачів
  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.create({
    data: {
      email: 'ivan@x.com',
      name: 'Іван Петренко',
      password: hashedPassword,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'olena@x.com',
      name: 'Олена Сидоренко',
      password: hashedPassword,
    },
  });

  console.log('Test users created:');
  console.log('User 1: ivan@x.com / password123');
  console.log('User 2: olena@x.com / password123');

  // 2. Створюємо 5-6 кімнат
  const roomAquarium = await prisma.room.create({
    data: { name: 'Акваріум', floor: 1, capacity: 6 },
  });

  const roomMars = await prisma.room.create({
    data: { name: 'Марс', floor: 2, capacity: 10 },
  });

  await prisma.room.createMany({
    data: [
      { name: 'Гагарін', floor: 2, capacity: 4 },
      { name: 'Олімп', floor: 3, capacity: 12 },
      { name: 'Нептун', floor: 1, capacity: 8 },
    ],
  });

  console.log('Rooms created.');

  // 3. Демо-бронювання (строго UTC-час)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Слот 10:00 - 11:00 UTC (13:00 - 14:00 Kyiv)
  const start1 = new Date(tomorrow);
  start1.setUTCHours(10, 0, 0, 0);
  const end1 = new Date(tomorrow);
  end1.setUTCHours(11, 0, 0, 0);

  // Слот 11:00 - 12:00 UTC (14:00 - 15:00 Kyiv)
  const start2 = new Date(tomorrow);
  start2.setUTCHours(11, 0, 0, 0);
  const end2 = new Date(tomorrow);
  end2.setUTCHours(12, 0, 0, 0);

  await prisma.booking.create({
    data: {
      title: 'Планування спринту',
      startAt: start1,
      endAt: end1,
      roomId: roomAquarium.id,
      userId: user1.id,
    },
  });

  await prisma.booking.create({
    data: {
      title: 'Звіти та аналітика',
      startAt: start2,
      endAt: end2,
      roomId: roomMars.id,
      userId: user2.id,
    },
  });

  console.log('Demo bookings created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });