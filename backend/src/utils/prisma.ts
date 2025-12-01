import { PrismaClient } from '@prisma/client';

// יצירת instance יחיד של Prisma
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// סגירה נכונה בעת כיבוי
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
