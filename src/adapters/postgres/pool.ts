import pg from "pg";

export type PostgresPool = pg.Pool;
export type PostgresClient = pg.Pool | pg.PoolClient;

export const createPostgresPool = (connectionString: string): PostgresPool =>
  new pg.Pool({ connectionString });
