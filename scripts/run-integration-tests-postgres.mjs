import "dotenv/config";
import { execSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for PostgreSQL integration tests.");
}

const run = (cmd) => {
  execSync(cmd, {
    stdio: "inherit",
    shell: true,
  });
};

run(`npx prisma db push --schema prisma/schema.postgres.prisma --url "${databaseUrl}"`);
run("npx prisma generate --schema prisma/schema.postgres.prisma");
run("npx vitest run -c vitest.integration.pg.config.ts");
