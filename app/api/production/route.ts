import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAllProduksi, createProduksi, getOverallProgressByProduk } from "@/lib/produk";
import { createMultipleGulungan, getTotalPolaByProduk} from "@/lib/gulungan";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getAllProduksi(page, limit);

    const dataWithPola = await Promise.all(
      result.data.map(async (produk) => {
        const totalPola = await getTotalPolaByProduk(produk.id_produk);
        const progress = await getOverallProgressByProduk(produk.id_produk);
    
        return {
          ...produk,
          jumlah_pola: totalPola,
          progress: progress, 
          deadline:
            produk.tanggal_selesai !== null ? null : produk.deadline,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: dataWithPola,
      total: result.total,
      totalPages: result.totalPages,
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
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;

    if (!userId || isNaN(userId)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized or invalid user ID" },
        { status: 401 },
      );
    }

    const body = await request.json();

    if (!body.nama_produk) {
      return NextResponse.json(
        { success: false, message: "Nama produk is required" },
        { status: 400 },
      );
    }

    if (!body.gulungan_data?.length) {
      return NextResponse.json(
        { success: false, message: "Data gulungan is required" },
        { status: 400 },
      );
    }

    const status = (body.tanggal_selesai && body.tanggal_selesai !== null && body.tanggal_selesai !== "") 
      ? "selesai" 
      : "diproses";

    const result = await createProduksi({
      nama_produk: body.nama_produk,
      warna: body.warna || null,
      ukuran: body.ukuran || null,
      gulungan: body.gulungan || null,
      progress: 0, 
      deadline: body.deadline || null,
      status: status, 
      id_user: userId,
      tanggal_mulai: body.tanggal_mulai || null,
      tanggal_selesai: body.tanggal_selesai || null,
    });

    const idProduk = (result as any).insertId;

    const gulunganList = body.gulungan_data.map((item: any, index: number) => ({
      id_produk: idProduk,
      nomor_gulungan: index + 1,
      jumlah_pola: parseInt(item.pola) || 0,
    }));

    await createMultipleGulungan(gulunganList);

    return NextResponse.json(
      {
        success: true,
        message: "Produksi created successfully",
        data: { id_produk: idProduk },
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