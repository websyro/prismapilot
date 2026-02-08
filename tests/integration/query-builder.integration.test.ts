import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { queryBuilder, cursorQueryBuilder, countQuery, aggregateQuery } from "../../src/query-builder";
import { groupByQuery } from "../../src/advanced-features";
import { prisma, resetDb, seedBasicData } from "./helpers";

describe("Integration: query builders with SQLite", () => {
  beforeAll(async () => {
    await resetDb();
    await seedBasicData();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("queryBuilder should filter and relationFilter", async () => {
    const result = await queryBuilder({
      model: prisma.user,
      page: 1,
      limit: 10,
      filters: { isActive: true },
      relationFilters: {
        organization: { isActive: true },
      },
      sortBy: "createdAt",
      sortOrder: "desc",
    });

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.meta.total).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("email");
  });

  it("cursorQueryBuilder should paginate with stable cursor", async () => {
    const first = await cursorQueryBuilder({
      model: prisma.user,
      limit: 1,
      cursorField: "id",
      sortOrder: "asc",
    });

    expect(first.data.length).toBe(1);

    const next = await cursorQueryBuilder({
      model: prisma.user,
      cursor: first.meta.nextCursor ?? undefined,
      limit: 1,
      cursorField: "id",
      sortOrder: "asc",
    });

    expect(next.data.length).toBe(1);
  });

  it("countQuery and aggregateQuery should work with relationFilters", async () => {
    const count = await countQuery({
      model: prisma.user,
      filters: { isActive: true },
      relationFilters: { organization: { isActive: true } },
    });

    expect(count).toBeGreaterThan(0);

    const stats = await aggregateQuery({
      model: prisma.order,
      filters: { status: "PAID" },
      relationFilters: { user: { isActive: true } },
      aggregations: { _sum: { amount: true }, _count: true },
    });

    expect(stats._count).toBeGreaterThan(0);
    expect(stats._sum.amount).toBeGreaterThan(0);
  });

  it("groupByQuery should aggregate", async () => {
    const result = await groupByQuery({
      model: prisma.order,
      groupBy: ["status"],
      aggregations: { _count: true },
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });
});
