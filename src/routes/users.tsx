import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { ObjectId } from "mongodb";

import type { AppEnv } from "../app-types";
import {
  CreateUserFormSchema,
  UpdateUserFormSchema,
  type CreateUserForm,
  type UpdateUserForm,
} from "../forms";
import {
  AppUserDocumentSchema,
  type AppUserDocument,
} from "../types";
import {
  hashPassword,
  parseObjectId,
  requireFound,
  toDecimal128,
} from "../utils";
import { formValidationHook } from "../validation";
import {
  EditUserPage,
  NewUserPage,
  UserDetailsPage,
  UsersListPage,
} from "../views/users";

export const usersRoutes = new Hono<AppEnv>();

const createUserDocument = (form: CreateUserForm): AppUserDocument => {
  const user = {
    _id: new ObjectId(),
    country_code: form.country_code,
    created_at: new Date(),
    display_name: form.display_name,
    email: form.email,
    friends: [],
    is_banned: false,
    password_hash: hashPassword(form.password),
    username: form.username,
    wallet_balance: toDecimal128(form.wallet_balance),
  };

  return AppUserDocumentSchema.parse(user);
};

const userUpdateFromForm = (form: UpdateUserForm) => ({
  country_code: form.country_code,
  display_name: form.display_name,
  email: form.email,
  is_banned: form.is_banned,
  username: form.username,
  wallet_balance: toDecimal128(form.wallet_balance),
});

usersRoutes.get("/", async c => {
  const { appUsers } = c.get("database").collections;
  const users = await appUsers.find().sort({ created_at: -1 }).toArray();

  return c.html(<UsersListPage users={users} />);
});

usersRoutes.get("/new", c => c.html(<NewUserPage />));

usersRoutes.post(
  "/",
  sValidator(
    "form",
    CreateUserFormSchema,
    formValidationHook<CreateUserForm>("Create user failed", "users"),
  ),
  async c => {
    const { appUsers } = c.get("database").collections;
    const form = c.req.valid("form");
    const user = createUserDocument(form);

    await appUsers.insertOne(user);

    return c.redirect("/users");
  },
);

usersRoutes.get("/:id", async c => {
  const { appUsers } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "user id");
  const user = requireFound(await appUsers.findOne({ _id: id }), "User");

  return c.html(<UserDetailsPage user={user} />);
});

usersRoutes.get("/:id/edit", async c => {
  const { appUsers } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "user id");
  const user = requireFound(await appUsers.findOne({ _id: id }), "User");

  return c.html(<EditUserPage user={user} />);
});

usersRoutes.post(
  "/:id/update",
  sValidator(
    "form",
    UpdateUserFormSchema,
    formValidationHook<UpdateUserForm>("Update user failed", "users"),
  ),
  async c => {
    const { appUsers } = c.get("database").collections;
    const id = parseObjectId(c.req.param("id"), "user id");
    const form = c.req.valid("form");

    const result = await appUsers.updateOne(
      { _id: id },
      { $set: userUpdateFromForm(form) },
    );

    requireFound(result.matchedCount === 0 ? null : result, "User");

    return c.redirect("/users");
  },
);

usersRoutes.post("/:id/delete", async c => {
  const {
    appUsers,
    libraryEntries,
  } = c.get("database").collections;
  const id = parseObjectId(c.req.param("id"), "user id");

  await Promise.all([
    appUsers.deleteOne({ _id: id }),
    libraryEntries.deleteMany({ user_id: id }),
  ]);

  return c.redirect("/users");
});
