import type { AppUserDocument } from "../types";
import {
  formatDate,
  formatMoney,
  toObjectIdString,
} from "../utils";
import {
  DeleteButton,
  DetailRow,
  EmptyState,
  PageHeader,
} from "./components";
import { Layout } from "./layout";

const userHref = (user: AppUserDocument): string =>
  `/users/${toObjectIdString(user._id)}`;

export const UsersListPage = ({ users }: { users: readonly AppUserDocument[] }) => (
  <Layout active="users" title="Users">
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
              <tr key={toObjectIdString(user._id)}>
                <td>
                  <strong>{user.username}</strong>
                </td>
                <td>{user.display_name}</td>
                <td>{user.email}</td>
                <td>{user.country_code ?? "N/A"}</td>
                <td>${formatMoney(user.wallet_balance)}</td>
                <td>
                  <span class={`badge ${user.is_banned ? "bg-danger" : "bg-success"}`}>
                    {user.is_banned ? "Banned" : "Active"}
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

export const NewUserPage = () => (
  <Layout active="users" title="Create User">
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

export const EditUserPage = ({ user }: { user: AppUserDocument }) => (
  <Layout active="users" title={`Edit ${user.username}`}>
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
              value={user.display_name}
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
              value={user.country_code ?? ""}
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
              value={formatMoney(user.wallet_balance)}
            />
          </div>
        </div>
        <div class="form-check mb-3">
          <input
            checked={user.is_banned}
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

export const UserDetailsPage = ({ user }: { user: AppUserDocument }) => (
  <Layout active="users" title={user.username}>
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
              <DetailRow label="Display Name" value={user.display_name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Country" value={user.country_code ?? "N/A"} />
              <DetailRow label="Created" value={formatDate(user.created_at)} />
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
                  <span class={`badge ${user.is_banned ? "bg-danger" : "bg-success"}`}>
                    {user.is_banned ? "Banned" : "Active"}
                  </span>
                }
              />
              <DetailRow
                label="Wallet Balance"
                value={`$${formatMoney(user.wallet_balance)}`}
              />
              <DetailRow label="Friends" value={`${user.friends.length} friends`} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
