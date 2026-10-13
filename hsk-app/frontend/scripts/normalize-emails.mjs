import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const users = await prisma.user.findMany({ select: { id: true, email: true } });
for (const u of users) {
  const lower = u.email.toLowerCase().trim();
  if (lower !== u.email) {
    const exists = await prisma.user.findFirst({
      where: { email: lower, NOT: { id: u.id } }
    });
    if (!exists) {
      await prisma.user.update({ where: { id: u.id }, data: { email: lower } });
      console.log('Updated:', u.email, '->', lower);
    } else {
      console.log('Skip (conflict):', u.email);
    }
  }
}
console.log('Done - all emails normalized');
await prisma.$disconnect();
