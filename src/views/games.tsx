import type { GameDocument } from "../types";
import {
  formatDate,
  formatMoney,
  toDateInputValue,
  toObjectIdString,
} from "../utils";
import {
  DeleteButton,
  DetailRow,
  EmptyState,
  PageHeader,
  Tags,
} from "./components";
import { Layout } from "./layout";

const gameHref = (game: GameDocument): string =>
  `/games/${toObjectIdString(game._id)}`;

const GameFormFields = ({ game }: { game?: GameDocument }) => (
  <>
    <div class="mb-3">
      <label class="form-label" for="title">
        Title
      </label>
      <input
        class="form-control"
        id="title"
        name="title"
        required
        type="text"
        value={game?.title ?? ""}
      />
    </div>
    <div class="mb-3">
      <label class="form-label" for="description">
        Description
      </label>
      <textarea class="form-control" id="description" name="description" rows={3}>
        {game?.description ?? ""}
      </textarea>
    </div>
    <div class="row">
      <div class="col-md-4 mb-3">
        <label class="form-label" for="release_date">
          Release Date
        </label>
        <input
          class="form-control"
          id="release_date"
          name="release_date"
          type="date"
          value={toDateInputValue(game?.release_date)}
        />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label" for="base_price">
          Base Price ($)
        </label>
        <input
          class="form-control"
          id="base_price"
          min="0"
          name="base_price"
          step="0.01"
          type="number"
          value={game === undefined ? "0.00" : formatMoney(game.base_price)}
        />
      </div>
      <div class="col-md-4 mb-3">
        <label class="form-label" for="age_rating">
          Age Rating
        </label>
        <input
          class="form-control"
          id="age_rating"
          max="21"
          min="0"
          name="age_rating"
          type="number"
          value={game?.age_rating ?? ""}
        />
      </div>
    </div>
    <div class="mb-3">
      <label class="form-label" for="platforms">
        Platforms (comma-separated)
      </label>
      <input
        class="form-control"
        id="platforms"
        name="platforms"
        placeholder="Windows, Mac, Linux"
        type="text"
        value={game?.platforms.join(", ") ?? ""}
      />
    </div>
    <div class="mb-3">
      <label class="form-label" for="genres">
        Genres (comma-separated)
      </label>
      <input
        class="form-control"
        id="genres"
        name="genres"
        placeholder="Action, Adventure, RPG"
        type="text"
        value={game?.genres.join(", ") ?? ""}
      />
    </div>
    <h5 class="mt-4">Developer Information</h5>
    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label" for="developer_name">
          Developer Name
        </label>
        <input
          class="form-control"
          id="developer_name"
          name="developer_name"
          required
          type="text"
          value={game?.developer.name ?? ""}
        />
      </div>
      <div class="col-md-3 mb-3">
        <label class="form-label" for="developer_country">
          Country
        </label>
        <input
          class="form-control text-uppercase"
          id="developer_country"
          maxLength={2}
          name="developer_country"
          placeholder="US"
          type="text"
          value={game?.developer.country_code ?? ""}
        />
      </div>
      <div class="col-md-3 mb-3">
        <label class="form-label" for="developer_founded">
          Founded Year
        </label>
        <input
          class="form-control"
          id="developer_founded"
          max={new Date().getFullYear()}
          min="1800"
          name="developer_founded"
          type="number"
          value={game?.developer.founded_year ?? ""}
        />
      </div>
    </div>
    <h5 class="mt-4">Publisher Information</h5>
    <div class="row">
      <div class="col-md-6 mb-3">
        <label class="form-label" for="publisher_name">
          Publisher Name
        </label>
        <input
          class="form-control"
          id="publisher_name"
          name="publisher_name"
          required
          type="text"
          value={game?.publisher.name ?? ""}
        />
      </div>
      <div class="col-md-6 mb-3">
        <label class="form-label" for="publisher_country">
          Country
        </label>
        <input
          class="form-control text-uppercase"
          id="publisher_country"
          maxLength={2}
          name="publisher_country"
          placeholder="US"
          type="text"
          value={game?.publisher.country_code ?? ""}
        />
      </div>
    </div>
    <div class="form-check mb-3">
      <input
        checked={game?.is_early_access ?? false}
        class="form-check-input"
        id="is_early_access"
        name="is_early_access"
        type="checkbox"
      />
      <label class="form-check-label" for="is_early_access">
        Early Access
      </label>
    </div>
  </>
);

export const GamesListPage = ({ games }: { games: readonly GameDocument[] }) => (
  <Layout active="games" title="Games">
    <PageHeader
      action={
        <a class="btn btn-primary" href="/games/new">
          <i class="bi bi-plus-circle" /> Add New Game
        </a>
      }
      icon="bi-controller"
      title="Games"
    />

    {games.length === 0 ? (
      <EmptyState message="No games have been created yet." />
    ) : (
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>Title</th>
              <th>Developer</th>
              <th>Price</th>
              <th>Age Rating</th>
              <th>Platforms</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {games.map(game => (
              <tr key={toObjectIdString(game._id)}>
                <td>
                  <strong>{game.title}</strong>
                </td>
                <td>{game.developer.name}</td>
                <td>${formatMoney(game.base_price)}</td>
                <td>{game.age_rating === null ? "N/A" : `${game.age_rating}+`}</td>
                <td>
                  <Tags className="bg-info" items={game.platforms} />
                </td>
                <td>
                  <span
                    class={`badge ${game.is_early_access ? "bg-warning" : "bg-success"}`}
                  >
                    {game.is_early_access ? "Early Access" : "Released"}
                  </span>
                </td>
                <td class="action-buttons">
                  <a class="btn btn-sm btn-info" href={gameHref(game)}>
                    <i class="bi bi-eye" />
                  </a>
                  <a class="btn btn-sm btn-warning" href={`${gameHref(game)}/edit`}>
                    <i class="bi bi-pencil" />
                  </a>
                  <DeleteButton action={`${gameHref(game)}/delete`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </Layout>
);

export const NewGamePage = () => (
  <Layout active="games" title="Add Game">
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-plus-circle" /> Add New Game
      </h2>
      <form action="/games" method="post">
        <GameFormFields />
        <button class="btn btn-primary" type="submit">
          Create Game
        </button>
        <a class="btn btn-secondary ms-2" href="/games">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const EditGamePage = ({ game }: { game: GameDocument }) => (
  <Layout active="games" title={`Edit ${game.title}`}>
    <div class="form-container">
      <h2 class="mb-4">
        <i class="bi bi-pencil-square" /> Edit Game
      </h2>
      <form action={`${gameHref(game)}/update`} method="post">
        <GameFormFields game={game} />
        <button class="btn btn-primary" type="submit">
          Update Game
        </button>
        <a class="btn btn-secondary ms-2" href="/games">
          Cancel
        </a>
      </form>
    </div>
  </Layout>
);

export const GameDetailsPage = ({ game }: { game: GameDocument }) => (
  <Layout active="games" title={game.title}>
    <div class="card p-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>
          <i class="bi bi-controller" /> Game Details
        </h2>
        <div>
          <a class="btn btn-warning" href={`${gameHref(game)}/edit`}>
            <i class="bi bi-pencil" /> Edit
          </a>
          <a class="btn btn-secondary ms-2" href="/games">
            <i class="bi bi-arrow-left" /> Back
          </a>
        </div>
      </div>

      <div class="row">
        <div class="col-md-6">
          <h5>Game Information</h5>
          <table class="table">
            <tbody>
              <DetailRow label="Title" value={game.title} />
              <DetailRow label="Description" value={game.description ?? "N/A"} />
              <DetailRow label="Release Date" value={formatDate(game.release_date)} />
              <DetailRow label="Price" value={`$${formatMoney(game.base_price)}`} />
              <DetailRow
                label="Age Rating"
                value={game.age_rating === null ? "N/A" : `${game.age_rating}+`}
              />
              <DetailRow
                label="Status"
                value={
                  <span
                    class={`badge ${game.is_early_access ? "bg-warning" : "bg-success"}`}
                  >
                    {game.is_early_access ? "Early Access" : "Released"}
                  </span>
                }
              />
            </tbody>
          </table>
        </div>
        <div class="col-md-6">
          <h5>Developer & Publisher</h5>
          <table class="table">
            <tbody>
              <DetailRow label="Developer" value={game.developer.name} />
              <DetailRow
                label="Developer Country"
                value={game.developer.country_code ?? "N/A"}
              />
              <DetailRow
                label="Founded"
                value={game.developer.founded_year?.toString() ?? "N/A"}
              />
              <DetailRow label="Publisher" value={game.publisher.name} />
              <DetailRow
                label="Publisher Country"
                value={game.publisher.country_code ?? "N/A"}
              />
              <DetailRow
                label="Platforms"
                value={<Tags className="bg-info" items={game.platforms} />}
              />
              <DetailRow
                label="Genres"
                value={<Tags className="bg-primary" items={game.genres} />}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>
);
