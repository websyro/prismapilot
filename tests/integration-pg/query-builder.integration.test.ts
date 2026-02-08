import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  queryBuilder,
  cursorQueryBuilder,
  countQuery,
  aggregateQuery,
} from "../../src/query-builder";
import { groupByQuery } from "../../src/advanced-features";
import { prisma, resetDb, seedBasicData } from "./helpers";

describe("Integration (Postgres): query builders", () => {
  beforeAll(async () => {
    await resetDb();
    await seedBasicData();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it("queryBuilder should filter, search (insensitive), and relationFilter", async () => {
    const result = await queryBuilder({
      model: prisma.user,
      page: 1,
      limit: 10,
      search: "JOHN",
      searchFields: ["email", "name"],
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
    expect(result.data.some((u) => u.email === "john@example.com")).toBe(true);
  });

  it("relationFilters should support some/none", async () => {
    const result = await queryBuilder({
      model: prisma.user,
      page: 1,
      limit: 10,
      relationFilters: {
        posts: { some: { status: "PUBLISHED" } },
        sessions: { none: { isActive: true } },
      },
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    expect(result.meta.total).toBe(1);
    expect(result.data[0]?.email).toBe("john@example.com");
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

  it("cursorQueryBuilder should work with cursorField != sortBy", async () => {
    const first = await cursorQueryBuilder({
      model: prisma.user,
      limit: 1,
      cursorField: "email",
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    expect(first.data.length).toBe(1);
    expect(first.meta.nextCursor).toBeTruthy();
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
