import { z } from "zod";

const ENTITY_ID_PATTERN = /^([0-9a-fA-F]{24}|\d+)$/;

const stringFromForm = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const requiredString = (min = 1, max = 255) =>
  z.preprocess(stringFromForm, z.string().min(min).max(max));

const nullableString = (max = 255) =>
  z.preprocess(
    value => stringFromForm(value) ?? null,
    z.string().max(max).nullable(),
  );

const entityIdString = z.preprocess(
  stringFromForm,
  z
    .string()
    .regex(ENTITY_ID_PATTERN, "Expected a MongoDB ObjectId or PostgreSQL id."),
);

const checkboxBoolean = z.preprocess(
  value => value === "on" || value === "true" || value === true,
  z.boolean(),
);

const moneyNumber = z.preprocess(value => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : 0;
}, z.number().nonnegative().multipleOf(0.01));

const intNumber = (minimum: number, maximum?: number) =>
  z.preprocess(value => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return minimum;

    const trimmed = value.trim();
    return trimmed.length > 0 ? Number(trimmed) : minimum;
  }, maximum === undefined ? z.number().int().min(minimum) : z.number().int().min(minimum).max(maximum));

const nullableIntNumber = (minimum: number, maximum: number) =>
  z.preprocess(value => {
    if (typeof value === "number") return value;
    if (typeof value !== "string") return null;

    const trimmed = value.trim();
    return trimmed.length > 0 ? Number(trimmed) : null;
  }, z.number().int().min(minimum).max(maximum).nullable());

const nullableYear = z.preprocess(value => {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? Number(trimmed) : null;
}, z.number().int().min(1800).max(new Date().getFullYear()).nullable());

const nullableCountryCode = z.preprocess(value => {
  const text = stringFromForm(value);
  return text === undefined ? null : text.toUpperCase();
}, z.string().length(2).regex(/^[A-Z]{2}$/).nullable());

const nullableDate = z.preprocess(value => {
  const text = stringFromForm(value);
  return text === undefined ? null : new Date(`${text}T00:00:00.000Z`);
}, z.date().nullable());

const commaList = (maxItemLength: number) =>
  z.preprocess(value => {
    const text = stringFromForm(value);
    if (text === undefined) return [];

    return text
      .split(",")
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }, z.array(z.string().min(1).max(maxItemLength)));

export const CreateUserFormSchema = z.object({
  country_code: nullableCountryCode,
  display_name: requiredString(1, 64),
  email: requiredString(1, 255).pipe(z.email().max(255)),
  password: requiredString(8, 128),
  username: requiredString(3, 32).pipe(
    z.string().regex(/^\w+$/, "Only letters, numbers, and underscores are allowed."),
  ),
  wallet_balance: moneyNumber,
});

export const UpdateUserFormSchema = z.object({
  country_code: nullableCountryCode,
  display_name: requiredString(1, 64),
  email: requiredString(1, 255).pipe(z.email().max(255)),
  is_banned: checkboxBoolean,
  username: requiredString(3, 32).pipe(
    z.string().regex(/^\w+$/, "Only letters, numbers, and underscores are allowed."),
  ),
  wallet_balance: moneyNumber,
});

export const GameFormSchema = z.object({
  age_rating: nullableIntNumber(0, 21),
  base_price: moneyNumber,
  description: nullableString(2_000),
  developer_country: nullableCountryCode,
  developer_founded: nullableYear,
  developer_name: requiredString(1, 128),
  genres: commaList(64),
  is_early_access: checkboxBoolean,
  platforms: commaList(32),
  publisher_country: nullableCountryCode,
  publisher_name: requiredString(1, 128),
  release_date: nullableDate,
  title: requiredString(1, 255),
});

export const CreateLibraryEntryFormSchema = z.object({
  game_id: entityIdString,
  is_hidden: checkboxBoolean,
  playtime_minutes: intNumber(0),
  user_id: entityIdString,
});

export const UpdateLibraryEntryFormSchema = z.object({
  is_hidden: checkboxBoolean,
  playtime_minutes: intNumber(0),
});

export type CreateLibraryEntryForm = z.infer<
  typeof CreateLibraryEntryFormSchema
>;
export type CreateUserForm = z.infer<typeof CreateUserFormSchema>;
export type GameForm = z.infer<typeof GameFormSchema>;
export type UpdateLibraryEntryForm = z.infer<
  typeof UpdateLibraryEntryFormSchema
>;
export type UpdateUserForm = z.infer<typeof UpdateUserFormSchema>;
