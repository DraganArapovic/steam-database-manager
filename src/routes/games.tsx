import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { ObjectId } from "mongodb";

import type { AppEnv } from "../app-types";
import { GameFormSchema, type GameForm } from "../forms";
import { GameDocumentSchema, type GameDocument } from "../types";
import {
  parseObjectId,
  requireFound,
  toDecimal128,
} from "../utils";
import { formValidationHook } from "../validation";
import {
  EditGamePage,
  GameDetailsPage,
  GamesListPage,
  NewGamePage,
} from "../views/games";

export const gamesRoutes = new Hono<AppEnv>();

const gameDocumentFromForm = (form: GameForm, id = new ObjectId()): GameDocument => {
  const game = {
    _id: id,
    age_rating: form.age_rating,
    base_price: toDecimal128(form.base_price),
    description: form.description,
    developer: {
      country_code: form.developer_country,
      founded_year: form.developer_founded,
      name: form.developer_name,
    },
    genres: form.genres,
    is_early_access: form.is_early_access,
    platforms: form.platforms,
    publisher: {
      country_code: form.publisher_country,
      name: form.publisher_name,
    },
    release_date: form.release_date,
    title: form.title,
  };

  return GameDocumentSchema.parse(game);
};

gamesRoutes.get("/", async c => {
  const { games } = c.get("database").collections;
  const gameList = await games.find().sort({ title: 1 }).toArray();

  return c.html(<GamesListPage games={gameList} />);
});

gamesRoutes.get("/new", c => c.html(<NewGamePage />));

gamesRoutes.post(
  "/",
  sValidator(
    "form",
    GameFormSchema,
    formValidationHook<GameForm>("Create game failed", "games"),
  ),
  async c => {
    const { games } = c.get("database").collections;
    const form = c.req.valid("form");
    const game = gameDocumentFromForm(form);

    await games.insertOne(game);

    return c.redirect("/games");
  },
);

gamesRoutes.get("/:id", async c => {
  const { games } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "game id");
  const game = requireFound(await games.findOne({ _id: id }), "Game");

  return c.html(<GameDetailsPage game={game} />);
});

gamesRoutes.get("/:id/edit", async c => {
  const { games } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "game id");
  const game = requireFound(await games.findOne({ _id: id }), "Game");

  return c.html(<EditGamePage game={game} />);
});

gamesRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    GameFormSchema,
    formValidationHook<GameForm>("Update game failed", "games"),
  ),
  async c => {
    const {
      games,
      libraryEntries,
    } = c.get("database").collections;
    const id = parseObjectId(c.req.param("id"), "game id");
    const form = c.req.valid("form");
    const game = gameDocumentFromForm(form, id);

    const result = await games.replaceOne({ _id: id }, game);
    requireFound(result.matchedCount === 0 ? null : result, "Game");

    await libraryEntries.updateMany(
      { "game_snapshot.game_id": id },
      {
        $set: {
          "game_snapshot.base_price": game.base_price,
          "game_snapshot.title": game.title,
        },
      },
    );

    return c.redirect("/games");
  },
);

gamesRoutes.post("/:id/delete", async c => {
  const {
    games,
    libraryEntries,
  } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "game id");

  await Promise.all([
    games.deleteOne({ _id: id }),
    libraryEntries.deleteMany({ "game_snapshot.game_id": id }),
  ]);

  return c.redirect("/games");
});
