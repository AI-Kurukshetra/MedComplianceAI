import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("healthcheck");

    if (error) {
      return NextResponse.json(
        {
          data: null,
          error: { message: error.message, code: "HEALTHCHECK_FAILED" },
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: {
        ok: true,
        details: data ?? null,
        checkedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unexpected error",
          code: "HEALTHCHECK_FAILED",
        },
      },
      { status: 500 },
    );
  }
}
