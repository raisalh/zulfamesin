import { NextRequest, NextResponse } from "next/server";

import { getProduksiById, updateProduksi, deleteProduksi, updateStatusBasedOnProgress } from "@/lib/produk";
import { getGulunganByProduk, deleteGulunganByProduk, createMultipleGulungan, getTotalPolaByProduk } from "@/lib/gulungan";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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

    const gulunganList = await getGulunganByProduk(id);
    const totalPola = await getTotalPolaByProduk(id);

    return NextResponse.json({
      success: true,
      data: {
        ...produksi,
        jumlah_pola: totalPola,
        gulungan_data: gulunganList,
      },
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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
    if (body.progress !== undefined) updateData.progress = body.progress;
    if (body.deadline !== undefined) updateData.deadline = body.deadline;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tanggal_mulai !== undefined)
      updateData.tanggal_mulai = body.tanggal_mulai;
    if (body.tanggal_selesai !== undefined)
      updateData.tanggal_selesai = body.tanggal_selesai;

    if (
      body.tanggal_selesai !== undefined &&
      body.tanggal_selesai !== null &&
      body.tanggal_selesai !== ""
    ) {
      updateData.status = "selesai";
    } else if (body.status !== undefined) {
      updateData.status = body.status;
    }

    await updateProduksi(id, updateData);

    if (body.gulungan_data && Array.isArray(body.gulungan_data)) {
      await deleteGulunganByProduk(id);

      const gulunganList = body.gulungan_data.map(
        (item: any, index: number) => ({
          id_produk: id,
          nomor_gulungan: index + 1,
          jumlah_pola: parseInt(item.pola) || 0,
        }),
      );

      await createMultipleGulungan(gulunganList);
    }

    if (!body.tanggal_selesai) {
      await updateStatusBasedOnProgress(id);
    }

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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

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