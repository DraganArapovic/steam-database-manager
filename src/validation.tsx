import type { Hook } from "@hono/standard-validator";

import type { AppEnv } from "./app-types";
import { ValidationErrorPage } from "./views/error";
import type { ActivePage } from "./views/layout";

export const formValidationHook = <Output,>(
  title: string,
  active: ActivePage,
): Hook<Output, AppEnv, string, "form"> => {
  return (result, c) => {
    if (result.success) return undefined;

    return c.html(
      <ValidationErrorPage active={active} issues={result.error} title={title} />,
      400,
    );
  };
};
