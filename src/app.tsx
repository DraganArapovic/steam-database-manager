import { Hono } from "hono";
import { getCookie, setCookie } from "hono/cookie";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

import type { AppEnv } from "./app-types";
import type { DatabaseBackend } from "./domain/models";
import { AppError } from "./errors";
import type { RepositoryRegistry } from "./repositories/types";
import { gamesRoutes } from "./routes/games";
import { homeRoutes } from "./routes/home";
import { libraryRoutes } from "./routes/library";
import { usersRoutes } from "./routes/users";
import { ErrorPage } from "./views/error";

const DB_BACKEND_COOKIE = "db_backend";

const parseBackend = (value: string | undefined): DatabaseBackend =>
  value === "postgres" ? "postgres" : "mongo";

const safeReturnTo = (value: unknown): string =>
  typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/";

export const createApp = (
  repositories: RepositoryRegistry,
): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();

  app.use("*", logger());
  app.use("*", secureHeaders());
  app.use("*", async (c, next) => {
    const backend = parseBackend(getCookie(c, DB_BACKEND_COOKIE));
    c.set("dbBackend", backend);
    c.set("repos", repositories[backend]);
    await next();
  });

  app.post("/settings/database", async c => {
    const body = await c.req.parseBody();
    const backend = parseBackend(
      typeof body["backend"] === "string" ? body["backend"] : undefined,
    );

    setCookie(c, DB_BACKEND_COOKIE, backend, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "Lax",
    });

    return c.redirect(safeReturnTo(body["returnTo"]));
  });

  app.route("/", homeRoutes);
  app.route("/users", usersRoutes);
  app.route("/games", gamesRoutes);
  app.route("/library", libraryRoutes);

  app.notFound(c =>
    c.html(
      <ErrorPage
        currentPath={c.req.path}
        databaseBackend={c.get("dbBackend")}
        message="Page not found."
        status={404}
      />,
      404,
    ),
  );

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.html(
        <ErrorPage
          currentPath={c.req.path}
          databaseBackend={c.get("dbBackend")}
          message={error.message}
          status={error.status}
        />,
        error.status,
      );
    }

    console.error(error);
    return c.html(
      <ErrorPage
        currentPath={c.req.path}
        databaseBackend={c.get("dbBackend")}
        message="An unexpected server error occurred."
        status={500}
      />,
      500,
    );
  });

  return app;
};
