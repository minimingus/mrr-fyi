import { execSync } from "child_process";
import { config } from "dotenv";

export async function setup() {
  // Load test env vars
  config({ path: ".env.test", override: true });

  // Push the Prisma schema to the test database
  execSync("npx prisma db push --accept-data-loss", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
}
