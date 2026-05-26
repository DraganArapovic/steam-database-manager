import { z } from "zod";

const EnvSchema = z.object({
  MONGODB_DB_NAME: z.string().min(1),
  MONGODB_URI: z.string().min(1),
  POSTGRES_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(3000),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export const loadConfig = (): AppConfig => EnvSchema.parse(process.env);
