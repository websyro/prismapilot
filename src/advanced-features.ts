/**
 * Advanced Features Module
 * Optional utilities for production use cases
 */

import { queryBuilder } from "./query-builder";
import type { QueryBuilderResponse } from "./query-types";

// ============================================================
// 1. QUERY CACHING
// ============================================================

interface CacheStore {
  get(key: string): Promise<any> | any;
  set(key: string, value: any, ttl?: number): Promise<void> | void;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

class InMemoryCache implements CacheStore {
  private cache = new Map<string, { value: any; expiry: number }>();

  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key: string, value: any, ttl = 300000) {
    // Default 5 minutes
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl,
    });
  }

  delete(key: string) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

let cacheStore: CacheStore = new InMemoryCache();

/**
 * Set custom cache store (e.g., Redis)
 */
export function setCacheStore(store: CacheStore) {
  cacheStore = store;
}

/**
 * Query builder with caching
 */
export async function cachedQueryBuilder<T>(
  options: any,
  cacheConfig?: {
    key?: string;
    ttl?: number;
    enabled?: boolean;
  },
): Promise<QueryBuilderResponse<T>> {
  const { key, ttl, enabled = true } = cacheConfig || {};

  if (!enabled || !key) {
    return queryBuilder<T>(options);
  }

  const cached = await cacheStore.get(key);
  if (cached) {
    return cached;
  }

  const result = await queryBuilder<T>(options);
  await cacheStore.set(key, result, ttl);

  return result;
}

/**
 * Generate cache key from options
 */
export function generateCacheKey(options: any): string {
  const parts = [
    options.model?.name || "unknown",
    `page:${options.page || 1}`,
    `limit:${options.limit || 10}`,
    options.search ? `search:${options.search}` : null,
    options.filters ? `filters:${JSON.stringify(options.filters)}` : null,
    `sort:${options.sortBy || "createdAt"}:${options.sortOrder || "desc"}`,
  ]
    .filter(Boolean)
    .join(":");

  return parts;
}

// ============================================================
// 2. QUERY PERFORMANCE MONITORING
// ============================================================

interface QueryMetrics {
  queryTime: number;
  resultCount: number;
  isSlow: boolean;
  timestamp: Date;
}

type MetricsCallback = (metrics: QueryMetrics & { options: any }) => void;

let metricsCallback: MetricsCallback | null = null;
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

/**
 * Set callback for query metrics
 */
export function onQueryMetrics(callback: MetricsCallback) {
  metricsCallback = callback;
}

/**
 * Query builder with performance monitoring
 */
export async function monitoredQueryBuilder<T>(
  options: any,
): Promise<QueryBuilderResponse<T> & { _metrics?: QueryMetrics }> {
  const start = performance.now();

  const result = await queryBuilder<T>(options);

  const queryTime = performance.now() - start;
  const isSlow = queryTime > SLOW_QUERY_THRESHOLD;

  const metrics: QueryMetrics = {
    queryTime,
    resultCount: result.meta.total,
    isSlow,
    timestamp: new Date(),
  };

  if (isSlow) {
    console.warn(`⚠️ Slow query detected: ${queryTime.toFixed(2)}ms`, {
      model: options.model?.name,
      page: options.page,
      filters: options.filters,
    });
  }

  if (metricsCallback) {
    metricsCallback({ ...metrics, options });
  }

  return {
    ...result,
    _metrics: metrics,
  };
}

// ============================================================
// 3. SOFT DELETE SUPPORT
// ============================================================

/**
 * Build soft delete filter
 */
export function buildSoftDeleteFilter(options?: {
  includeTrashed?: boolean;
  trashedOnly?: boolean;
  deletedAtField?: string;
}): any {
  const {
    includeTrashed = false,
    trashedOnly = false,
    deletedAtField = "deletedAt",
  } = options || {};

  if (includeTrashed) {
    return {};
  }

  if (trashedOnly) {
    return { [deletedAtField]: { not: null } };
  }

  return { [deletedAtField]: { equals: null } };
}

/**
 * Query builder with soft delete support
 */
export async function softDeleteQueryBuilder<T>(
  options: any,
  softDeleteOptions?: {
    includeTrashed?: boolean;
    trashedOnly?: boolean;
    deletedAtField?: string;
  },
): Promise<QueryBuilderResponse<T>> {
  const softDeleteFilter = buildSoftDeleteFilter(softDeleteOptions);

  return queryBuilder<T>({
    ...options,
    filters: {
      ...options.filters,
      ...softDeleteFilter,
    },
  });
}

// ============================================================
// 4. MULTI-TENANT SUPPORT
// ============================================================

/**
 * Build tenant filter
 */
export function buildTenantFilter(
  tenantId: string,
  tenantField = "tenantId",
): any {
  return { [tenantField]: tenantId };
}

/**
 * Query builder with tenant isolation
 */
export async function tenantQueryBuilder<T>(
  options: any,
  tenantConfig: {
    tenantId: string;
    tenantField?: string;
  },
): Promise<QueryBuilderResponse<T>> {
  const { tenantId, tenantField = "tenantId" } = tenantConfig;

  const tenantFilter = buildTenantFilter(tenantId, tenantField);

  return queryBuilder<T>({
    ...options,
    filters: {
      ...options.filters,
      ...tenantFilter,
    },
  });
}

// ============================================================
// 5. BATCH OPERATIONS
// ============================================================

/**
 * Execute multiple queries in parallel
 */
export async function batchQueryBuilder(
  queries: Array<{
    name: string;
    options: any;
  }>,
): Promise<Record<string, QueryBuilderResponse<any>>> {
  const results = await Promise.all(
    queries.map(async ({ name, options }) => ({
      name,
      result: await queryBuilder(options),
    })),
  );

  return results.reduce(
    (acc, { name, result }) => {
      acc[name] = result;
      return acc;
    },
    {} as Record<string, QueryBuilderResponse<any>>,
  );
}

// ============================================================
// 6. EXPORT UTILITIES
// ============================================================

/**
 * Convert data to CSV format
 */
export function toCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const normalizeValue = (value: any) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const escapeCsv = (raw: string) => {
    const needsQuotes = raw.includes(",") || raw.includes('"') || raw.includes("\n") || raw.includes("\r");
    const escaped = raw.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  };

  const csvRows = data.map((row) =>
    headers
      .map((header) => escapeCsv(normalizeValue(row[header])))
      .join(","),
  );

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Query and export to CSV
 */
export async function queryAndExportCSV(
  options: any,
  maxRows = 10000,
): Promise<string> {
  const result = await queryBuilder({
    ...options,
    limit: maxRows,
  });

  return toCSV(result.data);
}

/**
 * Convert data to JSON
 */
export function toJSON(data: any[], pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}

/**
 * Query and export to JSON
 */
export async function queryAndExportJSON(
  options: any,
  maxRows = 10000,
  pretty = true,
): Promise<string> {
  const result = await queryBuilder({
    ...options,
    limit: maxRows,
  });

  return toJSON(result.data, pretty);
}

// ============================================================
// 7. QUERY PRESETS
// ============================================================

const presets = new Map<string, any>();

/**
 * Save query preset
 */
export function saveQueryPreset(name: string, options: any): void {
  presets.set(name, options);
}

/**
 * Load query preset
 */
export function loadQueryPreset(name: string): any {
  const preset = presets.get(name);
  if (!preset) {
    throw new Error(`Preset "${name}" not found`);
  }
  return preset;
}

/**
 * Execute saved preset
 */
export async function executePreset<T>(
  name: string,
  overrides?: Partial<any>,
): Promise<QueryBuilderResponse<T>> {
  const preset = loadQueryPreset(name);
  return queryBuilder<T>({
    ...preset,
    ...overrides,
  });
}

/**
 * List all saved presets
 */
export function listPresets(): string[] {
  return Array.from(presets.keys());
}

/**
 * Delete a preset
 */
export function deletePreset(name: string): boolean {
  return presets.delete(name);
}

// ============================================================
// 8. WEBHOOK INTEGRATION
// ============================================================

/**
 * Query with webhook notification
 */
export async function queryWithWebhook<T>(
  options: any,
  webhookUrl: string,
  webhookOptions?: {
    headers?: Record<string, string>;
    includeQuery?: boolean;
  },
): Promise<QueryBuilderResponse<T>> {
  const result = await queryBuilder<T>(options);

  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...webhookOptions?.headers,
    },
    body: JSON.stringify({
      data: result.data,
      meta: result.meta,
      timestamp: new Date().toISOString(),
      ...(webhookOptions?.includeQuery && { query: options }),
    }),
  }).catch((error) => {
    console.error("Webhook error:", error);
  });

  return result;
}

// ============================================================
// 9. ADVANCED AGGREGATION HELPERS
// ============================================================

/**
 * Group by with aggregation
 */
export async function groupByQuery(options: {
  model: any;
  groupBy: string[];
  aggregations?: {
    _count?: boolean | Record<string, boolean>;
    _sum?: Record<string, boolean>;
    _avg?: Record<string, boolean>;
    _min?: Record<string, boolean>;
    _max?: Record<string, boolean>;
  };
  filters?: any;
  having?: any;
}): Promise<any> {
  const { model, groupBy, aggregations = {}, filters, having } = options;

  return model.groupBy({
    by: groupBy,
    ...aggregations,
    where: filters,
    having,
  });
}
