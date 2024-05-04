import { PrismaClient } from "@prisma/client";

const prismaClientGenerator = () => {
  return new PrismaClient();
};

type prismaClientGenerator = ReturnType<typeof prismaClientGenerator>;

const globalForPrisma = globalThis as unknown as {
  prisma: prismaClientGenerator | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientGenerator();

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
