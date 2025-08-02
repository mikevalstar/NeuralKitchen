import { type Prisma, PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient();

const tagData: Prisma.TagCreateInput[] = [
  {
    name: "General",
  },
];

export async function main() {
  for (const t of tagData) {
    await prisma.tag.create({ data: t });
  }
}

main();
