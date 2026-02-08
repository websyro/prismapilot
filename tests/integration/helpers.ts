import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const dbPath = path.resolve("tests/integration/test.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;
const adapter = new PrismaBetterSqlite3({ url: dbUrl });

export const prisma = new PrismaClient({ adapter });

export async function resetDb() {
  await prisma.session.deleteMany();
  await prisma.post.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();
}

export async function seedBasicData() {
  const org = await prisma.organization.create({
    data: {
      name: "Acme",
      isActive: true,
      users: {
        create: [
          {
            email: "john@example.com",
            name: "John",
            isActive: true,
            posts: {
              create: [
                { title: "Hello", status: "PUBLISHED" },
                { title: "Draft", status: "DRAFT" },
              ],
            },
            sessions: {
              create: [{ isActive: false }],
            },
            orders: {
              create: [
                { amount: 1000, status: "PAID" },
                { amount: 2000, status: "PENDING" },
              ],
            },
          },
          {
            email: "jane@example.com",
            name: "Jane",
            isActive: false,
            posts: {
              create: [{ title: "Post", status: "PUBLISHED" }],
            },
            sessions: {
              create: [{ isActive: true }],
            },
            orders: {
              create: [{ amount: 500, status: "PAID" }],
            },
          },
        ],
      },
    },
    include: { users: true },
  });

  return { org };
}
