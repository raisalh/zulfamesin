import { NextRequest, NextResponse } from "next/server";
import { createMultipleProgress } from "@/lib/progressPekerjaan";
import { getProduksiById } from "@/lib/produk";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id_produk, id_jenis_pekerjaan, tanggal_progress, progress_list } = body;

        if (!id_produk) {
            return NextResponse.json(
                { success: false, message: "ID Produk diperlukan" },
                { status: 400 }
            );
        }

        if (!id_jenis_pekerjaan) {
            return NextResponse.json(
                { success: false, message: "ID Jenis Pekerjaan diperlukan" },
                { status: 400 }
            );
        }

        if (!tanggal_progress) {
            return NextResponse.json(
                { success: false, message: "Tanggal Progress diperlukan" },
                { status: 400 }
            );
        }

        if (!progress_list || !Array.isArray(progress_list) || progress_list.length === 0) {
            return NextResponse.json(
                { success: false, message: "Data progress diperlukan" },
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

        const validProgressList = progress_list
            .filter((item: any) => {
                const unitProgress = parseInt(item.unit_progress?.toString() || '0');
                return unitProgress > 0;
            })
            .map((item: any) => ({
                id_pekerjaan_karyawan: parseInt(item.id_pekerjaan_karyawan.toString()),
                unit_progress: parseInt(item.unit_progress.toString()),
                tanggal_update: new Date(tanggal_progress)
            }));

        if (validProgressList.length === 0) {
            return NextResponse.json(
                { success: false, message: "Tidak ada data progress yang valid" },
                { status: 400 }
            );
        }

        await createMultipleProgress(validProgressList);

        return NextResponse.json(
            {
                success: true,
                message: "Progress berhasil disimpan",
                data: {
                    total_updates: validProgressList.length
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/progress:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menyimpan progress", error: (error as Error).message },
            { status: 500 }
        );
    }
}