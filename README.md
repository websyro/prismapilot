# PrismaPilot

A generic, schema-agnostic query builder for Prisma. It provides pagination, search, filters, sorting, and optional helpers while keeping the public API clean and reusable across projects.

## Features
- Works with any Prisma model
- Offset and cursor pagination
- Search helpers (case-insensitive contains)
- Filter helpers (exact, ranges, arrays, booleans)
- Optional Zod validation schemas
- Advanced utilities in a separate module

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
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  include?: any;
  select?: any;
};
```

### Utilities
- Pagination: `getPagination`, `getCursorPagination`, `calculateTotalPages`, `processCursorResults`
- Search: `buildSearchQuery`, `buildNestedSearchQuery`, `buildExactSearch`, `buildPrefixSearch`
- Filters: `buildFilters`, `buildDateRangeFilter`, `buildNumberRangeFilter`, `buildRelationFilters`, `buildNotFilters`, `combineFilters`, `combineFiltersWithOr`

## Examples

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

## Domain-Specific Examples
This package stays generic by default. If you need role-based filters or model-specific schemas, use the example files in the repo:
- `src/filters.examples.ts`
- `src/validation.examples.ts`

These are not exported by the package. Copy and adapt them to your own models and auth system.

## Scripts
```bash
npm run test
npm run build
npm publish --access public
```

## Contributing
See `CONTRIBUTING.md`.

## License
MIT

## Author
MANOJ KUMAR (Software Engineer) - Websyro

LinkedIn: `https://www.linkedin.com/in/manojofficialmj/`
