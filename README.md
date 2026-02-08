# PrismaPilot

A generic, schema-agnostic query builder for Prisma. It provides pagination, search, filters, sorting, and optional helpers while keeping the public API clean and reusable across projects.

## Features
- Works with any Prisma model
- Offset and cursor pagination
- Search helpers (case-insensitive contains)
- Filter helpers (exact, ranges, arrays, booleans)
- Optional Zod validation schemas
- Advanced utilities in a separate module

## Feature Matrix
| Feature Area | Available Items | Real-World Use Cases |
| --- | --- | --- |
| Core builders | `queryBuilder`, `cursorQueryBuilder`, `advancedQueryBuilder`, `countQuery`, `aggregateQuery` | Listing pages, infinite scroll, dashboards, reporting |
| Pagination | `getPagination`, `getCursorPagination`, `calculateTotalPages`, `processCursorResults` | API pagination, mobile feeds, admin tables |
| Search | `buildSearchQuery`, `buildNestedSearchQuery`, `buildExactSearch`, `buildPrefixSearch` | User search, order lookup, quick search bars |
| Filters | `buildFilters`, `buildDateRangeFilter`, `buildNumberRangeFilter`, `buildRelationFilters`, `buildNotFilters`, `combineFilters`, `combineFiltersWithOr` | Status filters, date ranges, price ranges, exclusions |
| Filter types | Exact, Array (IN), Date range, Number range, Boolean, Enum | Role filters, date windows, amount bands |
| Validation | `paginationSchema`, `cursorPaginationSchema`, `sortSchema`, `searchSchema`, `dateRangeSchema`, `numberRangeSchema`, `genericQuerySchema` | Validate query params for REST/GraphQL |
| Advanced module | `cachedQueryBuilder`, `monitoredQueryBuilder`, `softDeleteQueryBuilder`, `tenantQueryBuilder`, `batchQueryBuilder`, `queryWithWebhook`, `groupByQuery` | Caching, performance monitoring, soft deletes, multi-tenant apps, exports, webhook workflows |

## Assumptions / Notes
- `queryBuilder` default sort uses `createdAt` unless you pass a different `sortBy`.
- `cursorQueryBuilder` default sort uses `cursorField` (default: `id`) unless you pass a different `sortBy`.
- `cursorQueryBuilder` uses a `cursorField` (default: `id`). The cursor value must match this field and that field must be unique in your Prisma schema.
- If you sort by a different field, Prisma still needs a stable order. PrismaPilot automatically adds `cursorField` as a secondary `orderBy` for cursor pagination.
- Search helpers use `mode: "insensitive"`, which depends on your Prisma provider support.

## Installation

### NPM
```bash
npm install @websyro/prismapilot
```

### Yarn
```bash
yarn add @websyro/prismapilot
```

### PNPM
```bash
pnpm add @websyro/prismapilot
```

### Bun
```bash
bun add @websyro/prismapilot
```

## Quick Start
```ts
import { queryBuilder } from "@websyro/prismapilot";
import { prisma } from "./lib/prisma";

const result = await queryBuilder({
  model: prisma.user,
  page: 1,
  limit: 10,
  search: "john",
  searchFields: ["email", "name"],
  filters: { isActive: true },
});

console.log(result.data);
console.log(result.meta);
```

## API Details

### Core Builders
- `queryBuilder`
- `cursorQueryBuilder`
- `advancedQueryBuilder`
- `countQuery`
- `aggregateQuery`

### Options (queryBuilder)
```ts
type QueryBuilderArgs = {
  model: any;
  page?: number;
  limit?: number;
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  relationFilters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  include?: any;
  select?: any;
};
```

### Response
```ts
type QueryBuilderResponse<T> = {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
```

### Cursor Pagination
```ts
type CursorQueryBuilderArgs = {
  model: any;
  cursor?: string;
  limit?: number;
  search?: string;
  searchFields?: string[];
  filters?: Record<string, any>;
  relationFilters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  cursorField?: string;
  include?: any;
  select?: any;
};
```

### Utilities
- Pagination: `getPagination`, `getCursorPagination`, `calculateTotalPages`, `processCursorResults`
- Search: `buildSearchQuery`, `buildNestedSearchQuery`, `buildExactSearch`, `buildPrefixSearch`
- Filters: `buildFilters`, `buildDateRangeFilter`, `buildNumberRangeFilter`, `buildRelationFilters`, `buildNotFilters`, `combineFilters`, `combineFiltersWithOr`
  `combineFilters` uses AND logic, `combineFiltersWithOr` uses OR logic.
- `relationFilters` can be passed to builders for relation where clauses.

### Filter Types
Below are the supported filter styles for the `filters` option. You can mix these in the same object.

Exact Match
```ts
filters: {
  role: "ADMIN",
  isActive: true,
}
```

Array (IN Query)
```ts
filters: {
  role: ["ADMIN", "USER", "PRO"],
  status: ["CREATED", "PAID"],
}
```

Date Range
```ts
filters: {
  createdAt: {
    from: new Date("2025-01-01"),
    to: new Date("2025-12-31"),
  },
}
```

Number Range
```ts
filters: {
  amount: {
    from: 10000, // 100 INR
    to: 100000, // 1000 INR
  },
}
```

Boolean
```ts
filters: {
  isActive: true,
  isForced: false,
}
```

Enum
```ts
filters: {
  status: "PAID",
  purpose: "EVENT",
}
```

## Examples

### Basic Usage
```ts
import { queryBuilder } from "@websyro/prismapilot";
import { prisma } from "./lib/prisma";

// Simple query
const users = await queryBuilder({
  model: prisma.user,
  page: 1,
  limit: 20,
  search: "john",
  searchFields: ["email", "username", "firstName"],
  filters: {
    isActive: true,
    role: ["ADMIN", "USER"],
  },
  sortBy: "createdAt",
  sortOrder: "desc",
});
```

## API Reference

### queryBuilder - Offset-based Pagination
```ts
const result = await queryBuilder({
  model: prisma.user,           // Required: Prisma model
  page: 1,                      // Optional: Page number (default: 1)
  limit: 10,                    // Optional: Items per page (default: 10, max: 100)
  search: "search term",        // Optional: Search string
  searchFields: ["field1"],     // Optional: Fields to search in
  filters: {},                  // Optional: Filter conditions
  relationFilters: {},          // Optional: Relation filter conditions
  sortBy: "createdAt",          // Optional: Field to sort by
  sortOrder: "desc",            // Optional: asc or desc
  include: {},                  // Optional: Prisma include
  select: {},                   // Optional: Prisma select
});
```
Returns:
```ts
{
  data: T[],
  meta: {
    total: number,
    page: number,
    limit: number,
    totalPages: number,
  },
}
```

### cursorQueryBuilder - Cursor-based Pagination
```ts
const result = await cursorQueryBuilder({
  model: prisma.event,
  cursor: "last-item-id",       // Optional: Cursor for next page
  limit: 10,
  cursorField: "id",            // Optional: Cursor field (must be unique)
  relationFilters: {},          // Optional: Relation filter conditions
  // ... same options as queryBuilder (except 'page')
});
```
Returns:
```ts
{
  data: T[],
  meta: {
    nextCursor: string | null,
    hasMore: boolean,
    limit: number,
  },
}
```

### countQuery - Count Records
```ts
const count = await countQuery({
  model: prisma.order,
  filters: { status: "PAID" },
  relationFilters: { user: { isActive: true } },
  search: "search term",
  searchFields: ["receipt"],
});
```

### aggregateQuery - Aggregations
```ts
const stats = await aggregateQuery({
  model: prisma.order,
  filters: { status: "PAID" },
  relationFilters: { user: { isActive: true } },
  aggregations: {
    _sum: { amount: true },
    _avg: { amount: true },
    _min: { amount: true },
    _max: { amount: true },
    _count: true,
  },
});
```

### Search and Filters
```ts
import { queryBuilder } from "@websyro/prismapilot";

const users = await queryBuilder({
  model: prisma.user,
  search: "john",
  searchFields: ["email", "name"],
  filters: {
    isActive: true,
    createdAt: { from: new Date("2025-01-01"), to: new Date("2025-12-31") },
  },
  relationFilters: {
    organization: { isActive: true },
  },
});
```

### Relation Filters (some/none/every)
```ts
const users = await queryBuilder({
  model: prisma.user,
  page: 1,
  limit: 20,
  relationFilters: {
    posts: {
      some: { status: "PUBLISHED" },
    },
    sessions: {
      none: { isActive: true },
    },
  },
});
```

### Cursor Pagination
```ts
import { cursorQueryBuilder } from "@websyro/prismapilot";

const page = await cursorQueryBuilder({
  model: prisma.order,
  cursor: "ckx123...",
  limit: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
  cursorField: "id",
});
```

### Advanced Module
```ts
import { cachedQueryBuilder } from "@websyro/prismapilot/advanced";

const users = await cachedQueryBuilder(
  { model: prisma.user, page: 1 },
  { key: "users-page-1", ttl: 300000 }
);
```

## Advanced Module Docs
Import from `@websyro/prismapilot/advanced`. These utilities are generic, but some require specific fields in your schema.

### What To Use When
| Use case | Functions |
| --- | --- |
| Use caching | `cachedQueryBuilder`, `setCacheStore`, `generateCacheKey` |
| Measure performance | `monitoredQueryBuilder`, `onQueryMetrics` |
| Soft delete (requires `deletedAt` or custom field) | `buildSoftDeleteFilter`, `softDeleteQueryBuilder` |
| Multi-tenant filters (requires `tenantId` or custom field) | `buildTenantFilter`, `tenantQueryBuilder` |
| Batch queries | `batchQueryBuilder` |
| Export data | `toCSV`, `toJSON`, `queryAndExportCSV`, `queryAndExportJSON` |
| Presets | `saveQueryPreset`, `loadQueryPreset`, `executePreset`, `listPresets`, `deletePreset` |
| Webhook after query | `queryWithWebhook` |
| Group by aggregations | `groupByQuery` |
| Requirements / Notes | `softDelete*` needs `deletedAt` (or custom field), `tenant*` needs `tenantId` (or custom field), `groupByQuery` depends on Prisma `groupBy`, `queryWithWebhook` uses `fetch` (Node 18+) |
| Export Notes | `toCSV` stringifies nested objects/arrays using JSON before CSV escaping |

### Advanced Feature Examples

#### Query Caching
```ts
import { cachedQueryBuilder, generateCacheKey } from "@websyro/prismapilot/advanced";

const options = { model: prisma.user, page: 1, limit: 20 };
const key = generateCacheKey(options);

const result = await cachedQueryBuilder(options, { key, ttl: 300000 });
```

#### Performance Monitoring
```ts
import { monitoredQueryBuilder, onQueryMetrics } from "@websyro/prismapilot/advanced";

onQueryMetrics(({ queryTime, isSlow, options }) => {
  if (isSlow) console.warn("Slow query", { queryTime, options });
});

const result = await monitoredQueryBuilder({ model: prisma.order, page: 1 });
```

#### Soft Delete
```ts
import { softDeleteQueryBuilder } from "@websyro/prismapilot/advanced";

const result = await softDeleteQueryBuilder(
  { model: prisma.user, page: 1 },
  { deletedAtField: "deletedAt" }
);
```

#### Multi-tenant
```ts
import { tenantQueryBuilder } from "@websyro/prismapilot/advanced";

const result = await tenantQueryBuilder(
  { model: prisma.event, page: 1 },
  { tenantId: "tenant_123" }
);
```

#### Batch Queries
```ts
import { batchQueryBuilder } from "@websyro/prismapilot/advanced";

const result = await batchQueryBuilder([
  { name: "users", options: { model: prisma.user, page: 1 } },
  { name: "orders", options: { model: prisma.order, page: 1 } },
]);
```

#### Export
```ts
import { queryAndExportCSV, queryAndExportJSON } from "@websyro/prismapilot/advanced";

const csv = await queryAndExportCSV({ model: prisma.order, page: 1 }, 10000);
const json = await queryAndExportJSON({ model: prisma.order, page: 1 }, 10000, true);
// Note: nested objects/arrays are JSON-stringified for CSV output
```

#### Presets
```ts
import { saveQueryPreset, executePreset } from "@websyro/prismapilot/advanced";

saveQueryPreset("active-users", { model: prisma.user, filters: { isActive: true } });
const result = await executePreset("active-users", { page: 1 });
```

#### Webhook
```ts
import { queryWithWebhook } from "@websyro/prismapilot/advanced";

const result = await queryWithWebhook(
  { model: prisma.order, page: 1 },
  "https://example.com/webhook",
  { includeQuery: true }
);
```

#### Group By
```ts
import { groupByQuery } from "@websyro/prismapilot/advanced";

const result = await groupByQuery({
  model: prisma.order,
  groupBy: ["status"],
  aggregations: { _count: true, _sum: { amount: true } },
});
```

### Validation (Optional)
```ts
import { paginationSchema, sortSchema } from "@websyro/prismapilot";

const input = paginationSchema.merge(sortSchema).parse({
  page: "1",
  limit: "20",
  sortBy: "createdAt",
  sortOrder: "desc",
});
```

## Real-World Examples

### Search Users
```ts
const users = await queryBuilder({
  model: prisma.user,
  page: 1,
  limit: 20,
  search: "john@example.com",
  searchFields: ["email", "username", "firstName", "lastName"],
  filters: {
    isActive: true,
    role: "USER",
  },
});
```
Sample response:
```json
{
  "data": [
    {
      "id": "u_1",
      "email": "john@example.com",
      "username": "john",
      "firstName": "John",
      "lastName": "Doe",
      "role": "USER",
      "isActive": true
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### Get Upcoming Events
```ts
const events = await queryBuilder({
  model: prisma.event,
  page: 1,
  limit: 10,
  filters: {
    status: "UPCOMING",
    mode: "ONLINE",
  },
  sortBy: "startsAt",
  sortOrder: "asc",
  include: {
    speakers: true,
    hostedUrl: true,
  },
});
```
Sample response:
```json
{
  "data": [
    {
      "id": "ev_1",
      "title": "NextJS Meetup",
      "status": "UPCOMING",
      "mode": "ONLINE",
      "startsAt": "2025-03-10T10:00:00.000Z",
      "speakers": [],
      "hostedUrl": true
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 10, "totalPages": 1 }
}
```

### Orders by Date Range
```ts
const orders = await queryBuilder({
  model: prisma.order,
  page: 1,
  limit: 50,
  filters: {
    status: "PAID",
    createdAt: {
      from: new Date("2025-01-01"),
      to: new Date("2025-12-31"),
    },
    amount: {
      from: 10000,  // 100 INR in paise
      to: 100000,   // 1000 INR in paise
    },
  },
});
```
Sample response:
```json
{
  "data": [
    {
      "id": "ord_1",
      "status": "PAID",
      "amount": 45000,
      "createdAt": "2025-02-12T08:30:00.000Z"
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 50, "totalPages": 1 }
}
```

### Infinite Scroll with Cursor Pagination
```ts
const events = await cursorQueryBuilder({
  model: prisma.event,
  cursor: lastItemId,  // From previous response
  limit: 10,
  filters: {
    status: "LIVE",
  },
  include: {
    speakers: true,
  },
});

// Next page
if (events.meta.hasMore) {
  const nextPage = await cursorQueryBuilder({
    model: prisma.event,
    cursor: events.meta.nextCursor,
    limit: 10,
  });
}
```
Sample response:
```json
{
  "data": [
    { "id": "ev_10", "title": "Live Webinar", "status": "LIVE", "speakers": [] }
  ],
  "meta": { "nextCursor": "ev_10", "hasMore": true, "limit": 10 }
}
```

### Search Payments
```ts
const payments = await queryBuilder({
  model: prisma.payment,
  page: 1,
  limit: 20,
  search: "razorpay_123",
  searchFields: ["paymentGatewayPaymentId", "paymentGatewayOrderId"],
  filters: {
    status: "SUCCESS",
  },
  include: {
    user: {
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    },
    order: true,
  },
});
```
Sample response:
```json
{
  "data": [
    {
      "id": "pay_1",
      "status": "SUCCESS",
      "paymentGatewayPaymentId": "razorpay_123",
      "user": { "email": "john@example.com", "firstName": "John", "lastName": "Doe" },
      "order": { "id": "ord_1" }
    }
  ],
  "meta": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
}
```

### Dashboard Statistics
```ts
const stats = await Promise.all([
  countQuery({ model: prisma.user, filters: { isActive: true } }),
  countQuery({ model: prisma.event, filters: { status: "LIVE" } }),
  countQuery({ model: prisma.order, filters: { status: "PAID" } }),
  countQuery({ model: prisma.refundRequest, filters: { status: "PENDING" } }),
]);

const [activeUsers, liveEvents, paidOrders, pendingRefunds] = stats;
```
Sample response:
```json
{
  "activeUsers": 120,
  "liveEvents": 3,
  "paidOrders": 56,
  "pendingRefunds": 4
}
```

### Revenue Aggregation
```ts
const revenue = await aggregateQuery({
  model: prisma.order,
  filters: {
    status: "PAID",
    createdAt: {
      from: new Date("2025-01-01"),
      to: new Date("2025-12-31"),
    },
  },
  aggregations: {
    _count: true,
    _sum: { amount: true },
    _avg: { amount: true },
  },
});

console.log({
  totalOrders: revenue._count,
  totalRevenue: revenue._sum.amount,
  averageOrderValue: revenue._avg.amount,
});
```
Sample response:
```json
{
  "totalOrders": 150,
  "totalRevenue": 7250000,
  "averageOrderValue": 48333.33
}
```

## Next.js API Routes

### Example: `GET /api/users`
```ts
import { NextRequest, NextResponse } from "next/server";
import { queryBuilder } from "@websyro/prismapilot";
import { prisma } from "@/lib/prisma.client";
import { userQuerySchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      role: searchParams.get("role") || undefined,
      isActive: searchParams.get("isActive") || undefined,
    };

    const validated = userQuerySchema.parse(params);

    const result = await queryBuilder({
      model: prisma.user,
      page: validated.page,
      limit: validated.limit,
      search: validated.search,
      searchFields: ["email", "username", "firstName", "lastName"],
      filters: {
        role: validated.role,
        isActive: validated.isActive,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid query parameters" },
      { status: 400 },
    );
  }
}
```

### Example Usage
```
GET /api/users?page=1&limit=20&search=john&role=USER&isActive=true
```

### Next.js + Clerk (Admin Only)
```ts
import { NextRequest, NextResponse } from "next/server";
import { queryBuilder } from "@websyro/prismapilot";
import { prisma } from "@/lib/prisma.client";
import { auth } from "@clerk/nextjs/server";
import { UserRole } from "@prisma/client";
import { z } from "zod";

const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  role: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if ((sessionClaims?.role as UserRole) !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: `${sessionClaims?.role} is not allowed` },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const params = {
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      role: searchParams.get("role") || undefined,
      isActive: searchParams.get("isActive") || undefined,
    };

    const validated = userQuerySchema.parse(params);

    const result = await queryBuilder({
      model: prisma.user,
      page: validated.page,
      limit: validated.limit,
      search: validated.search,
      searchFields: ["email", "username", "firstName", "lastName"],
      filters: {
        role: validated.role,
        isActive: validated.isActive,
      },
      sortBy: validated.sortBy,
      sortOrder: validated.sortOrder,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        isActive: true,
        imageUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { data: result, success: true, metadata: sessionClaims?.metadata },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

## Domain-Specific Examples
These examples are **not exported** by the package. Copy and adapt them to your own models and auth system.

### Role-Based Filters (Example Helper)
```ts
export type RoleBasedAccess = {
  role?: string;
  userId?: string;
  applyRoleFilter?: boolean;
};

export function buildRoleBasedFilters(
  role?: string,
  userId?: string
): Record<string, any> {
  const filters: Record<string, any> = {};

  if (role === "ADMIN") return filters;
  if (role === "USER" && userId) filters.userId = userId;
  if (role === "GUEST") filters.isActive = true;

  return filters;
}
```

Usage example:
```ts
const roleFilters = buildRoleBasedFilters(currentUser.role, currentUser.id);

const result = await queryBuilder({
  model: prisma.order,
  page: 1,
  limit: 20,
  filters: {
    status: "PAID",
    ...roleFilters,
  },
});
```

### Zod Schemas (Example)
```ts
import { z } from "zod";
import { paginationSchema, sortSchema, dateRangeSchema, numberRangeSchema } from "@websyro/prismapilot";

export const userQuerySchema = z.intersection(
  z.intersection(paginationSchema, sortSchema),
  z.object({
    search: z.string().optional(),
    role: z.enum(["USER", "ADMIN", "GUEST", "BASIC", "PRO"]).optional(),
    isActive: z.coerce.boolean().optional(),
  })
);

export const eventFilterSchema = z.object({
  status: z.enum(["UPCOMING", "LIVE", "PAST"]).optional(),
  mode: z.enum(["ONLINE", "ONSITE"]).optional(),
  startsAt: dateRangeSchema.optional(),
  amount: numberRangeSchema.optional(),
});
```

Usage example:
```ts
const params = {
  page: "1",
  limit: "10",
  search: "john",
  role: "USER",
  isActive: "true",
};

const validated = userQuerySchema.parse(params);

const result = await queryBuilder({
  model: prisma.user,
  page: validated.page,
  limit: validated.limit,
  search: validated.search,
  searchFields: ["email", "username", "firstName", "lastName"],
  filters: {
    role: validated.role,
    isActive: validated.isActive,
  },
});
```

### Source Files
`src/filters.examples.ts`  
`src/validation.examples.ts`

## Contributing
Contributions are welcome and appreciated. To keep things smooth:
1. Read `CONTRIBUTING.md` for setup, coding standards, and PR guidance.
2. Run tests before submitting (`npm run test`).
3. Optional integration tests: `npm run test:integration` (SQLite).
4. Optional PostgreSQL integration tests: `DATABASE_URL=... npm run test:integration:pg` (Docker).
   You can also set `DATABASE_URL` in a `.env` file.
5. Keep changes focused and add/update docs when behavior changes.

If you're unsure about a change, open an issue or start a discussion first.

## License
MIT License. See `LICENSE` for details.

## Author
Manoj Kumar (Software Engineer) - Websyro  
LinkedIn: `https://www.linkedin.com/in/manojofficialmj/`


