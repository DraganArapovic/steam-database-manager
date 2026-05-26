export type DatabaseBackend = "mongo" | "postgres";

export type EntityId = string;

export type Developer = {
  countryCode: string | null;
  foundedYear: number | null;
  name: string;
};

export type Publisher = {
  countryCode: string | null;
  name: string;
};

export type Game = {
  ageRating: number | null;
  basePrice: number;
  description: string | null;
  developer: Developer;
  genres: string[];
  id: EntityId;
  isEarlyAccess: boolean;
  platforms: string[];
  publisher: Publisher;
  releaseDate: Date | null;
  title: string;
};

export type UserFriend = {
  createdAt: Date;
  status: "accepted" | "blocked" | "pending";
  userId: EntityId;
};

export type AppUser = {
  countryCode: string | null;
  createdAt: Date;
  displayName: string;
  email: string;
  friends: UserFriend[];
  id: EntityId;
  isBanned: boolean;
  passwordHash: string;
  username: string;
  walletBalance: number;
};

export type UserSummary = Pick<AppUser, "email" | "id" | "username">;

export type LibraryEntry = {
  acquiredAt: Date;
  game: Game | null;
  gameBasePrice: number;
  gameId: EntityId;
  gameTitle: string;
  id: EntityId;
  isHidden: boolean;
  lastPlayedAt: Date | null;
  playtimeMinutes: number;
  user: UserSummary | null;
  userId: EntityId;
};
