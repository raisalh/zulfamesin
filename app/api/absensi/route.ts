import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { success: false, message: "Unauthorized" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const month = searchParams.get("month");
        const year = searchParams.get("year");

        if (!month || !year) {
            return NextResponse.json(
                { success: false, message: "Parameter bulan dan tahun diperlukan" },
                { status: 400 }
            );
        }

        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
            return NextResponse.json(
                { success: false, message: "Format bulan atau tahun tidak valid" },
                { status: 400 }
            );
        }

        const [summaryRows] = await pool.query(
            `SELECT 
        DATE(pp.tanggal_update) as tanggal,
        COUNT(DISTINCT pk.id_karyawan) as jumlah_hadir
        FROM progress_pekerjaan pp
        INNER JOIN pekerjaan_karyawan pk ON pp.id_pekerjaan_karyawan = pk.id_pekerjaan_karyawan
        WHERE MONTH(pp.tanggal_update) = ? 
            AND YEAR(pp.tanggal_update) = ?
        GROUP BY DATE(pp.tanggal_update)
        ORDER BY tanggal`,
            [monthNum, yearNum]
        );

        const [detailRows] = await pool.query(
            `SELECT 
        DATE(pp.tanggal_update) as tanggal,
        k.id_karyawan,
        k.nama_karyawan,
        k.jenis_kelamin,
        p.nama_produk,
        p.warna,
        jp.nama_pekerjaan,
        SUM(pp.unit_progress) as total_unit,
        COUNT(DISTINCT pp.id_progress) as jumlah_progress
        FROM progress_pekerjaan pp
        INNER JOIN pekerjaan_karyawan pk ON pp.id_pekerjaan_karyawan = pk.id_pekerjaan_karyawan
        INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
        INNER JOIN produksi p ON pk.id_produk = p.id_produk
        INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
        WHERE MONTH(pp.tanggal_update) = ? 
            AND YEAR(pp.tanggal_update) = ?
        GROUP BY DATE(pp.tanggal_update), k.id_karyawan, k.nama_karyawan, 
                k.jenis_kelamin, p.nama_produk, p.warna, jp.nama_pekerjaan
        ORDER BY tanggal, k.nama_karyawan`,
            [monthNum, yearNum]
        );

        const [totalKaryawanRows] = await pool.query(
            `SELECT COUNT(DISTINCT pk.id_karyawan) as total
      FROM progress_pekerjaan pp
      INNER JOIN pekerjaan_karyawan pk ON pp.id_pekerjaan_karyawan = pk.id_pekerjaan_karyawan
      WHERE MONTH(pp.tanggal_update) = ? 
        AND YEAR(pp.tanggal_update) = ?`,
            [monthNum, yearNum]
        );

        const summary: { [key: string]: number } = {};
        (summaryRows as any[]).forEach((row) => {
            const tanggal = new Date(row.tanggal).toISOString().split("T")[0];
            summary[tanggal] = Number(row.jumlah_hadir);
        });

        const details: {
            [key: string]: Array<{
                id_karyawan: number;
                nama_karyawan: string;
                jenis_kelamin: string;
                pekerjaan: Array<{
                    nama_produk: string;
                    warna: string;
                    nama_pekerjaan: string;
                    total_unit: number;
                    jumlah_progress: number;
                }>;
            }>;
        } = {};

        (detailRows as any[]).forEach((row) => {
            const tanggal = new Date(row.tanggal).toISOString().split("T")[0];

            if (!details[tanggal]) {
                details[tanggal] = [];
            }

            let karyawan = details[tanggal].find(
                (k) => k.id_karyawan === row.id_karyawan
            );

            if (!karyawan) {
                karyawan = {
                    id_karyawan: row.id_karyawan,
                    nama_karyawan: row.nama_karyawan,
                    jenis_kelamin: row.jenis_kelamin,
                    pekerjaan: [],
                };
                details[tanggal].push(karyawan);
            }

            karyawan.pekerjaan.push({
                nama_produk: row.nama_produk,
                warna: row.warna,
                nama_pekerjaan: row.nama_pekerjaan,
                total_unit: Number(row.total_unit),
                jumlah_progress: Number(row.jumlah_progress),
            });
        });

        const totalKaryawan = (totalKaryawanRows as any)[0]?.total || 0;

        return NextResponse.json({
            success: true,
            data: {
                month: monthNum,
                year: yearNum,
                summary,
                details,
                total_karyawan: Number(totalKaryawan),
            },
        });
    } catch (error) {
        console.error("Error in GET /api/absensi:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Gagal mengambil data absensi",
                error: (error as Error).message,
            },
            { status: 500 }
        );
    }
}