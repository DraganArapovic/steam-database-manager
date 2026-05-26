import { MongoClient, type Collection, type Db } from "mongodb";

import type { AppConfig } from "./config";
import type {
  AppUserDocument,
  GameDocument,
  LibraryEntryDocument,
} from "./types";

export interface Collections {
  appUsers: Collection<AppUserDocument>;
  games: Collection<GameDocument>;
  libraryEntries: Collection<LibraryEntryDocument>;
}

export interface DatabaseContext {
  client: MongoClient;
  collections: Collections;
  db: Db;
}

export const connectDatabase = async (
  config: AppConfig
): Promise<DatabaseContext> => {
  const client = new MongoClient(config.MONGODB_URI);
  await client.connect();

  const db = client.db(config.MONGODB_DB_NAME);

  return {
    client,
    collections: {
      appUsers: db.collection<AppUserDocument>("app_user"),
      games: db.collection<GameDocument>("game"),
      libraryEntries: db.collection<LibraryEntryDocument>("library_entry"),
    },
    db,
  };
};
