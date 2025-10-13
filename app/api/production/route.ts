import { NextRequest, NextResponse } from "next/server";

import { getAllProduksi, createProduksi } from "@/lib/produk";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getAllProduksi(page, limit);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in GET /api/production:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch produksi" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nama_produk) {
      return NextResponse.json(
        { success: false, message: "Nama produk is required" },
        { status: 400 },
      );
    }

    const result = await createProduksi({
      nama_produk: body.nama_produk,
      warna: body.warna || null,
      ukuran: body.ukuran || null,
      gulungan: body.gulungan || null,
      jumlah_pola: body.jumlah_pola || null,
      progress: body.progress || 0,
      deadline: body.deadline || null,
      status: body.status || "diproses",
      id_user: body.id_user || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Produksi created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/production:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create produksi" },
      { status: 500 },
    );
  }
}
