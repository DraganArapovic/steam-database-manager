import "dotenv/config";

import { serve } from "@hono/node-server";

import { createApp } from "./app";
import { loadConfig } from "./config";
import { connectDatabase } from "./db";

const config = loadConfig();
const database = await connectDatabase(config);
const app = createApp(database);

serve({
  fetch: app.fetch,
  port: config.PORT,
});

console.log(
  `Steam V2 manager running on http://localhost:${config.PORT.toString()}`,
);
