import type { DatabaseBackend } from "./domain/models";
import type { RepositoryBundle } from "./repositories/types";

export interface AppEnv {
  Variables: {
    dbBackend: DatabaseBackend;
    repos: RepositoryBundle;
  };
}
