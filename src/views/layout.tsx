import type { Child } from "hono/jsx";

export type ActivePage = "games" | "home" | "library" | "users";

type LayoutProps = {
  active: ActivePage;
  children: Child;
  title: string;
};

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

export const Layout = ({ active, children, title }: LayoutProps) => (
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
        .nav-link.active {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: #fff !important;
        }
        .action-buttons .btn {
          margin: 0 3px;
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
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto">
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
            </ul>
          </div>
        </div>
      </nav>
      <main class="container">{children}</main>
    </body>
  </html>
);
