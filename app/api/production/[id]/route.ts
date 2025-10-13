import { NextRequest, NextResponse } from "next/server";

import { getProduksiById, updateProduksi, deleteProduksi } from "@/lib/produk";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const produksi = await getProduksiById(id);

    if (!produksi) {
      return NextResponse.json(
        { success: false, message: "Produksi not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: produksi,
    });
  } catch (error) {
    console.error("Error in GET /api/production/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch produksi" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const existing = await getProduksiById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Produksi not found" },
        { status: 404 },
      );
    }

    const updateData: any = {};

    if (body.nama_produk !== undefined)
      updateData.nama_produk = body.nama_produk;
    if (body.warna !== undefined) updateData.warna = body.warna;
    if (body.ukuran !== undefined) updateData.ukuran = body.ukuran;
    if (body.gulungan !== undefined) updateData.gulungan = body.gulungan;
    if (body.jumlah_pola !== undefined)
      updateData.jumlah_pola = body.jumlah_pola;
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.deadline !== undefined) updateData.deadline = body.deadline;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.id_user !== undefined) updateData.id_user = body.id_user;

    await updateProduksi(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Produksi updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/production/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update produksi" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const existing = await getProduksiById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Produksi not found" },
        { status: 404 },
      );
    }

    await deleteProduksi(id);

    return NextResponse.json({
      success: true,
      message: "Produksi deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/production/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete produksi" },
      { status: 500 },
    );
  }
}
