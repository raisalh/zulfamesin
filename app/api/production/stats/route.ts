import { NextResponse } from "next/server";

import { getProduksiStats } from "@/lib/produk";

export async function GET() {
  try {
    const stats = await getProduksiStats();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error in GET /api/production/stats:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch statistics" },
      { status: 500 },
    );
  }
}
