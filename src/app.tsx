import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv } from "./app-types";
import type { DatabaseContext } from "./db";
import { AppError } from "./errors";
import { gamesRoutes } from "./routes/games";
import { homeRoutes } from "./routes/home";
import { libraryRoutes } from "./routes/library";
import { usersRoutes } from "./routes/users";
import { ErrorPage } from "./views/error";

export const createApp = (database: DatabaseContext): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();

  app.use("*", logger());
  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    c.set("database", database);
    await next();
  });

  app.route("/", homeRoutes);
  app.route("/users", usersRoutes);
  app.route("/games", gamesRoutes);
  app.route("/library", libraryRoutes);

  app.notFound(c =>
    c.html(<ErrorPage message="Page not found." status={404} />, 404),
  );

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.html(
        <ErrorPage message={error.message} status={error.status} />,
        error.status,
      );
    }

    console.error(error);
    return c.html(
      <ErrorPage message="An unexpected server error occurred." status={500} />,
      500,
    );
  });

  return app;
};
