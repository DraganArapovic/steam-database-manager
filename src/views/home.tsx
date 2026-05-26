import { Layout } from "./layout";

export type HomeStats = {
  games: number;
  libraryEntries: number;
  users: number;
};

const StatCard = ({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) => (
  <div class="col-md-4">
    <div class="stat-card">
      <i class={`bi ${icon}`} style="font-size: 2rem;" />
      <h3>{value}</h3>
      <p class="mb-0">{label}</p>
    </div>
  </div>
);

export const HomePage = ({ stats }: { stats: HomeStats }) => (
  <Layout active="home" title="Dashboard">
    <div class="welcome-section">
      <h1>
        <i class="bi bi-database" /> Steam V2
      </h1>
      <p class="lead mb-0">Database management for your game platform.</p>
    </div>

    <div class="row mb-4">
      <StatCard icon="bi-people" label="Users" value={stats.users} />
      <StatCard icon="bi-controller" label="Games" value={stats.games} />
      <StatCard
        icon="bi-collection"
        label="Library Entries"
        value={stats.libraryEntries}
      />
    </div>

    <div class="row g-4">
      <div class="col-md-4">
        <div class="card h-100 p-4">
          <h4 class="card-title">
            <i class="bi bi-people" /> Users Management
          </h4>
          <p class="card-text">
            Create and maintain user accounts, profile data, wallet balances,
            and account status.
          </p>
          <a class="btn btn-primary mt-auto" href="/users">
            Manage Users <i class="bi bi-arrow-right" />
          </a>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 p-4">
          <h4 class="card-title">
            <i class="bi bi-controller" /> Games Management
          </h4>
          <p class="card-text">
            Browse and maintain the game catalog, pricing, platforms, and
            publisher metadata.
          </p>
          <a class="btn btn-primary mt-auto" href="/games">
            Manage Games <i class="bi bi-arrow-right" />
          </a>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card h-100 p-4">
          <h4 class="card-title">
            <i class="bi bi-collection" /> Library Management
          </h4>
          <p class="card-text">
            Track ownership, acquisition snapshots, playtime, and library
            visibility.
          </p>
          <a class="btn btn-primary mt-auto" href="/library">
            Manage Library <i class="bi bi-arrow-right" />
          </a>
        </div>
      </div>
    </div>
  </Layout>
);
