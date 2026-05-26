import type { StandardSchemaV1 } from "@standard-schema/spec";

import { Layout, type ActivePage } from "./layout";

type ErrorPageProps = {
  active?: ActivePage;
  message: string;
  status: number;
};

const formatIssuePath = (
  path: ReadonlyArray<PropertyKey | StandardSchemaV1.PathSegment> | undefined,
): string => {
  if (path === undefined || path.length === 0) return "field";

  return path
    .map(segment => (typeof segment === "object" ? segment.key : segment))
    .join(".");
};

export const ErrorPage = ({
  active = "home",
  message,
  status,
}: ErrorPageProps) => (
  <Layout active={active} title={`Error ${status}`}>
    <div class="card p-4 text-center">
      <i
        class="bi bi-exclamation-triangle"
        style="font-size: 4rem; color: #f5576c;"
      />
      <h2 class="mt-3">Error {status}</h2>
      <p class="lead text-muted">{message}</p>
      <a class="btn btn-primary" href="/">
        <i class="bi bi-house" /> Return to Home
      </a>
    </div>
  </Layout>
);

export const ValidationErrorPage = ({
  active = "home",
  issues,
  title,
}: {
  active?: ActivePage;
  issues: readonly StandardSchemaV1.Issue[];
  title: string;
}) => (
  <Layout active={active} title="Validation error">
    <div class="card p-4">
      <h2 class="mb-3">
        <i class="bi bi-exclamation-triangle" /> {title}
      </h2>
      <p class="text-muted">Please fix the following validation errors.</p>
      <ul class="list-group mb-4">
        {issues.map((issue, index) => (
          <li class="list-group-item" key={`${formatIssuePath(issue.path)}-${index}`}>
            <strong>{formatIssuePath(issue.path)}:</strong> {issue.message}
          </li>
        ))}
      </ul>
      <a class="btn btn-secondary" href="/">
        Return to Home
      </a>
    </div>
  </Layout>
);
