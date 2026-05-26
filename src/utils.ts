import { Decimal128, ObjectId } from "mongodb";
import { createHash } from "node:crypto";

import { AppError } from "./errors";

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export const parseObjectId = (value: string, label = "id"): ObjectId => {
  if (!OBJECT_ID_PATTERN.test(value)) {
    throw new AppError(
      400,
      `Invalid ${label}. Expected a 24-character ObjectId.`
    );
  }

  return new ObjectId(value);
};

export const toObjectIdString = (id: ObjectId): string => id.toHexString();

export const toDecimal128 = (value: number): Decimal128 =>
  Decimal128.fromString(value.toFixed(2));

export const decimalToNumber = (value: Decimal128): number =>
  Number(value.toString());

export const formatMoney = (value: Decimal128 | number): string => {
  const amount = value instanceof Decimal128 ? decimalToNumber(value) : value;
  return amount.toFixed(2);
};

export const formatDate = (value: Date | null | undefined): string => {
  if (!value) return "N/A";
  return value.toLocaleDateString();
};

export const formatDateTime = (value: Date | null | undefined): string => {
  if (!value) return "Never";
  return value.toLocaleString();
};

export const toDateInputValue = (value: Date | null | undefined): string => {
  if (!value) return "";
  return value.toISOString().slice(0, 10);
};

export const hashPassword = (password: string): string =>
  createHash("sha256").update(password).digest("hex");

export const notFound = (resource: string): never => {
  throw new AppError(404, `${resource} not found.`);
};

export const requireFound = <T>(value: T | null, resource: string): T => {
  if (value === null) {
    throw new AppError(404, `${resource} not found.`);
  }

  return value;
};
