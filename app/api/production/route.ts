import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAllProduksi, createProduksi, getOverallProgressByProduk } from "@/lib/produk";
import { createMultipleGulungan, getTotalPolaByProduk } from "@/lib/gulungan";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get("search");

    if (searchQuery) {
      if (searchQuery.length < 2) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      const [rows] = await pool.query(`
        SELECT 
          p.id_produk,
          p.nama_produk,
          p.warna,
          p.ukuran,
          g.nomor_gulungan
        FROM produksi p
        LEFT JOIN (
          SELECT id_produk, nomor_gulungan
          FROM gulungan
          WHERE (id_produk, id_gulungan) IN (
            SELECT id_produk, MAX(id_gulungan)
            FROM gulungan
            GROUP BY id_produk
          )
        ) g ON g.id_produk = p.id_produk
        WHERE p.nama_produk LIKE ?
        ORDER BY p.id_produk DESC
        LIMIT 10`,
        [`%${searchQuery}%`]
      );
      
      return NextResponse.json({
        success: true,
        data: rows,
      });
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await getAllProduksi(page, limit);

    const dataWithDetails = await Promise.all(
      result.data.map(async (produk) => {
        const [polaResult] = await pool.query(
          `SELECT COALESCE(SUM(jumlah_pola), 0) as total_pola FROM gulungan WHERE id_produk = ?`,
          [produk.id_produk]
        );
        const totalPola = (polaResult as any)[0].total_pola || 0;

        const [progressResult] = await pool.query(
          `SELECT 
            COALESCE(
              CASE 
                WHEN SUM(target_unit) > 0 
                THEN LEAST(ROUND((SUM(unit_dikerjakan) / SUM(target_unit)) * 100, 2), 100)
                ELSE 0 
              END, 
              0
            ) as progress
          FROM pekerjaan_karyawan
          WHERE id_produk = ?`,
          [produk.id_produk]
        );
        const progress = (progressResult as any)[0].progress || 0;

        const [pekerjaanCount] = await pool.query(
          `SELECT COUNT(*) AS jumlah FROM pekerjaan_karyawan WHERE id_produk = ?`,
          [produk.id_produk]
        );
        const hasPekerjaan = (pekerjaanCount as any)[0].jumlah > 0;
        
        return {
          ...produk,
          jumlah_pola: totalPola,
          progress: progress,
          hasPekerjaan: hasPekerjaan,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: dataWithDetails,
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
      deadline: body.deadline || null,
      status: status,
      id_user: userId,
      tanggal_mulai: body.tanggal_mulai || null,
      tanggal_selesai: body.tanggal_selesai || null,
      deleted_at: null,
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