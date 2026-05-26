import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import type { AppEnv } from "../app-types";
import { GameFormSchema, type GameForm } from "../forms";
import { requireFound } from "../utils";
import { formValidationHook } from "../validation";
import {
  EditGamePage,
  GameDetailsPage,
  GamesListPage,
  NewGamePage,
} from "../views/games";

export const gamesRoutes = new Hono<AppEnv>();

gamesRoutes.get("/", async c => {
  const gameList = await c.get("repos").games.list();

  return c.html(
    <GamesListPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      games={gameList}
    />,
  );
});

gamesRoutes.get("/new", c =>
  c.html(
    <NewGamePage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
    />,
  ),
);

gamesRoutes.post(
  "/",
  sValidator(
    "form",
    GameFormSchema,
    formValidationHook<GameForm>("Create game failed", "games"),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").games.create(form);

    return c.redirect("/games");
  },
);

gamesRoutes.get("/:id", async c => {
  const game = requireFound(
    await c.get("repos").games.findById(c.req.param("id")),
    "Game",
  );

  return c.html(
    <GameDetailsPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      game={game}
    />,
  );
});

gamesRoutes.get("/:id/edit", async c => {
  const game = requireFound(
    await c.get("repos").games.findById(c.req.param("id")),
    "Game",
  );

  return c.html(
    <EditGamePage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      game={game}
    />,
  );
});

gamesRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    GameFormSchema,
    formValidationHook<GameForm>("Update game failed", "games"),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").games.update(c.req.param("id"), form);

    return c.redirect("/games");
  },
);

gamesRoutes.post("/:id/delete", async c => {
  await c.get("repos").games.delete(c.req.param("id"));

  return c.redirect("/games");
});
