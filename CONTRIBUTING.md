# Contributing to PrismaPilot

Thanks for your interest in contributing. This project aims to keep the core API generic and reusable for any Prisma schema.

Current verified database support: PostgreSQL and SQLite. Other Prisma providers may work but are not currently validated in this project.

## Guidelines
- Keep the public API generic and schema-agnostic.
- Domain-specific logic should go into example files.
- Write clear, minimal changes with tests when applicable.

## Setup
1. Fork the repository and clone your fork.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run tests:
   ```bash
   npm run test
   ```

## Development
- Run tests: `npm run test`
- Build: `npm run build`
- Lint: `npm run lint`
- Format: `npm run format`

## Pull Requests
- Use a clear title and description.
- Link related issues if applicable.
- Include tests for new functionality or behavior.
- Keep changes focused and small.

## Code Style
- TypeScript preferred
- Avoid domain-specific names in core modules
- Add comments only when logic is non-obvious

## License
By contributing, you agree that your contributions will be licensed under the MIT License.

## Maintainer
MANOJ KUMAR (Software Engineer) - Websyro
