import { ObjectId, Decimal128 } from "mongodb";
import { z } from "zod";

// =============================================================================
// Steam v2.0 – Zod sheme i TypeScript tipovi (normalizirana MongoDB shema)
//
// Organizacija:
//   1. Zod helpers – custom tipovi za ObjectId i Decimal128
//   2. Embedded sheme – Developer, Publisher, Friend, GameSnapshot
//   3. Dokument sheme – Game, AppUser, LibraryEntry (DB razina, s ObjectId/_id)
//   4. Input sheme – validacija API request body-ja (bez _id, s number umjesto Decimal128)
//   5. TypeScript tipovi – inferrani iz Zod shema
//
// Upotreba:
//   - GameInputSchema.parse(req.body)  → validacija u Express routeu
//   - GameDocument                     → tip koji vraća MongoDB driver
// =============================================================================

// ---------------------------------------------------------------------------
// 1. Zod helpers
// ---------------------------------------------------------------------------

// ObjectId: prihvaća ObjectId instancu ili 24-znakni hex string,
// uvijek vraća ObjectId instancu.
const zodObjectId = z
  .union([
    z.instanceof(ObjectId),
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Mora biti 24-znakni hex string"),
  ])
  .transform(val => (val instanceof ObjectId ? val : new ObjectId(val)));

// Decimal128: na API razini prima number ili string, konvertira u Decimal128.
// MongoDB driver vraća Decimal128 objekte iz baze – za aritmetiku koristiti
// parseFloat(decimal128.toString()).
const zodDecimal128 = z
  .union([
    z.instanceof(Decimal128),
    z.number(),
    z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, "Mora biti decimalni broj s max 2 decimale"),
  ])
  .transform(val => {
    if (val instanceof Decimal128) return val;
    return Decimal128.fromString(Number(val).toFixed(2));
  });

// Novčana vrijednost na input razini (JSON request body): samo number
const zodMoney = z.number().nonnegative().multipleOf(0.01);

// ISO date string → Date objekt (za JSON request body)
const zodDateInput = z
  .union([z.date(), z.iso.datetime()])
  .transform(v => new Date(v));

// country_code: točno 2 velika slova (ISO 3166-1 alpha-2)
const zodCountryCode = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/)
  .nullable();

// ---------------------------------------------------------------------------
// 2. Embedded sheme
// ---------------------------------------------------------------------------

// Ekvivalent: tablica developer (embedded u game)
export const DeveloperSchema = z.object({
  name: z.string().min(1).max(128),
  country_code: zodCountryCode.optional().default(null),
  founded_year: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .nullable()
    .optional()
    .default(null),
});

// Ekvivalent: tablica publisher (embedded u game)
export const PublisherSchema = z.object({
  name: z.string().min(1).max(128),
  country_code: zodCountryCode.optional().default(null),
});

// Ekvivalent: redak u friend tablici (embedded u app_user.friends[])
// Napomena: user_id ovdje je ObjectId referenca na drugog korisnika.
// CHECK (user ne može biti prijatelj sam sa sobom) nije izraziv u Zodu –
// mora se provjeriti u aplikacijskoj logici prije inserта.
export const FriendEntrySchema = z.object({
  user_id: zodObjectId,
  status: z.enum(["pending", "accepted", "blocked"]),
  created_at: z.date(),
});

// Snapshot igre u library_entry – denormalizirani podaci za brzi read
export const GameSnapshotSchema = z.object({
  game_id: zodObjectId,
  title: z.string().min(1).max(255),
  base_price: zodDecimal128,
});

// ---------------------------------------------------------------------------
// 3. Dokument sheme (DB razina – što MongoDB driver vraća)
// ---------------------------------------------------------------------------

// Kolekcija: game
export const GameDocumentSchema = z.object({
  _id: zodObjectId,
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional().default(null),
  release_date: z.date().nullable().optional().default(null),
  base_price: zodDecimal128,
  is_early_access: z.boolean().default(false),
  age_rating: z
    .number()
    .int()
    .min(0)
    .max(21)
    .nullable()
    .optional()
    .default(null),
  developer: DeveloperSchema,
  publisher: PublisherSchema,
  genres: z.array(z.string().min(1).max(64)).default([]),
  platforms: z.array(z.string().min(1).max(32)).default([]),
});

// Kolekcija: app_user
export const AppUserDocumentSchema = z.object({
  _id: zodObjectId,
  username: z.string().min(3).max(32).regex(/^\w+$/, "Samo slova, brojevi i _"),
  email: z.email().max(255),
  password_hash: z.string().length(64),
  display_name: z.string().min(1).max(64),
  country_code: zodCountryCode.optional().default(null),
  wallet_balance: zodDecimal128,
  is_banned: z.boolean().default(false),
  created_at: z.date(),
  friends: z.array(FriendEntrySchema).default([]),
});

// Kolekcija: library_entry
export const LibraryEntryDocumentSchema = z.object({
  _id: zodObjectId,
  user_id: zodObjectId,
  game_snapshot: GameSnapshotSchema,
  acquired_at: z.date(),
  playtime_minutes: z.number().int().nonnegative().default(0),
  last_played_at: z.date().nullable().optional().default(null),
  is_hidden: z.boolean().default(false),
});

// ---------------------------------------------------------------------------
// 4. Input sheme (API request body validacija u Express routeima)
//
// Razlike od Document shema:
//   - nema _id (generira MongoDB)
//   - nema created_at / acquired_at (generira server)
//   - Decimal128 → number (JSON ne podržava Decimal128)
//   - ObjectId → string (JSON ne podržava ObjectId)
//   - password_hash zamjenjen s password (server hasha)
// ---------------------------------------------------------------------------

export const CreateGameSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().nullable().optional(),
  release_date: zodDateInput.nullable().optional(),
  base_price: zodMoney,
  is_early_access: z.boolean().default(false),
  age_rating: z.number().int().min(0).max(21).nullable().optional(),
  developer: DeveloperSchema,
  publisher: PublisherSchema,
  genres: z.array(z.string().min(1).max(64)).default([]),
  platforms: z.array(z.string().min(1).max(32)).default([]),
});

export const UpdateGameSchema = CreateGameSchema.partial();

export const CreateUserSchema = z.object({
  username: z.string().min(3).max(32).regex(/^\w+$/, "Samo slova, brojevi i _"),
  email: z.email().max(255),
  password: z.string().min(8).max(128), // plaintext – server hasha u password_hash
  display_name: z.string().min(1).max(64),
  country_code: zodCountryCode.optional(),
});

export const UpdateUserSchema = z.object({
  display_name: z.string().min(1).max(64).optional(),
  country_code: zodCountryCode.optional(),
  wallet_balance: zodMoney.optional(), // top-up/withdraw operacija
});

export const AddFriendSchema = z.object({
  addressee_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Mora biti 24-znakni hex ObjectId string"),
});

export const UpdateFriendStatusSchema = z.object({
  status: z.enum(["accepted", "blocked"]), // "pending" se ne može ručno postaviti
});

export const AddLibraryEntrySchema = z.object({
  game_id: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Mora biti 24-znakni hex ObjectId string"),
  // acquired_at, playtime_minutes, is_hidden generira/defaulta server
});

export const UpdateLibraryEntrySchema = z.object({
  playtime_minutes: z.number().int().nonnegative().optional(),
  last_played_at: zodDateInput.nullable().optional(),
  is_hidden: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// 5. TypeScript tipovi (inferrani iz Zod shema)
// ---------------------------------------------------------------------------

// Embedded tipovi
export type Developer = z.infer<typeof DeveloperSchema>;
export type Publisher = z.infer<typeof PublisherSchema>;
export type FriendEntry = z.infer<typeof FriendEntrySchema>;
export type GameSnapshot = z.infer<typeof GameSnapshotSchema>;

// Dokument tipovi (što MongoDB driver vraća)
export type GameDocument = z.infer<typeof GameDocumentSchema>;
export type AppUserDocument = z.infer<typeof AppUserDocumentSchema>;
export type LibraryEntryDocument = z.infer<typeof LibraryEntryDocumentSchema>;

// Input tipovi (što Express route prima u req.body)
export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type UpdateGameInput = z.infer<typeof UpdateGameSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AddFriendInput = z.infer<typeof AddFriendSchema>;
export type UpdateFriendStatusInput = z.infer<typeof UpdateFriendStatusSchema>;
export type AddLibraryEntryInput = z.infer<typeof AddLibraryEntrySchema>;
export type UpdateLibraryEntryInput = z.infer<typeof UpdateLibraryEntrySchema>;

// Tip koji se šalje klijentu (bez password_hash, s Decimal128 → number)
// Koristiti u response serialization middlewareu
export type GameResponse = Omit<GameDocument, "base_price" | "_id"> & {
  _id: string;
  base_price: number;
};

export type AppUserResponse = Omit<
  AppUserDocument,
  "password_hash" | "wallet_balance" | "_id" | "friends"
> & {
  _id: string;
  wallet_balance: number;
  friends: (Omit<FriendEntry, "user_id"> & { user_id: string })[];
};

export type LibraryEntryResponse = Omit<
  LibraryEntryDocument,
  "_id" | "user_id" | "game_snapshot"
> & {
  _id: string;
  user_id: string;
  game_snapshot: Omit<GameSnapshot, "game_id" | "base_price"> & {
    game_id: string;
    base_price: number;
  };
};
