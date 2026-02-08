/**
 * @package prismapilot
 * @description Universal query builder for Prisma with search, filter, sort, and pagination
 * @author Websyro
 * @license MIT
 */

// Main query builders
export {
  queryBuilder,
  cursorQueryBuilder,
  advancedQueryBuilder,
  countQuery,
  aggregateQuery,
} from './query-builder';

// Utilities
export {
  getPagination,
  getCursorPagination,
  calculateTotalPages,
  processCursorResults,
} from './pagination';

export {
  buildSearchQuery,
  buildNestedSearchQuery,
  buildExactSearch,
  buildPrefixSearch,
} from './search';

export {
  buildFilters,
  buildDateRangeFilter,
  buildNumberRangeFilter,
  buildRelationFilters,
  buildNotFilters,
  combineFilters,
  combineFiltersWithOr,
} from './filters';

// Types
export type {
  PaginationParams,
  CursorPaginationParams,
  SortParams,
  SearchParams,
  FilterParams,
  RelationFilterParams,
  DateRangeFilter,
  NumberRangeFilter,
  QueryBuilderResponse,
  CursorQueryBuilderResponse,
} from './query-types';

// Validation schemas (optional - users can create their own)
export {
  paginationSchema,
  cursorPaginationSchema,
  sortSchema,
  searchSchema,
  dateRangeSchema,
  numberRangeSchema,
  genericQuerySchema,
} from './validation';

export type {
  PaginationInput,
  CursorPaginationInput,
  SortInput,
  SearchInput,
  DateRangeInput,
  NumberRangeInput,
} from './validation';

// Version
export const VERSION = '1.1.3';
export const PACKAGE_NAME = '@websyro/prismapilot';
