import type { Child } from "hono/jsx";

import type { DatabaseBackend } from "../domain/models";

export type ActivePage = "games" | "home" | "library" | "users";

export type LayoutContext = {
  currentPath: string;
  databaseBackend: DatabaseBackend;
};

type LayoutProps = LayoutContext & {
  active: ActivePage;
  children: Child;
  title: string;
};

type OptionalLayoutProps = Omit<LayoutProps, keyof LayoutContext> &
  Partial<LayoutContext>;

const navItems: ReadonlyArray<{
  href: string;
  icon: string;
  id: ActivePage;
  label: string;
}> = [
  { href: "/", icon: "bi-house", id: "home", label: "Home" },
  { href: "/users", icon: "bi-people", id: "users", label: "Users" },
  { href: "/games", icon: "bi-controller", id: "games", label: "Games" },
  { href: "/library", icon: "bi-collection", id: "library", label: "Library" },
];

export const Layout = ({
  active,
  children,
  currentPath = "/",
  databaseBackend = "mongo",
  title,
}: OptionalLayoutProps) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title} | Steam V2</title>
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
        rel="stylesheet"
      />
      <link
        href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css"
        rel="stylesheet"
      />
      <style>{`
        :root {
          --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        body {
          background: #f8f9fa;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }
        .navbar {
          background: var(--primary-gradient);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .navbar-brand {
          font-size: 1.5rem;
          font-weight: 700;
        }
        .card,
        .table,
        .form-container {
          border: 0;
          border-radius: 15px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
        }
        .card {
          transition: transform 0.2s ease;
        }
        .card:hover,
        .stat-card:hover {
          transform: translateY(-3px);
        }
        .stat-card {
          background: var(--primary-gradient);
          border-radius: 15px;
          color: #fff;
          padding: 2rem;
          text-align: center;
          transition: transform 0.2s ease;
        }
        .stat-card h3 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .btn-primary {
          background: var(--primary-gradient);
          border: 0;
        }
        .btn-danger {
          background: var(--secondary-gradient);
          border: 0;
        }
        .btn,
        .badge,
        .form-control,
        .form-select {
          border-radius: 10px;
        }
        .table {
          overflow: hidden;
        }
        .table thead {
          background: var(--primary-gradient);
          color: #fff;
        }
        .form-container {
          background: #fff;
          margin: 0 auto;
          max-width: 900px;
          padding: 2rem;
        }
        .welcome-section {
          background: var(--primary-gradient);
          border-radius: 15px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          color: #fff;
          margin-bottom: 2rem;
          padding: 3rem;
        }
        .nav-link {
          color: rgba(255, 255, 255, 0.9) !important;
          font-weight: 500;
        }
        @media (min-width: 992px) {
          .navbar-nav {
            gap: 0.75rem;
          }
          .navbar-nav .nav-link {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }
        .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: #fff !important;
        }
        .action-buttons .btn {
          margin: 0 3px;
        }
        @media (min-width: 992px) {
          .navbar-expand-lg .navbar-collapse {
            align-items: center;
            flex-wrap: nowrap;
          }
        }
        .database-switch-item {
          align-items: center;
          display: flex;
        }
        .database-switch {
          align-items: center;
          color: #fff;
          display: flex;
          flex-shrink: 0;
          font-size: 0.875rem;
          gap: 0.5rem;
          line-height: 1;
          margin: 0;
          padding: 0.5rem 0.75rem;
        }
        .database-switch .form-check.form-switch {
          align-items: center;
          display: inline-flex;
          margin: 0;
          min-height: 0;
          padding: 0;
        }
        .database-switch .form-check-input {
          float: none;
          margin: 0;
        }
        .database-switch .badge {
          background: rgba(255, 255, 255, 0.25);
        }
      `}</style>
    </head>
    <body>
      <nav class="navbar navbar-expand-lg navbar-dark mb-4">
        <div class="container">
          <a class="navbar-brand" href="/">
            <i class="bi bi-steam" /> Steam V2
          </a>
          <button
            class="navbar-toggler"
            data-bs-target="#navbarNav"
            data-bs-toggle="collapse"
            type="button"
          >
            <span class="navbar-toggler-icon" />
          </button>
          <div
            class="collapse navbar-collapse align-items-center"
            id="navbarNav"
          >
            <ul class="navbar-nav align-items-lg-center ms-auto">
              {navItems.map(item => (
                <li class="nav-item" key={item.id}>
                  <a
                    class={`nav-link ${active === item.id ? "active" : ""}`}
                    href={item.href}
                  >
                    <i class={`bi ${item.icon}`} /> {item.label}
                  </a>
                </li>
              ))}
              <li class="nav-item database-switch-item ms-lg-4">
                <form
                  action="/settings/database"
                  class="database-switch"
                  method="post"
                >
                  <input
                    name="backend"
                    type="hidden"
                    value={databaseBackend === "postgres" ? "mongo" : "postgres"}
                  />
                  <input name="returnTo" type="hidden" value={currentPath} />
                  <span>MongoDB</span>
                  <div class="form-check form-switch">
                    <input
                      checked={databaseBackend === "postgres"}
                      class="form-check-input"
                      onchange="this.form.submit()"
                      type="checkbox"
                    />
                  </div>
                  <span>PostgreSQL</span>
                  <span class="badge text-uppercase">{databaseBackend}</span>
                </form>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <main class="container">{children}</main>
    </body>
  </html>
);
