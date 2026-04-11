import { json } from "@remix-run/node";
import { isRouteErrorResponse } from "@remix-run/react";
import { ZodError } from "zod";

import { logger } from "./logger.server";

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(params: {
    status: number;
    message: string;
    code?: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "HttpError";
    this.status = params.status;
    this.code = params.code ?? "HTTP_ERROR";
    this.details = params.details;
  }
}

export function badRequest(message: string, details?: unknown) {
  return new HttpError({ status: 400, message, code: "BAD_REQUEST", details });
}

export function notFound(message: string, details?: unknown) {
  return new HttpError({ status: 404, message, code: "NOT_FOUND", details });
}

export function internalServerError(message = "Internal server error.", details?: unknown) {
  return new HttpError({ status: 500, message, code: "INTERNAL_SERVER_ERROR", details });
}

export function toErrorResponse(error: unknown, context: string) {
  if (error instanceof ZodError) {
    logger.warn("Validation failed", {
      context,
      issues: error.issues,
    });

    return json(
      {
        error: "Validation failed.",
        code: "VALIDATION_ERROR",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof HttpError) {
    logger.warn(error.message, {
      context,
      code: error.code,
      status: error.status,
      details: error.details,
    });

    return json(
      {
        error: error.message,
        code: error.code,
        details: error.details ?? null,
      },
      { status: error.status },
    );
  }

  if (isRouteErrorResponse(error)) {
    logger.error("Route error response", {
      context,
      status: error.status,
      statusText: error.statusText,
      data: error.data,
    });

    return json(
      {
        error: error.statusText || "Unexpected route error.",
        code: "ROUTE_ERROR_RESPONSE",
        details: error.data ?? null,
      },
      { status: error.status },
    );
  }

  logger.error("Unhandled route error", {
    context,
    error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
  });

  return json(
    {
      error: "Internal server error.",
      code: "INTERNAL_SERVER_ERROR",
      details: null,
    },
    { status: 500 },
  );
}
