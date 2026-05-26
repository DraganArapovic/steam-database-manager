export type AppErrorStatus = 400 | 404 | 409 | 500;

export class AppError extends Error {
  readonly status: AppErrorStatus;

  constructor(status: AppErrorStatus, message: string) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}
