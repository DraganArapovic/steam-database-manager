import { Decimal128, ObjectId } from "mongodb";
import { z } from "zod";

const zodObjectId = z
  .union([
    z.instanceof(ObjectId),
    z.string().regex(/^[0-9a-fA-F]{24}$/),
  ])
  .transform(val => (val instanceof ObjectId ? val : new ObjectId(val)));

const zodDecimal128 = z
  .union([
    z.instanceof(Decimal128),
    z.number(),
    z.string().regex(/^\d+(\.\d{1,2})?$/),
  ])
  .transform(val =>
    val instanceof Decimal128
      ? val
      : Decimal128.fromString(Number(val).toFixed(2)),
  );

const zodCountryCode = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/)
  .nullable();

const DeveloperSchema = z.object({
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

const PublisherSchema = z.object({
  name: z.string().min(1).max(128),
  country_code: zodCountryCode.optional().default(null),
});

const FriendEntrySchema = z.object({
  user_id: zodObjectId,
  status: z.enum(["pending", "accepted", "blocked"]),
  created_at: z.date(),
});

const GameSnapshotSchema = z.object({
  game_id: zodObjectId,
  title: z.string().min(1).max(255),
  base_price: zodDecimal128,
});

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

export const AppUserDocumentSchema = z.object({
  _id: zodObjectId,
  username: z.string().min(3).max(32).regex(/^\w+$/),
  email: z.email().max(255),
  password_hash: z.string().length(64),
  display_name: z.string().min(1).max(64),
  country_code: zodCountryCode.optional().default(null),
  wallet_balance: zodDecimal128,
  is_banned: z.boolean().default(false),
  created_at: z.date(),
  friends: z.array(FriendEntrySchema).default([]),
});

export const LibraryEntryDocumentSchema = z.object({
  _id: zodObjectId,
  user_id: zodObjectId,
  game_snapshot: GameSnapshotSchema,
  acquired_at: z.date(),
  playtime_minutes: z.number().int().nonnegative().default(0),
  last_played_at: z.date().nullable().optional().default(null),
  is_hidden: z.boolean().default(false),
});

export type GameDocument = z.infer<typeof GameDocumentSchema>;
export type AppUserDocument = z.infer<typeof AppUserDocumentSchema>;
export type LibraryEntryDocument = z.infer<typeof LibraryEntryDocumentSchema>;
