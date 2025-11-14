import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getKaryawanById } from "@/lib/karyawan";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "Invalid ID" },
                { status: 400 }
            );
        }

        const karyawan = await getKaryawanById(id);
        if (!karyawan) {
            return NextResponse.json(
                { success: false, message: "Karyawan not found" },
                { status: 404 }
            );
        }

        const [rows] = await pool.query(
            `SELECT 
            p.id_produk,
            p.nama_produk,
            p.warna,
            p.ukuran,
            p.status AS status_kerjaan,
            SUM(pk.unit_dikerjakan * jp.upah_per_unit) as total_upah,
            uk.status_pembayaran,
            uk.tanggal_pembayaran
            FROM pekerjaan_karyawan pk
            INNER JOIN produksi p ON pk.id_produk = p.id_produk
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            LEFT JOIN upah_karyawan uk ON uk.id_karyawan = pk.id_karyawan AND uk.id_produk = pk.id_produk
            WHERE pk.id_karyawan = ?
            GROUP BY p.id_produk, p.nama_produk, p.warna, p.ukuran, p.status, uk.status_pembayaran, uk.tanggal_pembayaran
            ORDER BY p.id_produk DESC`,
            [id]
        );

        return NextResponse.json({
            success: true,
            data: {
                karyawan,
                produk_list: rows
            }
        });
    } catch (error) {
        console.error("Error in GET /api/employee/[id]/works:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch data" },
            { status: 500 }
        );
    }
}