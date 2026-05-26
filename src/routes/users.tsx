import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import type { AppEnv } from "../app-types";
import {
  CreateUserFormSchema,
  UpdateUserFormSchema,
  type CreateUserForm,
  type UpdateUserForm,
} from "../forms";
import { requireFound } from "../utils";
import { formValidationHook } from "../validation";
import {
  EditUserPage,
  NewUserPage,
  UserDetailsPage,
  UsersListPage,
} from "../views/users";

export const usersRoutes = new Hono<AppEnv>();

usersRoutes.get("/", async c => {
  const users = await c.get("repos").users.list();

  return c.html(
    <UsersListPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      users={users}
    />,
  );
});

usersRoutes.get("/new", c =>
  c.html(
    <NewUserPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
    />,
  ),
);

usersRoutes.post(
  "/",
  sValidator(
    "form",
    CreateUserFormSchema,
    formValidationHook<CreateUserForm>("Create user failed", "users"),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").users.create(form);

    return c.redirect("/users");
  },
);

usersRoutes.get("/:id", async c => {
  const user = requireFound(
    await c.get("repos").users.findById(c.req.param("id")),
    "User",
  );

  return c.html(
    <UserDetailsPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      user={user}
    />,
  );
});

usersRoutes.get("/:id/edit", async c => {
  const user = requireFound(
    await c.get("repos").users.findById(c.req.param("id")),
    "User",
  );

  return c.html(
    <EditUserPage
      currentPath={c.req.path}
      databaseBackend={c.get("dbBackend")}
      user={user}
    />,
  );
});

usersRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    UpdateUserFormSchema,
    formValidationHook<UpdateUserForm>("Update user failed", "users"),
  ),
  async c => {
    const form = c.req.valid("form");
    await c.get("repos").users.update(c.req.param("id"), form);

    return c.redirect("/users");
  },
);

usersRoutes.post("/:id/delete", async c => {
  await c.get("repos").users.delete(c.req.param("id"));

  return c.redirect("/users");
});
