import type { AppUser, Game, LibraryEntry } from "../domain/models";
import {
  formatDate,
  formatDateTime,
  formatMoney,
} from "../utils";
import {
  DeleteButton,
  DetailRow,
  EmptyState,
  PageHeader,
} from "./components";
import { Layout, type LayoutContext } from "./layout";

const libraryHref = (entry: LibraryEntry): string => `/library/${entry.id}`;

export const LibraryListPage = ({
  currentPath,
  databaseBackend,
  entries,
}: LayoutContext & {
  entries: readonly LibraryEntry[];
}) => (
  <Layout
    active="library"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title="Library"
  >
    <PageHeader
      action={
        <a class="btn btn-primary" href="/library/new">
          <i class="bi bi-plus-circle" /> Add New Entry
        </a>
      }
      icon="bi-collection"
      title="Library Entries"
    />

    {entries.length === 0 ? (
      <EmptyState message="No library entries have been created yet." />
    ) : (
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Game</th>
              <th>User</th>
              <th>Playtime (min)</th>
              <th>Acquired</th>
              <th>Last Played</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map(entry => (
              <tr key={entry.id}>
                <td>
                  <strong>{entry.gameTitle}</strong>
                </td>
                <td>{entry.user?.username ?? "Unknown User"}</td>
                <td>{entry.playtimeMinutes}</td>
                <td>{formatDate(entry.acquiredAt)}</td>
                <td>{formatDateTime(entry.lastPlayedAt)}</td>
                <td>
                  <span class={`badge ${entry.isHidden ? "bg-secondary" : "bg-success"}`}>
                    {entry.isHidden ? "Hidden" : "Visible"}
                  </span>
                </td>
                <td class="action-buttons">
                  <a class="btn btn-sm btn-info" href={libraryHref(entry)}>
                    <i class="bi bi-eye" />
                  </a>
                  <a
                    class="btn btn-sm btn-warning"
                    href={`${libraryHref(entry)}/edit`}
                  >
                    <i class="bi bi-pencil" />
                  </a>
                  <DeleteButton action={`${libraryHref(entry)}/delete`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Layout>
);

export const NewLibraryEntryPage = ({
  currentPath,
  databaseBackend,
  games,
  users,
}: LayoutContext & {
  games: readonly Game[];
  users: readonly AppUser[];
}) => (
  <Layout
    active="library"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title="Add Library Entry"
  >
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-plus-circle" /> Add Library Entry
      </h2>
      <form action="/library" method="post">
        <div class="mb-3">
          <label class="form-label" for="user_id">
            User
          </label>
          <select class="form-select" id="user_id" name="user_id" required>
            <option value="">Select User</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.username} ({user.email})
              </option>
            ))}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="game_id">
            Game
          </label>
          <select class="form-select" id="game_id" name="game_id" required>
            <option value="">Select Game</option>
            {games.map(game => (
              <option key={game.id} value={game.id}>
                {game.title}
              </option>
            ))}
          </select>
        </div>
        <div class="mb-3">
          <label class="form-label" for="playtime_minutes">
            Playtime (minutes)
          </label>
          <input
            class="form-control"
            id="playtime_minutes"
            min="0"
            name="playtime_minutes"
            type="number"
            value="0"
          />
        </div>
        <div class="form-check mb-3">
          <input class="form-check-input" id="is_hidden" name="is_hidden" type="checkbox" />
          <label class="form-check-label" for="is_hidden">
            Hide in Library
          </label>
        </div>
        <button class="btn btn-primary" type="submit">
          Create Entry
        </button>
        <a class="btn btn-secondary ms-2" href="/library">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const EditLibraryEntryPage = ({
  currentPath,
  databaseBackend,
  entry,
}: LayoutContext & {
  entry: LibraryEntry;
}) => (
  <Layout
    active="library"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title={`Edit ${entry.gameTitle}`}
  >
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-pencil-square" /> Edit Library Entry
      </h2>
      <form action={`${libraryHref(entry)}/update`} method="post">
        <div class="mb-3">
          <label class="form-label" for="game_title">
            Game
          </label>
          <input
            class="form-control"
            disabled
            id="game_title"
            type="text"
            value={entry.gameTitle}
          />
        </div>
        <div class="mb-3">
          <label class="form-label" for="playtime_minutes">
            Playtime (minutes)
          </label>
          <input
            class="form-control"
            id="playtime_minutes"
            min="0"
            name="playtime_minutes"
            type="number"
            value={entry.playtimeMinutes}
          />
        </div>
        <div class="form-check mb-3">
          <input
            checked={entry.isHidden}
            class="form-check-input"
            id="is_hidden"
            name="is_hidden"
            type="checkbox"
          />
          <label class="form-check-label" for="is_hidden">
            Hide in Library
          </label>
        </div>
        <button class="btn btn-primary" type="submit">
          Update Entry
        </button>
        <a class="btn btn-secondary ms-2" href="/library">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const LibraryDetailsPage = ({
  currentPath,
  databaseBackend,
  entry,
}: LayoutContext & {
  entry: LibraryEntry;
}) => (
  <Layout
    active="library"
    currentPath={currentPath}
    databaseBackend={databaseBackend}
    title={entry.gameTitle}
  >
    <div class="card p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i class="bi bi-collection" /> Library Entry Details
        </h2>
        <div>
          <a class="btn btn-warning" href={`${libraryHref(entry)}/edit`}>
            <i class="bi bi-pencil" /> Edit
          </a>
          <a class="btn btn-secondary ms-2" href="/library">
            <i class="bi bi-arrow-left" /> Back
          </a>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <h5>Entry Information</h5>
          <table class="table">
            <tbody>
              <DetailRow label="Game" value={entry.gameTitle} />
              <DetailRow label="User" value={entry.user?.username ?? "Unknown User"} />
              <DetailRow
                label="Playtime"
                value={`${entry.playtimeMinutes} minutes`}
              />
              <DetailRow
                label="Visibility"
                value={
                  <span
                    class={`badge ${entry.isHidden ? "bg-secondary" : "bg-success"}`}
                  >
                    {entry.isHidden ? "Hidden" : "Visible"}
                  </span>
                }
              />
            </tbody>
          </table>
        </div>
        <div class="col-md-6">
          <h5>Dates</h5>
          <table class="table">
            <tbody>
              <DetailRow label="Acquired" value={formatDateTime(entry.acquiredAt)} />
              <DetailRow
                label="Last Played"
                value={formatDateTime(entry.lastPlayedAt)}
              />
              <DetailRow
                label="Price at Acquisition"
                value={`$${formatMoney(entry.gameBasePrice)}`}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
