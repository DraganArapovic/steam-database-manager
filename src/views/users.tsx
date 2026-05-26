import type { AppUser } from "../domain/models";
import { formatDate, formatMoney } from "../utils";
import {
  DeleteButton,
  DetailRow,
  EmptyState,
  PageHeader,
} from "./components";
import { Layout, type LayoutContext } from "./layout";

const userHref = (user: AppUser): string => `/users/${user.id}`;

export const UsersListPage = ({
  currentPath,
  databaseBackend,
  users,
}: LayoutContext & { users: readonly AppUser[] }) => (
  <Layout
    active="users"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title="Users"
  >
    <PageHeader
      action={
        <a class="btn btn-primary" href="/users/new">
          <i class="bi bi-plus-circle" /> Add New User
        </a>
      }
      icon="bi-people"
      title="Users"
    />

    {users.length === 0 ? (
      <EmptyState message="No users have been created yet." />
    ) : (
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Username</th>
              <th>Display Name</th>
              <th>Email</th>
              <th>Country</th>
              <th>Wallet Balance</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>
                  <strong>{user.username}</strong>
                </td>
                <td>{user.displayName}</td>
                <td>{user.email}</td>
                <td>{user.countryCode ?? "N/A"}</td>
                <td>${formatMoney(user.walletBalance)}</td>
                <td>
                  <span class={`badge ${user.isBanned ? "bg-danger" : "bg-success"}`}>
                    {user.isBanned ? "Banned" : "Active"}
                  </span>
                </td>
                <td class="action-buttons">
                  <a class="btn btn-sm btn-info" href={userHref(user)}>
                    <i class="bi bi-eye" />
                  </a>
                  <a class="btn btn-sm btn-warning" href={`${userHref(user)}/edit`}>
                    <i class="bi bi-pencil" />
                  </a>
                  <DeleteButton action={`${userHref(user)}/delete`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Layout>
);

export const NewUserPage = ({
  currentPath,
  databaseBackend,
}: LayoutContext) => (
  <Layout
    active="users"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title="Create User"
  >
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-person-plus" /> Create New User
      </h2>
      <form action="/users" method="post">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label" for="username">
              Username
            </label>
            <input class="form-control" id="username" name="username" required type="text" />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label" for="email">
              Email
            </label>
            <input class="form-control" id="email" name="email" required type="email" />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label" for="display_name">
              Display Name
            </label>
            <input
              class="form-control"
              id="display_name"
              name="display_name"
              required
              type="text"
            />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label" for="country_code">
              Country Code
            </label>
            <input
              class="form-control text-uppercase"
              id="country_code"
              maxLength={2}
              name="country_code"
              placeholder="US"
              type="text"
            />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label" for="wallet_balance">
              Wallet Balance ($)
            </label>
            <input
              class="form-control"
              id="wallet_balance"
              min="0"
              name="wallet_balance"
              step="0.01"
              type="number"
              value="0.00"
            />
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label" for="password">
            Password
          </label>
          <input
            class="form-control"
            id="password"
            minLength={8}
            name="password"
            required
            type="password"
          />
        </div>
        <button class="btn btn-primary" type="submit">
          Create User
        </button>
        <a class="btn btn-secondary ms-2" href="/users">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const EditUserPage = ({
  currentPath,
  databaseBackend,
  user,
}: LayoutContext & { user: AppUser }) => (
  <Layout
    active="users"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title={`Edit ${user.username}`}
  >
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-pencil-square" /> Edit User
      </h2>
      <form action={`${userHref(user)}/update`} method="post">
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label" for="username">
              Username
            </label>
            <input
              class="form-control"
              id="username"
              name="username"
              required
              type="text"
              value={user.username}
            />
          </div>
          <div class="col-md-6 mb-3">
            <label class="form-label" for="email">
              Email
            </label>
            <input
              class="form-control"
              id="email"
              name="email"
              required
              type="email"
              value={user.email}
            />
          </div>
        </div>
        <div class="row">
          <div class="col-md-6 mb-3">
            <label class="form-label" for="display_name">
              Display Name
            </label>
            <input
              class="form-control"
              id="display_name"
              name="display_name"
              required
              type="text"
              value={user.displayName}
            />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label" for="country_code">
              Country Code
            </label>
            <input
              class="form-control text-uppercase"
              id="country_code"
              maxLength={2}
              name="country_code"
              type="text"
              value={user.countryCode ?? ""}
            />
          </div>
          <div class="col-md-3 mb-3">
            <label class="form-label" for="wallet_balance">
              Wallet Balance ($)
            </label>
            <input
              class="form-control"
              id="wallet_balance"
              min="0"
              name="wallet_balance"
              step="0.01"
              type="number"
              value={formatMoney(user.walletBalance)}
            />
          </div>
        </div>
        <div class="form-check mb-3">
          <input
            checked={user.isBanned}
            class="form-check-input"
            id="is_banned"
            name="is_banned"
            type="checkbox"
          />
          <label class="form-check-label" for="is_banned">
            Is Banned
          </label>
        </div>
        <button class="btn btn-primary" type="submit">
          Update User
        </button>
        <a class="btn btn-secondary ms-2" href="/users">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const UserDetailsPage = ({
  currentPath,
  databaseBackend,
  user,
}: LayoutContext & { user: AppUser }) => (
  <Layout
    active="users"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title={user.username}
  >
    <div class="card p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i class="bi bi-person" /> User Details
        </h2>
        <div>
          <a class="btn btn-warning" href={`${userHref(user)}/edit`}>
            <i class="bi bi-pencil" /> Edit
          </a>
          <a class="btn btn-secondary ms-2" href="/users">
            <i class="bi bi-arrow-left" /> Back
          </a>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <h5>Basic Information</h5>
          <table class="table">
            <tbody>
              <DetailRow label="Username" value={user.username} />
              <DetailRow label="Display Name" value={user.displayName} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Country" value={user.countryCode ?? "N/A"} />
              <DetailRow label="Created" value={formatDate(user.createdAt)} />
            </tbody>
          </table>
        </div>
        <div class="col-md-6">
          <h5>Account Status</h5>
          <table class="table">
            <tbody>
              <DetailRow
                label="Status"
                value={
                  <span class={`badge ${user.isBanned ? "bg-danger" : "bg-success"}`}>
                    {user.isBanned ? "Banned" : "Active"}
                  </span>
                }
              />
              <DetailRow
                label="Wallet Balance"
                value={`$${formatMoney(user.walletBalance)}`}
              />
              <DetailRow label="Friends" value={`${user.friends.length} friends`} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
