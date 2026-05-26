import type {
  AppUser,
  EntityId,
  Game,
  LibraryEntry,
  UserFriend,
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
import { hashPassword, requireFound } from "../../utils";
import type { PostgresClient, PostgresPool } from "./pool";

type GameRow = {
  age_rating: number | null;
  base_price: number | string;
  description: string | null;
  developer_country_code: string | null;
  developer_founded_year: number | null;
  developer_name: string;
  game_id: number;
  genres: string[] | string | null;
  is_early_access: boolean;
  platforms: string[] | string | null;
  publisher_country_code: string | null;
  publisher_name: string;
  release_date: Date | string | null;
  title: string;
};

type UserRow = {
  country_code: string | null;
  created_at: Date | string;
  display_name: string;
  email: string;
  is_banned: boolean;
  password_hash: string;
  user_id: number;
  username: string;
  wallet_balance: number | string;
};

type FriendRow = {
  addressee_id: number;
  created_at: Date | string;
  requester_id: number;
  status: "accepted" | "blocked" | "pending";
};

type LibraryRow = {
  acquired_at: Date | string;
  game_base_price: number | string;
  game_id: number;
  game_title: string;
  is_hidden: boolean;
  last_played_at: Date | string | null;
  playtime_minutes: number;
  user_email: string | null;
  user_id: number;
  user_username: string | null;
};

type DatabaseError = Error & {
  code?: string;
};

const INTEGER_ID_PATTERN = /^\d+$/;
const LIBRARY_ID_PATTERN = /^(\d+):(\d+)$/;

const isDatabaseError = (error: unknown): error is DatabaseError =>
  error instanceof Error;

const parsePostgresId = (id: EntityId, label: string): number => {
  if (!INTEGER_ID_PATTERN.test(id)) {
    throw new AppError(400, `Invalid ${label}. Expected a positive integer.`);
  }

  return Number(id);
};

const encodeLibraryId = (userId: number, gameId: number): EntityId =>
  `${userId.toString()}:${gameId.toString()}`;

const parseLibraryId = (
  id: EntityId,
): {
  gameId: number;
  userId: number;
} => {
  const match = LIBRARY_ID_PATTERN.exec(id);
  if (match === null) {
    throw new AppError(
      400,
      "Invalid library entry id. Expected userId:gameId.",
    );
  }

  return {
    gameId: Number(match[2]),
    userId: Number(match[1]),
  };
};

const asDate = (value: Date | string | null): Date | null => {
  if (value === null) return null;
  return value instanceof Date ? value : new Date(value);
};

const asRequiredDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

const asNumber = (value: number | string): number => Number(value);

const asStringArray = (value: string[] | string | null): string[] => {
  if (value === null) return [];
  if (Array.isArray(value)) return value;

  return value
    .replace(/^{|}$/g, "")
    .split(",")
    .map(item => item.trim().replace(/^"|"$/g, ""))
    .filter(item => item.length > 0);
};

const toGame = (row: GameRow): Game => ({
  ageRating: row.age_rating,
  basePrice: asNumber(row.base_price),
  description: row.description,
  developer: {
    countryCode: row.developer_country_code,
    foundedYear: row.developer_founded_year,
    name: row.developer_name,
  },
  genres: asStringArray(row.genres),
  id: row.game_id.toString(),
  isEarlyAccess: row.is_early_access,
  platforms: asStringArray(row.platforms),
  publisher: {
    countryCode: row.publisher_country_code,
    name: row.publisher_name,
  },
  releaseDate: asDate(row.release_date),
  title: row.title,
});

const toLibraryUserSummary = (row: LibraryRow): UserSummary | null =>
  row.user_email === null || row.user_username === null
    ? null
    : {
        email: row.user_email,
        id: row.user_id.toString(),
        username: row.user_username,
      };

const toUser = (
  row: UserRow,
  friends: readonly UserFriend[] = [],
): AppUser => ({
  countryCode: row.country_code,
  createdAt: asRequiredDate(row.created_at),
  displayName: row.display_name,
  email: row.email,
  friends: [...friends],
  id: row.user_id.toString(),
  isBanned: row.is_banned,
  passwordHash: row.password_hash,
  username: row.username,
  walletBalance: asNumber(row.wallet_balance),
});

const toLibraryEntry = (row: LibraryRow): LibraryEntry => ({
  acquiredAt: asRequiredDate(row.acquired_at),
  game: null,
  gameBasePrice: asNumber(row.game_base_price),
  gameId: row.game_id.toString(),
  gameTitle: row.game_title,
  id: encodeLibraryId(row.user_id, row.game_id),
  isHidden: row.is_hidden,
  lastPlayedAt: asDate(row.last_played_at),
  playtimeMinutes: row.playtime_minutes,
  user: toLibraryUserSummary(row),
  userId: row.user_id.toString(),
});

const handleUniqueViolation = (error: unknown, resource: string): never => {
  if (isDatabaseError(error) && error.code === "23505") {
    throw new AppError(409, `${resource} already exists.`);
  }

  throw error;
};

const nextId = async (
  client: PostgresClient,
  table: string,
  column: string,
): Promise<number> => {
  const result = await client.query<{ next_id: number }>(
    `SELECT COALESCE(MAX(${column}), 0) + 1 AS next_id FROM ${table}`,
  );

  return Number(result.rows[0]?.next_id ?? 1);
};

const begin = async <T>(
  pool: PostgresPool,
  callback: (client: PostgresClient) => Promise<T>,
): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const gameSelect = `
  SELECT
    g.game_id,
    g.title,
    g.description,
    g.release_date,
    g.base_price,
    g.is_early_access,
    g.age_rating,
    d.name AS developer_name,
    d.country_code AS developer_country_code,
    d.founded_year AS developer_founded_year,
    p.name AS publisher_name,
    p.country_code AS publisher_country_code,
    COALESCE(
      ARRAY_AGG(DISTINCT ge.name ORDER BY ge.name)
        FILTER (WHERE ge.name IS NOT NULL),
      '{}'
    ) AS genres,
    COALESCE(
      ARRAY_AGG(DISTINCT pl.name ORDER BY pl.name)
        FILTER (WHERE pl.name IS NOT NULL),
      '{}'
    ) AS platforms
  FROM game g
  JOIN developer d ON d.developer_id = g.developer_id
  JOIN publisher p ON p.publisher_id = g.publisher_id
  LEFT JOIN game_genre gg ON gg.game_id = g.game_id
  LEFT JOIN genre ge ON ge.genre_id = gg.genre_id
  LEFT JOIN game_platform gp ON gp.game_id = g.game_id
  LEFT JOIN platform pl ON pl.platform_id = gp.platform_id
`;

const gameGroupBy = `
  GROUP BY
    g.game_id,
    d.developer_id,
    p.publisher_id
`;

const librarySelect = `
  SELECT
    le.user_id,
    le.game_id,
    le.acquired_at,
    le.playtime_minutes,
    le.last_played_at,
    le.is_hidden,
    g.title AS game_title,
    g.base_price AS game_base_price,
    u.username AS user_username,
    u.email AS user_email
  FROM library_entry le
  JOIN game g ON g.game_id = le.game_id
  JOIN app_user u ON u.user_id = le.user_id
`;

const upsertDeveloper = async (
  client: PostgresClient,
  form: GameForm,
): Promise<number> => {
  const existing = await client.query<{ developer_id: number }>(
    "SELECT developer_id FROM developer WHERE name = $1 ORDER BY developer_id LIMIT 1",
    [form.developer_name],
  );
  const existingId = existing.rows[0]?.developer_id;

  if (existingId !== undefined) {
    await client.query(
      `
        UPDATE developer
        SET name = $1, country_code = $2, founded_year = $3
        WHERE developer_id = $4
      `,
      [
        form.developer_name,
        form.developer_country,
        form.developer_founded,
        existingId,
      ],
    );

    return existingId;
  }

  const developerId = await nextId(client, "developer", "developer_id");
  await client.query(
    `
      INSERT INTO developer (developer_id, name, country_code, founded_year)
      VALUES ($1, $2, $3, $4)
    `,
    [
      developerId,
      form.developer_name,
      form.developer_country,
      form.developer_founded,
    ],
  );

  return developerId;
};

const upsertPublisher = async (
  client: PostgresClient,
  form: GameForm,
): Promise<number> => {
  const existing = await client.query<{ publisher_id: number }>(
    "SELECT publisher_id FROM publisher WHERE name = $1 ORDER BY publisher_id LIMIT 1",
    [form.publisher_name],
  );
  const existingId = existing.rows[0]?.publisher_id;

  if (existingId !== undefined) {
    await client.query(
      `
        UPDATE publisher
        SET name = $1, country_code = $2
        WHERE publisher_id = $3
      `,
      [form.publisher_name, form.publisher_country, existingId],
    );

    return existingId;
  }

  const publisherId = await nextId(client, "publisher", "publisher_id");
  await client.query(
    `
      INSERT INTO publisher (publisher_id, name, country_code)
      VALUES ($1, $2, $3)
    `,
    [publisherId, form.publisher_name, form.publisher_country],
  );

  return publisherId;
};

const getOrCreateGenre = async (
  client: PostgresClient,
  name: string,
): Promise<number> => {
  const existing = await client.query<{ genre_id: number }>(
    "SELECT genre_id FROM genre WHERE name = $1",
    [name],
  );
  const existingId = existing.rows[0]?.genre_id;
  if (existingId !== undefined) return existingId;

  const genreId = await nextId(client, "genre", "genre_id");
  await client.query("INSERT INTO genre (genre_id, name) VALUES ($1, $2)", [
    genreId,
    name,
  ]);

  return genreId;
};

const getOrCreatePlatform = async (
  client: PostgresClient,
  name: string,
): Promise<number> => {
  const existing = await client.query<{ platform_id: number }>(
    "SELECT platform_id FROM platform WHERE name = $1",
    [name],
  );
  const existingId = existing.rows[0]?.platform_id;
  if (existingId !== undefined) return existingId;

  const platformId = await nextId(client, "platform", "platform_id");
  await client.query(
    "INSERT INTO platform (platform_id, name) VALUES ($1, $2)",
    [platformId, name],
  );

  return platformId;
};

const syncGameGenres = async (
  client: PostgresClient,
  gameId: number,
  genreNames: readonly string[],
): Promise<void> => {
  await client.query("DELETE FROM game_genre WHERE game_id = $1", [gameId]);

  for (const genreName of genreNames) {
    const genreId = await getOrCreateGenre(client, genreName);
    await client.query(
      "INSERT INTO game_genre (game_id, genre_id) VALUES ($1, $2)",
      [gameId, genreId],
    );
  }
};

const syncGamePlatforms = async (
  client: PostgresClient,
  gameId: number,
  platformNames: readonly string[],
): Promise<void> => {
  await client.query("DELETE FROM game_platform WHERE game_id = $1", [gameId]);

  for (const platformName of platformNames) {
    const platformId = await getOrCreatePlatform(client, platformName);
    await client.query(
      "INSERT INTO game_platform (game_id, platform_id) VALUES ($1, $2)",
      [gameId, platformId],
    );
  }
};

class PostgresGameRepository implements GameRepository {
  constructor(private readonly pool: PostgresPool) {}

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM game",
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async create(form: GameForm): Promise<EntityId> {
    try {
      return await begin(this.pool, async client => {
        const [developerId, publisherId] = await Promise.all([
          upsertDeveloper(client, form),
          upsertPublisher(client, form),
        ]);
        const gameId = await nextId(client, "game", "game_id");

        await client.query(
          `
            INSERT INTO game (
              game_id,
              title,
              description,
              release_date,
              base_price,
              is_early_access,
              age_rating,
              developer_id,
              publisher_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            gameId,
            form.title,
            form.description,
            form.release_date,
            form.base_price,
            form.is_early_access,
            form.age_rating,
            developerId,
            publisherId,
          ],
        );
        await syncGameGenres(client, gameId, form.genres);
        await syncGamePlatforms(client, gameId, form.platforms);

        return gameId.toString();
      });
    } catch (error) {
      return handleUniqueViolation(error, "Game");
    }
  }

  async delete(id: EntityId): Promise<void> {
    const gameId = parsePostgresId(id, "game id");

    await begin(this.pool, async client => {
      await client.query("DELETE FROM library_entry WHERE game_id = $1", [
        gameId,
      ]);
      await client.query("DELETE FROM game_genre WHERE game_id = $1", [gameId]);
      await client.query("DELETE FROM game_platform WHERE game_id = $1", [
        gameId,
      ]);
      await client.query("DELETE FROM game WHERE game_id = $1", [gameId]);
    });
  }

  async findById(id: EntityId): Promise<Game | null> {
    const gameId = parsePostgresId(id, "game id");
    const result = await this.pool.query<GameRow>(
      `
        ${gameSelect}
        WHERE g.game_id = $1
        ${gameGroupBy}
      `,
      [gameId],
    );

    const game = result.rows[0];
    return game === undefined ? null : toGame(game);
  }

  async list(): Promise<Game[]> {
    const result = await this.pool.query<GameRow>(
      `
        ${gameSelect}
        ${gameGroupBy}
        ORDER BY g.title ASC
      `,
    );

    return result.rows.map(toGame);
  }

  async update(id: EntityId, form: GameForm): Promise<void> {
    const gameId = parsePostgresId(id, "game id");

    try {
      await begin(this.pool, async client => {
        const existing = await client.query<{ game_id: number }>(
          "SELECT game_id FROM game WHERE game_id = $1",
          [gameId],
        );
        requireFound(existing.rows[0] ?? null, "Game");

        const [developerId, publisherId] = await Promise.all([
          upsertDeveloper(client, form),
          upsertPublisher(client, form),
        ]);

        await client.query(
          `
            UPDATE game
            SET
              title = $1,
              description = $2,
              release_date = $3,
              base_price = $4,
              is_early_access = $5,
              age_rating = $6,
              developer_id = $7,
              publisher_id = $8
            WHERE game_id = $9
          `,
          [
            form.title,
            form.description,
            form.release_date,
            form.base_price,
            form.is_early_access,
            form.age_rating,
            developerId,
            publisherId,
            gameId,
          ],
        );
        await syncGameGenres(client, gameId, form.genres);
        await syncGamePlatforms(client, gameId, form.platforms);
      });
    } catch (error) {
      handleUniqueViolation(error, "Game");
    }
  }
}

class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: PostgresPool) {}

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM app_user",
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async create(form: CreateUserForm): Promise<EntityId> {
    try {
      const userId = await nextId(this.pool, "app_user", "user_id");
      await this.pool.query(
        `
          INSERT INTO app_user (
            user_id,
            username,
            email,
            password_hash,
            display_name,
            country_code,
            wallet_balance,
            is_banned,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, NOW())
        `,
        [
          userId,
          form.username,
          form.email,
          hashPassword(form.password),
          form.display_name,
          form.country_code,
          form.wallet_balance,
        ],
      );

      return userId.toString();
    } catch (error) {
      return handleUniqueViolation(error, "User");
    }
  }

  async delete(id: EntityId): Promise<void> {
    const userId = parsePostgresId(id, "user id");

    await begin(this.pool, async client => {
      await client.query("DELETE FROM library_entry WHERE user_id = $1", [
        userId,
      ]);
      await client.query(
        "DELETE FROM friend WHERE requester_id = $1 OR addressee_id = $1",
        [userId],
      );
      await client.query("DELETE FROM app_user WHERE user_id = $1", [userId]);
    });
  }

  async findById(id: EntityId): Promise<AppUser | null> {
    const userId = parsePostgresId(id, "user id");
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM app_user WHERE user_id = $1",
      [userId],
    );
    const user = result.rows[0];

    if (user === undefined) return null;

    const friends = await this.pool.query<FriendRow>(
      `
        SELECT requester_id, addressee_id, status, created_at
        FROM friend
        WHERE requester_id = $1 OR addressee_id = $1
      `,
      [userId],
    );

    return toUser(
      user,
      friends.rows.map(friend => ({
        createdAt: asRequiredDate(friend.created_at),
        status: friend.status,
        userId:
          friend.requester_id === userId
            ? friend.addressee_id.toString()
            : friend.requester_id.toString(),
      })),
    );
  }

  async list(): Promise<AppUser[]> {
    const result = await this.pool.query<UserRow>(
      "SELECT * FROM app_user ORDER BY created_at DESC",
    );

    return result.rows.map(row => toUser(row));
  }

  async update(id: EntityId, form: UpdateUserForm): Promise<void> {
    const userId = parsePostgresId(id, "user id");

    try {
      const result = await this.pool.query(
        `
          UPDATE app_user
          SET
            username = $1,
            email = $2,
            display_name = $3,
            country_code = $4,
            wallet_balance = $5,
            is_banned = $6
          WHERE user_id = $7
        `,
        [
          form.username,
          form.email,
          form.display_name,
          form.country_code,
          form.wallet_balance,
          form.is_banned,
          userId,
        ],
      );

      requireFound(result.rowCount === 0 ? null : result, "User");
    } catch (error) {
      handleUniqueViolation(error, "User");
    }
  }
}

class PostgresLibraryRepository implements LibraryRepository {
  constructor(private readonly pool: PostgresPool) {}

  async count(): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM library_entry",
    );

    return Number(result.rows[0]?.count ?? 0);
  }

  async create(form: CreateLibraryEntryForm): Promise<EntityId> {
    const userId = parsePostgresId(form.user_id, "user id");
    const gameId = parsePostgresId(form.game_id, "game id");

    await begin(this.pool, async client => {
      const [user, game, existingEntry] = await Promise.all([
        client.query<UserRow>("SELECT * FROM app_user WHERE user_id = $1", [
          userId,
        ]),
        client.query<GameRow>(
          `
            ${gameSelect}
            WHERE g.game_id = $1
            ${gameGroupBy}
          `,
          [gameId],
        ),
        client.query(
          "SELECT 1 FROM library_entry WHERE user_id = $1 AND game_id = $2",
          [userId, gameId],
        ),
      ]);

      requireFound(user.rows[0] ?? null, "User");
      requireFound(game.rows[0] ?? null, "Game");
      if (existingEntry.rows[0] !== undefined) {
        throw new AppError(409, "User already owns this game.");
      }

      await client.query(
        `
          INSERT INTO library_entry (
            user_id,
            game_id,
            acquired_at,
            playtime_minutes,
            last_played_at,
            is_hidden
          )
          VALUES ($1, $2, NOW(), $3, $4, $5)
        `,
        [
          userId,
          gameId,
          form.playtime_minutes,
          form.playtime_minutes > 0 ? new Date() : null,
          form.is_hidden,
        ],
      );
    });

    return encodeLibraryId(userId, gameId);
  }

  async delete(id: EntityId): Promise<void> {
    const { gameId, userId } = parseLibraryId(id);
    await this.pool.query(
      "DELETE FROM library_entry WHERE user_id = $1 AND game_id = $2",
      [userId, gameId],
    );
  }

  async findById(id: EntityId): Promise<LibraryEntry | null> {
    const { gameId, userId } = parseLibraryId(id);
    const result = await this.pool.query<LibraryRow>(
      `
        ${librarySelect}
        WHERE le.user_id = $1 AND le.game_id = $2
      `,
      [userId, gameId],
    );

    const entry = result.rows[0];
    return entry === undefined ? null : toLibraryEntry(entry);
  }

  async list(): Promise<LibraryEntry[]> {
    const result = await this.pool.query<LibraryRow>(
      `
        ${librarySelect}
        ORDER BY le.acquired_at DESC
      `,
    );

    return result.rows.map(toLibraryEntry);
  }

  async update(id: EntityId, form: UpdateLibraryEntryForm): Promise<void> {
    const { gameId, userId } = parseLibraryId(id);
    const result = await this.pool.query(
      `
        UPDATE library_entry
        SET
          playtime_minutes = $1,
          last_played_at = $2,
          is_hidden = $3
        WHERE user_id = $4 AND game_id = $5
      `,
      [
        form.playtime_minutes,
        form.playtime_minutes > 0 ? new Date() : null,
        form.is_hidden,
        userId,
        gameId,
      ],
    );

    requireFound(result.rowCount === 0 ? null : result, "Library entry");
  }
}

export const createPostgresRepositories = (
  pool: PostgresPool,
): RepositoryBundle => ({
  backend: "postgres",
  games: new PostgresGameRepository(pool),
  library: new PostgresLibraryRepository(pool),
  users: new PostgresUserRepository(pool),
});
