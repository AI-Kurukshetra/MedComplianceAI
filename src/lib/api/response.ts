import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null }, { status });
}

export function fail(message: string, status: number, code?: string) {
  return NextResponse.json(
    {
      data: null,
      error: {
        message,
        ...(code ? { code } : {}),
      },
    },
    { status },
  );
}
