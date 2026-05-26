import { ObjectId } from "mongodb";

import type {
  AppUser,
  EntityId,
  Game,
  LibraryEntry,
  UserSummary,
} from "../../domain/models";
import { AppError } from "../../errors";
import type {
  CreateLibraryEntryForm,
  CreateUserForm,
  GameForm,
  UpdateLibraryEntryForm,
  UpdateUserForm,
} from "../../forms";
import type {
  GameRepository,
  LibraryRepository,
  RepositoryBundle,
  UserRepository,
} from "../../repositories/types";
import {
  AppUserDocumentSchema,
  GameDocumentSchema,
  LibraryEntryDocumentSchema,
  type AppUserDocument,
  type GameDocument,
  type LibraryEntryDocument,
} from "../../types";
import {
  decimalToNumber,
  hashPassword,
  parseObjectId,
  requireFound,
  toDecimal128,
  toObjectIdString,
} from "../../utils";
import type { DatabaseContext } from "../../db";

const toGame = (game: GameDocument): Game => ({
  ageRating: game.age_rating,
  basePrice: decimalToNumber(game.base_price),
  description: game.description,
  developer: {
    countryCode: game.developer.country_code,
    foundedYear: game.developer.founded_year,
    name: game.developer.name,
  },
  genres: game.genres,
  id: toObjectIdString(game._id),
  isEarlyAccess: game.is_early_access,
  platforms: game.platforms,
  publisher: {
    countryCode: game.publisher.country_code,
    name: game.publisher.name,
  },
  releaseDate: game.release_date,
  title: game.title,
});

const toUserSummary = (user: AppUserDocument): UserSummary => ({
  email: user.email,
  id: toObjectIdString(user._id),
  username: user.username,
});

const toUser = (user: AppUserDocument): AppUser => ({
  countryCode: user.country_code,
  createdAt: user.created_at,
  displayName: user.display_name,
  email: user.email,
  friends: user.friends.map(friend => ({
    createdAt: friend.created_at,
    status: friend.status,
    userId: toObjectIdString(friend.user_id),
  })),
  id: toObjectIdString(user._id),
  isBanned: user.is_banned,
  passwordHash: user.password_hash,
  username: user.username,
  walletBalance: decimalToNumber(user.wallet_balance),
});

const toLibraryEntry = ({
  entry,
  game,
  user,
}: {
  entry: LibraryEntryDocument;
  game?: GameDocument | null;
  user?: AppUserDocument | null;
}): LibraryEntry => ({
  acquiredAt: entry.acquired_at,
  game: game === undefined || game === null ? null : toGame(game),
  gameBasePrice: decimalToNumber(entry.game_snapshot.base_price),
  gameId: toObjectIdString(entry.game_snapshot.game_id),
  gameTitle: entry.game_snapshot.title,
  id: toObjectIdString(entry._id),
  isHidden: entry.is_hidden,
  lastPlayedAt: entry.last_played_at,
  playtimeMinutes: entry.playtime_minutes,
  user: user === undefined || user === null ? null : toUserSummary(user),
  userId: toObjectIdString(entry.user_id),
});

const gameDocumentFromForm = (
  form: GameForm,
  id = new ObjectId(),
): GameDocument => {
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

const createUserDocument = (form: CreateUserForm): AppUserDocument => {
  const user = {
    _id: new ObjectId(),
    country_code: form.country_code,
    created_at: new Date(),
    display_name: form.display_name,
    email: form.email,
    friends: [],
    is_banned: false,
    password_hash: hashPassword(form.password),
    username: form.username,
    wallet_balance: toDecimal128(form.wallet_balance),
  };

  return AppUserDocumentSchema.parse(user);
};

const userUpdateFromForm = (form: UpdateUserForm) => ({
  country_code: form.country_code,
  display_name: form.display_name,
  email: form.email,
  is_banned: form.is_banned,
  username: form.username,
  wallet_balance: toDecimal128(form.wallet_balance),
});

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

class MongoGameRepository implements GameRepository {
  constructor(private readonly database: DatabaseContext) {}

  async count(): Promise<number> {
    return this.database.collections.games.countDocuments();
  }

  async create(form: GameForm): Promise<EntityId> {
    const game = gameDocumentFromForm(form);
    await this.database.collections.games.insertOne(game);
    return toObjectIdString(game._id);
  }

  async delete(id: EntityId): Promise<void> {
    const objectId = parseObjectId(id, "game id");

    await Promise.all([
      this.database.collections.games.deleteOne({ _id: objectId }),
      this.database.collections.libraryEntries.deleteMany({
        "game_snapshot.game_id": objectId,
      }),
    ]);
  }

  async findById(id: EntityId): Promise<Game | null> {
    const objectId = parseObjectId(id, "game id");
    const game = await this.database.collections.games.findOne({ _id: objectId });

    return game === null ? null : toGame(game);
  }

  async list(): Promise<Game[]> {
    const games = await this.database.collections.games
      .find()
      .sort({ title: 1 })
      .toArray();

    return games.map(toGame);
  }

  async update(id: EntityId, form: GameForm): Promise<void> {
    const objectId = parseObjectId(id, "game id");
    const game = gameDocumentFromForm(form, objectId);
    const result = await this.database.collections.games.replaceOne(
      { _id: objectId },
      game,
    );
    requireFound(result.matchedCount === 0 ? null : result, "Game");

    await this.database.collections.libraryEntries.updateMany(
      { "game_snapshot.game_id": objectId },
      {
        $set: {
          "game_snapshot.base_price": game.base_price,
          "game_snapshot.title": game.title,
        },
      },
    );
  }
}

class MongoUserRepository implements UserRepository {
  constructor(private readonly database: DatabaseContext) {}

  async count(): Promise<number> {
    return this.database.collections.appUsers.countDocuments();
  }

  async create(form: CreateUserForm): Promise<EntityId> {
    const user = createUserDocument(form);
    await this.database.collections.appUsers.insertOne(user);
    return toObjectIdString(user._id);
  }

  async delete(id: EntityId): Promise<void> {
    const objectId = parseObjectId(id, "user id");

    await Promise.all([
      this.database.collections.appUsers.deleteOne({ _id: objectId }),
      this.database.collections.libraryEntries.deleteMany({ user_id: objectId }),
    ]);
  }

  async findById(id: EntityId): Promise<AppUser | null> {
    const objectId = parseObjectId(id, "user id");
    const user = await this.database.collections.appUsers.findOne({
      _id: objectId,
    });

    return user === null ? null : toUser(user);
  }

  async list(): Promise<AppUser[]> {
    const users = await this.database.collections.appUsers
      .find()
      .sort({ created_at: -1 })
      .toArray();

    return users.map(toUser);
  }

  async update(id: EntityId, form: UpdateUserForm): Promise<void> {
    const objectId = parseObjectId(id, "user id");
    const result = await this.database.collections.appUsers.updateOne(
      { _id: objectId },
      { $set: userUpdateFromForm(form) },
    );

    requireFound(result.matchedCount === 0 ? null : result, "User");
  }
}

class MongoLibraryRepository implements LibraryRepository {
  constructor(private readonly database: DatabaseContext) {}

  async count(): Promise<number> {
    return this.database.collections.libraryEntries.countDocuments();
  }

  async create(form: CreateLibraryEntryForm): Promise<EntityId> {
    const userId = parseObjectId(form.user_id, "user id");
    const gameId = parseObjectId(form.game_id, "game id");
    const [user, game, existingEntry] = await Promise.all([
      this.database.collections.appUsers.findOne({ _id: userId }),
      this.database.collections.games.findOne({ _id: gameId }),
      this.database.collections.libraryEntries.findOne({
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
    await this.database.collections.libraryEntries.insertOne(entry);

    return toObjectIdString(entry._id);
  }

  async delete(id: EntityId): Promise<void> {
    const objectId = parseObjectId(id, "library entry id");
    await this.database.collections.libraryEntries.deleteOne({ _id: objectId });
  }

  async findById(id: EntityId): Promise<LibraryEntry | null> {
    const objectId = parseObjectId(id, "library entry id");
    const entry = await this.database.collections.libraryEntries.findOne({
      _id: objectId,
    });

    if (entry === null) return null;

    const [user, game] = await Promise.all([
      this.database.collections.appUsers.findOne({ _id: entry.user_id }),
      this.database.collections.games.findOne({
        _id: entry.game_snapshot.game_id,
      }),
    ]);

    return toLibraryEntry({ entry, game, user });
  }

  async list(): Promise<LibraryEntry[]> {
    const entries = await this.database.collections.libraryEntries
      .find()
      .sort({ acquired_at: -1 })
      .toArray();
    const userIds = [
      ...new Map(
        entries.map(entry => [toObjectIdString(entry.user_id), entry.user_id]),
      ).values(),
    ];
    const users =
      userIds.length === 0
        ? []
        : await this.database.collections.appUsers
            .find({ _id: { $in: userIds } })
            .toArray();
    const usersById = new Map(
      users.map(user => [toObjectIdString(user._id), user]),
    );

    return entries.map(entry =>
      toLibraryEntry({
        entry,
        user: usersById.get(toObjectIdString(entry.user_id)) ?? null,
      }),
    );
  }

  async update(id: EntityId, form: UpdateLibraryEntryForm): Promise<void> {
    const objectId = parseObjectId(id, "library entry id");
    const result = await this.database.collections.libraryEntries.updateOne(
      { _id: objectId },
      {
        $set: {
          is_hidden: form.is_hidden,
          last_played_at: form.playtime_minutes > 0 ? new Date() : null,
          playtime_minutes: form.playtime_minutes,
        },
      },
    );

    requireFound(result.matchedCount === 0 ? null : result, "Library entry");
  }
}

export const createMongoRepositories = (
  database: DatabaseContext,
): RepositoryBundle => ({
  backend: "mongo",
  games: new MongoGameRepository(database),
  library: new MongoLibraryRepository(database),
  users: new MongoUserRepository(database),
});
