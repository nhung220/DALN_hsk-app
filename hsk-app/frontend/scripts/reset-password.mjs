import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Reset password cho tất cả user test về "123456"
const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
console.log('Users in DB:');
for (const u of users) {
  console.log(`  - ${u.name} (${u.email}) [id: ${u.id}]`);
}

const hash = await bcrypt.hash('123456', 10);

// Reset nhung@gmail.com
await prisma.user.updateMany({
  where: { email: 'nhung@gmail.com' },
  data: { passwordHash: hash },
});
console.log('\nReset password nhung@gmail.com -> 123456 ✓');

// Reset huy@gmail.com  
await prisma.user.updateMany({
  where: { email: 'huy@gmail.com' },
  data: { passwordHash: hash },
});
console.log('Reset password huy@gmail.com -> 123456 ✓');

await prisma.$disconnect();
