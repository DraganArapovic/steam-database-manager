import "dotenv/config";

import { serve } from "@hono/node-server";

import { createMongoRepositories } from "./adapters/mongo/repositories";
import { createPostgresPool } from "./adapters/postgres/pool";
import { createPostgresRepositories } from "./adapters/postgres/repositories";
import { createApp } from "./app";
import { loadConfig } from "./config";
import { connectDatabase } from "./db";

const config = loadConfig();
const mongoDatabase = await connectDatabase(config);
const postgresPool = createPostgresPool(config.POSTGRES_URL);
const app = createApp({
  mongo: createMongoRepositories(mongoDatabase),
  postgres: createPostgresRepositories(postgresPool),
});

serve({
  fetch: app.fetch,
  port: config.PORT,
});

console.log(
  `Steam V2 manager running on http://localhost:${config.PORT.toString()}`,
);
