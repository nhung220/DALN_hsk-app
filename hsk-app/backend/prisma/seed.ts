/**
 * Prisma seed — chạy bằng: npm run db:seed
 * Hiện tại không có dữ liệu mẫu nào cần seed.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seed hoàn tất (không có dữ liệu mẫu).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
