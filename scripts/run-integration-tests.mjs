import { execSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";

const dbPath = path.resolve("tests/integration/test.db");
const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

if (existsSync(dbPath)) {
  unlinkSync(dbPath);
}

const run = (cmd) => {
  execSync(cmd, {
    stdio: "inherit",
    shell: true,
  });
};

delete process.env.DATABASE_URL;
process.env.RUST_LOG = "debug";

run(`npx prisma db push --schema prisma/schema.prisma --url "${dbUrl}"`);
run("npx prisma generate --schema prisma/schema.prisma");

delete process.env.RUST_LOG;
process.env.DATABASE_URL = dbUrl;
run("npx vitest run -c vitest.integration.config.ts");
