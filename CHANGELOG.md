# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to Semantic Versioning.

## [1.0.0] - 2026-02-03

### Added
- Generic query builder that works with any Prisma model
- Offset-based pagination with `queryBuilder`
- Cursor-based pagination with `cursorQueryBuilder`
- Search helpers with case-insensitive contains
- Filtering helpers (exact, range, enum, boolean, array)
- Single and multi-field sorting
- Count queries for stats
- Aggregate queries (sum, avg, min, max)
- TypeScript types
- Optional Zod validation schemas

### Added - Advanced Module
- Query caching (in-memory and custom stores)
- Performance monitoring with slow query detection
- Soft delete helpers
- Multi-tenant helpers
- Batch query operations
- Export to CSV/JSON
- Query presets
- Webhook integration
- GroupBy aggregation helper

### Database Support (Verified)
- PostgreSQL
- SQLite

### Database Support (Unverified)
- MySQL
- MongoDB
- CockroachDB

### Package Managers
- npm
- yarn
- pnpm
- bun

### Documentation
- README
- CHANGELOG

## [Unreleased]

- Planned: more adapters, helpers, and examples

## Contributors
- MANOJ KUMAR (Software Engineer) - Websyro

## License
MIT License - see LICENSE file

## Links
- GitHub Repository: https://github.com/websyro/prismapilot
- NPM Package: https://www.npmjs.com/package/@websyro/prismapilot
- Documentation: https://github.com/websyro/prismapilot#readme
- Issue Tracker: https://github.com/websyro/prismapilot/issues
