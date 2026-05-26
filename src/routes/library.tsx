import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import type { AppEnv } from "../app-types";
import {
  CreateLibraryEntryFormSchema,
  UpdateLibraryEntryFormSchema,
  type CreateLibraryEntryForm,
  type UpdateLibraryEntryForm,
} from "../forms";
import { requireFound } from "../utils";
import { formValidationHook } from "../validation";
import {
  EditLibraryEntryPage,
  LibraryDetailsPage,
  LibraryListPage,
  NewLibraryEntryPage,
} from "../views/library";

export const libraryRoutes = new Hono<AppEnv>();

libraryRoutes.get("/", async c => {
  const entries = await c.get("repos").library.list();

  return c.html(
    <LibraryListPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      entries={entries}
    />,
  );
});

libraryRoutes.get("/new", async c => {
  const [users, gameList] = await Promise.all([
    c.get("repos").users.list(),
    c.get("repos").games.list(),
  ]);

  return c.html(
    <NewLibraryEntryPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      games={gameList}
      users={users}
    />,
  );
});

libraryRoutes.post(
  "/",
  sValidator(
    "form",
    CreateLibraryEntryFormSchema,
    formValidationHook<CreateLibraryEntryForm>(
      "Create library entry failed",
      "library",
    ),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").library.create(form);

    return c.redirect("/library");
  },
);

libraryRoutes.get("/:id", async c => {
  const entry = requireFound(
    await c.get("repos").library.findById(c.req.param("id")),
    "Library entry",
  );

  return c.html(
    <LibraryDetailsPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      entry={entry}
    />,
  );
});

libraryRoutes.get("/:id/edit", async c => {
  const entry = requireFound(
    await c.get("repos").library.findById(c.req.param("id")),
    "Library entry",
  );

  return c.html(
    <EditLibraryEntryPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      entry={entry}
    />,
  );
});

libraryRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    UpdateLibraryEntryFormSchema,
    formValidationHook<UpdateLibraryEntryForm>(
      "Update library entry failed",
      "library",
    ),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").library.update(c.req.param("id"), form);

    return c.redirect("/library");
  },
);

libraryRoutes.post("/:id/delete", async c => {
  await c.get("repos").library.delete(c.req.param("id"));

  return c.redirect("/library");
});
