import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    url: 'file:./prisma/dev.db',
  },
  migrations: {
    seed: 'npx tsx ./prisma/seed.ts',
  },
});