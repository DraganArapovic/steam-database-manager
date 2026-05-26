import { Hono } from "hono";

import type { AppEnv } from "../app-types";
import { HomePage } from "../views/home";

export const homeRoutes = new Hono<AppEnv>();

homeRoutes.get("/", async c => {
  const {
    collections: { appUsers, games, libraryEntries },
  } = c.get("database");

  const [users, gamesCount, libraryEntriesCount] = await Promise.all([
    appUsers.countDocuments(),
    games.countDocuments(),
    libraryEntries.countDocuments(),
  ]);

  return c.html(
    <HomePage
      stats={{
        games: gamesCount,
        libraryEntries: libraryEntriesCount,
        users,
      }}
    />,
  );
});
