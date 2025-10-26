import { NextRequest, NextResponse } from "next/server";
import { getPekerjaanByProduk } from "@/lib/pekerjaanKaryawan";
import { getProduksiById } from "@/lib/produk";
import { getTotalPolaByProduk } from "@/lib/gulungan";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id_produk: string }> }
) {
    try {
        const { id_produk: idParam } = await params;
        const id_produk = parseInt(idParam);

        if (isNaN(id_produk)) {
            return NextResponse.json(
                { success: false, message: "ID Produk tidak valid" },
                { status: 400 }
            );
        }

        const produk = await getProduksiById(id_produk);
        if (!produk) {
            return NextResponse.json(
                { success: false, message: "Produk tidak ditemukan" },
                { status: 404 }
            );
        }

        const totalPola = await getTotalPolaByProduk(id_produk);

        const assignments = await getPekerjaanByProduk(id_produk);

        const groupedData: any = {};
        
        assignments.forEach((item) => {
            const key = item.id_jenis_pekerjaan;
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    id_jenis_pekerjaan: item.id_jenis_pekerjaan,
                    nama_pekerjaan: item.nama_pekerjaan,
                    upah_per_unit: item.upah_per_unit,
                    karyawan: []
                };
            }

            groupedData[key].karyawan.push({
                id_pekerjaan_karyawan: item.id_pekerjaan_karyawan,
                id_karyawan: item.id_karyawan,
                nama_karyawan: item.nama_karyawan,
                target_unit: item.target_unit,
                unit_dikerjakan: item.unit_dikerjakan,
                status: item.status,
                tanggal_selesai: item.tanggal_selesai
            });
        });

        const pekerjaanList = Object.values(groupedData);

        return NextResponse.json({
            success: true,
            data: {
                produk: {
                    id_produk: produk.id_produk,
                    nama_produk: produk.nama_produk,
                    total_pola: totalPola
                },
                pekerjaan_list: pekerjaanList
            }
        });
    } catch (error) {
        console.error("Error in GET /api/work-assignment/[id_produk]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data pekerjaan" },
            { status: 500 }
        );
    }
}