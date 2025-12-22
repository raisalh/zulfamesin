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
                p.deleted_at,
                COALESCE(SUM(
                    CASE 
                        WHEN k.jenis_upah = 'harian' THEN 
                            COALESCE(hari.jumlah_hari, 0) * COALESCE(jp.upah_harian, 0)
                        ELSE 
                            COALESCE(pk.unit_dikerjakan * jp.upah_per_unit, 0)
                    END
                ), 0) as total_upah,
                uk.status_pembayaran,
                uk.tanggal_pembayaran
            FROM pekerjaan_karyawan pk
            INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            INNER JOIN produksi p ON pk.id_produk = p.id_produk
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            LEFT JOIN upah_karyawan uk ON uk.id_karyawan = pk.id_karyawan AND uk.id_produk = pk.id_produk
            LEFT JOIN (
                SELECT 
                    pk2.id_produk,
                    pk2.id_karyawan,
                    pk2.id_jenis_pekerjaan,
                    COUNT(DISTINCT DATE(pp.tanggal_update)) as jumlah_hari
                FROM progress_pekerjaan pp
                INNER JOIN pekerjaan_karyawan pk2 ON pp.id_pekerjaan_karyawan = pk2.id_pekerjaan_karyawan
                WHERE pk2.id_karyawan = ?
                GROUP BY pk2.id_produk, pk2.id_karyawan, pk2.id_jenis_pekerjaan
            ) hari ON hari.id_produk = p.id_produk 
                AND hari.id_karyawan = pk.id_karyawan 
                AND hari.id_jenis_pekerjaan = pk.id_jenis_pekerjaan
            WHERE pk.id_karyawan = ?
            GROUP BY 
                p.id_produk, 
                p.nama_produk, 
                p.warna, 
                p.ukuran, 
                p.status, 
                uk.status_pembayaran, 
                uk.tanggal_pembayaran
            ORDER BY p.id_produk DESC`,
            [id, id]
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