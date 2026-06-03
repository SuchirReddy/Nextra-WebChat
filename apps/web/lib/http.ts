import { NextResponse } from "next/server";
import { ApiError } from "@/lib/errors";
import { logger } from "@/lib/logger";

export const ok = <T>(data: T, status = 200) => NextResponse.json({ data }, { status });

export const fail = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const handleRouteError = (error: unknown) => {
  if (error instanceof ApiError) {
    return fail(error.message, error.status);
  }

  logger.error("Unhandled route error", { error: String(error) });
  return fail("Internal server error", 500);
};
