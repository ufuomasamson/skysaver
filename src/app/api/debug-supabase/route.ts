import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    // Test the Supabase connection
    const { data, error } = await supabase.from('_version').select('*').limit(1);

    return NextResponse.json({
      status: "Connection test",
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || "Using fallback URL",
      supabaseKeyAvailable: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      connectionTest: {
        success: !error,
        error: error ? error.message : null,
        data: data
      }
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json({
      status: "Error",
      message: "Failed to test Supabase connection",
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
