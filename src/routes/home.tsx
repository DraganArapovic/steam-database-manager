import { Hono } from "hono";

import type { AppEnv } from "../app-types";
import { HomePage } from "../views/home";

export const homeRoutes = new Hono<AppEnv>();

homeRoutes.get("/", async c => {
  const { games, library, users: userRepository } = c.get("repos");

  const [usersCount, gamesCount, libraryEntriesCount] = await Promise.all([
    userRepository.count(),
    games.count(),
    library.count(),
  ]);

  return c.html(
    <HomePage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      stats={{
        games: gamesCount,
        libraryEntries: libraryEntriesCount,
        users: usersCount,
      }}
    />,
  );
});
