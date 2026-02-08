import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { queryBuilder, cursorQueryBuilder, countQuery, aggregateQuery } from "../../src/query-builder";
import {
  cachedQueryBuilder,
  softDeleteQueryBuilder,
  tenantQueryBuilder,
  batchQueryBuilder,
  queryWithWebhook,
  queryAndExportCSV,
  queryAndExportJSON,
  groupByQuery,
} from "../../src/advanced-features";
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

  it("queryBuilder should handle date and number range filters", async () => {
    const result = await queryBuilder({
      model: prisma.order,
      page: 1,
      limit: 10,
      filters: {
        status: "PAID",
        amount: { from: 600, to: 1500 },
        createdAt: { from: new Date(0) },
      },
      sortBy: "createdAt",
      sortOrder: "asc",
    });

    expect(result.meta.total).toBeGreaterThan(0);
    expect(result.data.every((o) => o.status === "PAID")).toBe(true);
    expect(result.data.every((o) => o.amount >= 600 && o.amount <= 1500)).toBe(true);
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

  it("softDeleteQueryBuilder should exclude deleted rows", async () => {
    const result = await softDeleteQueryBuilder({
      model: prisma.user,
      page: 1,
      limit: 10,
    });

    expect(result.data.some((u) => u.email === "deleted@example.com")).toBe(false);
  });

  it("softDeleteQueryBuilder should include trashed when requested", async () => {
    const result = await softDeleteQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { includeTrashed: true },
    );

    expect(result.data.some((u) => u.email === "deleted@example.com")).toBe(true);
  });

  it("softDeleteQueryBuilder should return only trashed when requested", async () => {
    const result = await softDeleteQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { trashedOnly: true },
    );

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((u) => u.deletedAt !== null)).toBe(true);
  });

  it("tenantQueryBuilder should filter by tenantId", async () => {
    const result = await tenantQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { tenantId: "tenant_1" },
    );

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((u) => u.tenantId === "tenant_1")).toBe(true);
  });

  it("tenantQueryBuilder should support custom tenantField", async () => {
    const org = await prisma.organization.findFirst();
    expect(org).toBeTruthy();

    const result = await tenantQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { tenantId: org!.id, tenantField: "organizationId" },
    );

    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data.every((u) => u.organizationId === org!.id)).toBe(true);
  });

  it("cachedQueryBuilder should return cached results", async () => {
    const first = await cachedQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { key: "users-cache", ttl: 1000 },
    );
    const second = await cachedQueryBuilder(
      { model: prisma.user, page: 1, limit: 10 },
      { key: "users-cache", ttl: 1000 },
    );

    expect(second).toEqual(first);
  });

  it("batchQueryBuilder should execute multiple queries", async () => {
    const result = await batchQueryBuilder([
      { name: "users", options: { model: prisma.user, page: 1, limit: 5 } },
      { name: "orders", options: { model: prisma.order, page: 1, limit: 5 } },
    ]);

    expect(result.users.data.length).toBeGreaterThan(0);
    expect(result.orders.data.length).toBeGreaterThan(0);
  });

  it("queryAndExportCSV/JSON should return formatted output", async () => {
    const csv = await queryAndExportCSV({ model: prisma.user, page: 1 }, 100);
    const json = await queryAndExportJSON({ model: prisma.user, page: 1 }, 100, true);

    expect(csv).toContain("email");
    expect(json).toContain("\"email\"");
  });

  it("queryWithWebhook should not throw on fetch error", async () => {
    const fetchMock = () => Promise.reject(new Error("network"));
    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const result = await queryWithWebhook(
      { model: prisma.user, page: 1, limit: 5 },
      "https://example.invalid/webhook",
    );

    expect(result.data.length).toBeGreaterThan(0);
  });

  it("queryWithWebhook should succeed on fetch ok", async () => {
    const fetchMock = () => Promise.resolve({ ok: true });
    // @ts-expect-error test override
    globalThis.fetch = fetchMock;

    const result = await queryWithWebhook(
      { model: prisma.user, page: 1, limit: 5 },
      "https://example.invalid/webhook",
    );

    expect(result.data.length).toBeGreaterThan(0);
  });
});
