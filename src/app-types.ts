import type { DatabaseContext } from "./db";

export interface AppEnv {
  Variables: {
    database: DatabaseContext;
  };
}
