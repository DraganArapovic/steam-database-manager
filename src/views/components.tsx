import type { Child } from "hono/jsx";

export const PageHeader = ({
  action,
  icon,
  title,
}: {
  action?: Child;
  icon: string;
  title: string;
}) => (
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h2>
      <i class={`bi ${icon}`} /> {title}
    </h2>
    {action}
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <div class="card p-4 text-center text-muted">{message}</div>
);

export const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value: Child;
}) => (
  <tr>
    <td>
      <strong>{label}:</strong>
    </td>
    <td>{value}</td>
  </tr>
);

export const DeleteButton = ({ action }: { action: string }) => (
  <form action={action} method="post" style="display: inline;">
    <button class="btn btn-sm btn-danger delete-btn" type="submit">
      <i class="bi bi-trash" />
    </button>
  </form>
);

export const Tags = ({
  className,
  items,
}: {
  className: string;
  items: readonly string[];
}) => (
  <>
    {items.length === 0
      ? "None"
      : items.map(item => (
          <span class={`badge ${className} me-1`} key={item}>
            {item}
          </span>
        ))}
  </>
);
