import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getKaryawanById } from "@/lib/karyawan";
import { getProduksiById } from "@/lib/produk";
import { getUpahByKaryawanAndProduk, createUpahKaryawan } from "@/lib/upahKaryawan";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; id_produk: string }> }
) {
    try {
        const { id: idParam, id_produk: idProdukParam } = await params;
        const id_karyawan = parseInt(idParam);
        const id_produk = parseInt(idProdukParam);

        if (isNaN(id_karyawan) || isNaN(id_produk)) {
            return NextResponse.json(
                { success: false, message: "Invalid ID" },
                { status: 400 }
            );
        }

        const karyawan = await getKaryawanById(id_karyawan);
        if (!karyawan) {
            return NextResponse.json(
                { success: false, message: "Karyawan not found" },
                { status: 404 }
            );
        }

        const produk = await getProduksiById(id_produk, true);
        if (!produk) {
            return NextResponse.json(
                { success: false, message: "Produk not found" },
                { status: 404 }
            );
        }

        const [pekerjaan] = await pool.query(
            `SELECT 
                pk.id_pekerjaan_karyawan,
                pk.unit_dikerjakan,
                pk.target_unit,
                jp.nama_pekerjaan,
                jp.upah_per_unit,
                jp.upah_harian,
                k.jenis_upah,
                COALESCE(hari.jumlah_hari, 0) as jumlah_hari,
                CASE 
                    WHEN k.jenis_upah = 'harian' THEN 
                        COALESCE(hari.jumlah_hari, 0) * COALESCE(jp.upah_harian, 0)
                    ELSE 
                        COALESCE(pk.unit_dikerjakan * jp.upah_per_unit, 0)
                END as total_upah_pekerjaan
            FROM pekerjaan_karyawan pk
            INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            LEFT JOIN (
                SELECT 
                    pp.id_pekerjaan_karyawan,
                    COUNT(DISTINCT DATE(pp.tanggal_update)) as jumlah_hari
                FROM progress_pekerjaan pp
                GROUP BY pp.id_pekerjaan_karyawan
            ) hari ON hari.id_pekerjaan_karyawan = pk.id_pekerjaan_karyawan
            WHERE pk.id_karyawan = ? AND pk.id_produk = ?
            ORDER BY jp.nama_pekerjaan`,
            [id_karyawan, id_produk]
        );

        const pekerjaanList = pekerjaan as any[];
        const totalKategori = pekerjaanList.length;

        const totalUnit = pekerjaanList.reduce((sum, p) => {
            if (p.jenis_upah === 'harian') {
                return sum + p.jumlah_hari;
            }
            return sum + p.unit_dikerjakan;
        }, 0);

        const totalUpah = pekerjaanList.reduce(
            (sum, p) => sum + parseFloat(p.total_upah_pekerjaan || 0),
            0
        );

        let upahData = await getUpahByKaryawanAndProduk(id_karyawan, id_produk);

        if (!upahData) {
            console.log('Creating upah_karyawan record for karyawan:', id_karyawan, 'produk:', id_produk);
            await createUpahKaryawan({
                id_karyawan,
                id_produk,
                total_pekerjaan: totalKategori,
                total_unit: totalUnit,
                total_upah: totalUpah,
                status_pembayaran: 'belum',
                tanggal_pembayaran: null
            });

            upahData = await getUpahByKaryawanAndProduk(id_karyawan, id_produk);
        } else {
            if (Math.abs(upahData.total_upah - totalUpah) > 0.01 || upahData.total_unit !== totalUnit) {
                console.log('Updating upah_karyawan with new totals');
                await pool.query(
                    `UPDATE upah_karyawan 
                    SET total_pekerjaan = ?, total_unit = ?, total_upah = ?
                    WHERE id_karyawan = ? AND id_produk = ?`,
                    [totalKategori, totalUnit, totalUpah, id_karyawan, id_produk]
                );

                upahData = await getUpahByKaryawanAndProduk(id_karyawan, id_produk);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                karyawan: {
                    id_karyawan: karyawan.id_karyawan,
                    nama_karyawan: karyawan.nama_karyawan,
                    jenis_upah: karyawan.jenis_upah,
                },
                produk: {
                    id_produk: produk.id_produk,
                    nama_produk: produk.nama_produk,
                    warna: produk.warna,
                    ukuran: produk.ukuran,
                    status: produk.status,
                    deleted_at: produk.deleted_at,
                },
                pekerjaan_list: pekerjaanList,
                ringkasan: {
                    total_kategori: totalKategori,
                    total_unit: totalUnit,
                    total_upah: totalUpah,
                },
                status_pembayaran: upahData?.status_pembayaran || 'belum',
                tanggal_pembayaran: upahData?.tanggal_pembayaran || null,
            },
        });
    } catch (error) {
        console.error("Error in GET /api/employee/[id]/works/[id_produk]:", error);

        return NextResponse.json(
            { success: false, message: "Failed to fetch data" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; id_produk: string }> }
) {
    try {
        const { id: idParam, id_produk: idProdukParam } = await params;
        const id_karyawan = parseInt(idParam);
        const id_produk = parseInt(idProdukParam);

        const body = await request.json();
        const { status_pembayaran } = body;

        const produk = await getProduksiById(id_produk, true);

        if (produk?.status !== "selesai" && produk?.deleted_at === null) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Pembayaran hanya bisa diubah jika produk sudah selesai atau sudah dihapus"
                },
                { status: 400 }
            );
        }

        const tanggal = status_pembayaran === 'dibayar' ? new Date() : null;

        await pool.query(
            `UPDATE upah_karyawan 
            SET status_pembayaran = ?, tanggal_pembayaran = ?
            WHERE id_karyawan = ? AND id_produk = ?`,
            [status_pembayaran, tanggal, id_karyawan, id_produk]
        );

        return NextResponse.json({
            success: true,
            message: "Status pembayaran berhasil diubah"
        });
    } catch (error) {
        console.error("Error updating status:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengubah status" },
            { status: 500 }
        );
    }
}