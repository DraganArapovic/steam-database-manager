import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { ObjectId } from "mongodb";

import type { AppEnv } from "../app-types";
import {
  CreateLibraryEntryFormSchema,
  UpdateLibraryEntryFormSchema,
  type CreateLibraryEntryForm,
  type UpdateLibraryEntryForm,
} from "../forms";
import {
  LibraryEntryDocumentSchema,
  type AppUserDocument,
  type GameDocument,
  type LibraryEntryDocument,
} from "../types";
import { AppError } from "../errors";
import {
  parseObjectId,
  requireFound,
  toObjectIdString,
} from "../utils";
import { formValidationHook } from "../validation";
import {
  EditLibraryEntryPage,
  LibraryDetailsPage,
  LibraryListPage,
  NewLibraryEntryPage,
  type LibraryEntryView,
} from "../views/library";

export const libraryRoutes = new Hono<AppEnv>();

type UserSummary = Pick<AppUserDocument, "_id" | "email" | "username">;

const summarizeUser = (user: AppUserDocument): UserSummary => ({
  _id: user._id,
  email: user.email,
  username: user.username,
});

const enrichEntriesWithUsers = async (
  entries: readonly LibraryEntryDocument[],
  usersCollection: AppEnv["Variables"]["database"]["collections"]["appUsers"],
): Promise<LibraryEntryView[]> => {
  const userIds = [
    ...new Map(entries.map(entry => [toObjectIdString(entry.user_id), entry.user_id])).values(),
  ];

  const users =
    userIds.length === 0
      ? []
      : await usersCollection.find({ _id: { $in: userIds } }).toArray();
  const userById = new Map(
    users.map(user => [toObjectIdString(user._id), summarizeUser(user)]),
  );

  return entries.map(entry => ({
    ...entry,
    user: userById.get(toObjectIdString(entry.user_id)) ?? null,
  }));
};

const createLibraryEntryDocument = ({
  form,
  game,
  user,
}: {
  form: CreateLibraryEntryForm;
  game: GameDocument;
  user: AppUserDocument;
}): LibraryEntryDocument => {
  const now = new Date();
  const entry = {
    _id: new ObjectId(),
    acquired_at: now,
    game_snapshot: {
      base_price: game.base_price,
      game_id: game._id,
      title: game.title,
    },
    is_hidden: form.is_hidden,
    last_played_at: form.playtime_minutes > 0 ? now : null,
    playtime_minutes: form.playtime_minutes,
    user_id: user._id,
  };

  return LibraryEntryDocumentSchema.parse(entry);
};

libraryRoutes.get("/", async c => {
  const {
    appUsers,
    libraryEntries,
  } = c.get("database").collections;
  const entries = await libraryEntries.find().sort({ acquired_at: -1 }).toArray();
  const enrichedEntries = await enrichEntriesWithUsers(entries, appUsers);

  return c.html(<LibraryListPage entries={enrichedEntries} />);
});

libraryRoutes.get("/new", async c => {
  const {
    appUsers,
    games,
  } = c.get("database").collections;
  const [users, gameList] = await Promise.all([
    appUsers.find().sort({ username: 1 }).toArray(),
    games.find().sort({ title: 1 }).toArray(),
  ]);

  return c.html(<NewLibraryEntryPage games={gameList} users={users} />);
});

libraryRoutes.post(
  "/",
  sValidator(
    "form",
    CreateLibraryEntryFormSchema,
    formValidationHook<CreateLibraryEntryForm>(
      "Create library entry failed",
      "library",
    ),
  ),
  async c => {
    const {
      appUsers,
      games,
      libraryEntries,
    } = c.get("database").collections;
    const form = c.req.valid("form");
    const userId = parseObjectId(form.user_id, "user id");
    const gameId = parseObjectId(form.game_id, "game id");
    const [user, game, existingEntry] = await Promise.all([
      appUsers.findOne({ _id: userId }),
      games.findOne({ _id: gameId }),
      libraryEntries.findOne({
        "game_snapshot.game_id": gameId,
        user_id: userId,
      }),
    ]);

    const foundUser = requireFound(user, "User");
    const foundGame = requireFound(game, "Game");
    if (existingEntry !== null) {
      throw new AppError(409, "User already owns this game.");
    }

    const entry = createLibraryEntryDocument({
      form,
      game: foundGame,
      user: foundUser,
    });
    await libraryEntries.insertOne(entry);

    return c.redirect("/library");
  },
);

libraryRoutes.get("/:id", async c => {
  const {
    appUsers,
    games,
    libraryEntries,
  } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "library entry id");
  const entry = requireFound(
    await libraryEntries.findOne({ _id: id }),
    "Library entry",
  );

  const [user, game] = await Promise.all([
    appUsers.findOne({ _id: entry.user_id }),
    games.findOne({ _id: entry.game_snapshot.game_id }),
  ]);

  return c.html(
    <LibraryDetailsPage
      entry={{
        ...entry,
        game,
        user: user === null ? null : summarizeUser(user),
      }}
    />,
  );
});

libraryRoutes.get("/:id/edit", async c => {
  const { libraryEntries } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "library entry id");
  const entry = requireFound(
    await libraryEntries.findOne({ _id: id }),
    "Library entry",
  );

  return c.html(<EditLibraryEntryPage entry={entry} />);
});

libraryRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    UpdateLibraryEntryFormSchema,
    formValidationHook<UpdateLibraryEntryForm>(
      "Update library entry failed",
      "library",
    ),
  ),
  async c => {
    const { libraryEntries } = c.get("database").collections;
    const id = parseObjectId(c.req.param("id"), "library entry id");
    const form = c.req.valid("form");
    const result = await libraryEntries.updateOne(
      { _id: id },
      {
        $set: {
          is_hidden: form.is_hidden,
          last_played_at: form.playtime_minutes > 0 ? new Date() : null,
          playtime_minutes: form.playtime_minutes,
        },
      },
    );

    requireFound(result.matchedCount === 0 ? null : result, "Library entry");

    return c.redirect("/library");
  },
);

libraryRoutes.post("/:id/delete", async c => {
  const { libraryEntries } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "library entry id");
  await libraryEntries.deleteOne({ _id: id });

  return c.redirect("/library");
});
