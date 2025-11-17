import { NextRequest, NextResponse } from "next/server";
import { createMultiplePekerjaanKaryawan, deletePekerjaanByJenis } from "@/lib/pekerjaanKaryawan";
import { createJenisPekerjaan, getJenisPekerjaanById } from "@/lib/jenisPekerjaan";
import { getProduksiById } from "@/lib/produk";
import { getTotalPolaByProduk } from "@/lib/gulungan";
import { calculateAndSaveUpahFromPekerjaan } from "@/lib/upahKaryawan";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id_produk, pekerjaan_list } = body;

        console.log('Received payload:', { id_produk, pekerjaan_list });

        if (!id_produk) {
            return NextResponse.json(
                { success: false, message: "ID Produk diperlukan" },
                { status: 400 }
            );
        }

        if (!pekerjaan_list || !Array.isArray(pekerjaan_list) || pekerjaan_list.length === 0) {
            return NextResponse.json(
                { success: false, message: "Data pekerjaan diperlukan" },
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

        if (totalPola === 0) {
            return NextResponse.json(
                { success: false, message: "Total pola belum diatur" },
                { status: 400 }
            );
        }

        const allPekerjaanData: any[] = [];

        for (const pekerjaan of pekerjaan_list) {
            const { 
                nama_pekerjaan, 
                upah_per_unit, 
                karyawan_ids 
            } = pekerjaan;

            console.log('Processing pekerjaan:', { nama_pekerjaan, upah_per_unit, karyawan_ids });

            if (!nama_pekerjaan || !upah_per_unit || !karyawan_ids || karyawan_ids.length === 0) {
                console.log('Skipping invalid pekerjaan:', pekerjaan);
                continue;
            }

            let id_jenis_pekerjaan: number;

            try {
                const result = await createJenisPekerjaan({
                    nama_pekerjaan: nama_pekerjaan.trim(),
                    upah_per_unit: parseFloat(upah_per_unit.toString())
                });

                id_jenis_pekerjaan = (result as any).insertId;
                console.log('Created jenis_pekerjaan with ID:', id_jenis_pekerjaan);
            } catch (error) {
                console.error('Error creating jenis_pekerjaan:', error);
                continue;
            }

            const totalKaryawan = karyawan_ids.length;
            const baseUnit = Math.floor(totalPola / totalKaryawan);
            const remainder = totalPola % totalKaryawan;

            console.log('Distribution:', { totalPola, totalKaryawan, baseUnit, remainder });

            karyawan_ids.forEach((id_karyawan: number, index: number) => {
                const targetUnit = index === totalKaryawan - 1 
                    ? baseUnit + remainder 
                    : baseUnit;

                allPekerjaanData.push({
                    id_produk: parseInt(id_produk.toString()),
                    id_karyawan: parseInt(id_karyawan.toString()),
                    id_jenis_pekerjaan,
                    unit_dikerjakan: 0,
                    target_unit: targetUnit,
                    tanggal_mulai: null,
                    tanggal_selesai: null,
                    status: 'dikerjakan' as const
                });
            });
        }

        console.log('Total assignments to create:', allPekerjaanData.length);
        console.log('Assignments data:', allPekerjaanData);

        if (allPekerjaanData.length === 0) {
            return NextResponse.json(
                { success: false, message: "Tidak ada data pekerjaan yang valid untuk disimpan" },
                { status: 400 }
            );
        }

        await createMultiplePekerjaanKaryawan(allPekerjaanData);

        await calculateAndSaveUpahFromPekerjaan(parseInt(id_produk.toString()));

        return NextResponse.json(
            {
                success: true,
                message: "Pekerjaan dan upah berhasil disimpan",
                data: {
                    total_assignments: allPekerjaanData.length,
                    total_pola: totalPola
                }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/work-assignment:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menyimpan pekerjaan", error: (error as Error).message },
            { status: 500 }
        );
    }
}