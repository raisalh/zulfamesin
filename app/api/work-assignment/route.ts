import { NextRequest, NextResponse } from "next/server";
import { 
    createMultiplePekerjaanKaryawan, 
    deletePekerjaanByProduk,
    getPekerjaanByProduk
} from "@/lib/pekerjaanKaryawan";
import { 
    createJenisPekerjaan, 
    updateJenisPekerjaan,
    deleteJenisPekerjaan 
} from "@/lib/jenisPekerjaan";
import { getProduksiById } from "@/lib/produk";
import { getTotalPolaByProduk } from "@/lib/gulungan";
import { calculateAndSaveUpahFromPekerjaan, deleteUpahByProduk } from "@/lib/upahKaryawan";
import { deleteProgressByProduk } from "@/lib/progressPekerjaan";

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
                karyawan_ids,
                karyawan_assignments 
            } = pekerjaan;

            console.log('Processing pekerjaan:', { nama_pekerjaan, upah_per_unit, karyawan_ids, karyawan_assignments });

            if (!nama_pekerjaan || !upah_per_unit) {
                console.log('Skipping invalid pekerjaan:', pekerjaan);
                continue;
            }

            if (karyawan_assignments && Array.isArray(karyawan_assignments) && karyawan_assignments.length > 0) {
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

                karyawan_assignments.forEach((assignment: any) => {
                    allPekerjaanData.push({
                        id_produk: parseInt(id_produk.toString()),
                        id_karyawan: parseInt(assignment.id_karyawan.toString()),
                        id_jenis_pekerjaan,
                        unit_dikerjakan: 0,
                        target_unit: parseInt(assignment.target_unit.toString()),
                        tanggal_selesai: null,
                        status: 'dikerjakan' as const
                    });
                });
            } 
            else if (karyawan_ids && Array.isArray(karyawan_ids) && karyawan_ids.length > 0) {
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
                        tanggal_selesai: null,
                        status: 'dikerjakan' as const
                    });
                });
            }
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

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id_produk, pekerjaan_list } = body;

        console.log('Received PUT payload:', { id_produk, pekerjaan_list });

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

        const existingPekerjaan = await getPekerjaanByProduk(id_produk);
        const uniqueJenisPekerjaanIds = new Set(
            existingPekerjaan.map(p => p.id_jenis_pekerjaan)
        );
        const existingJenisPekerjaanIds = Array.from(uniqueJenisPekerjaanIds);

        console.log('Existing jenis_pekerjaan IDs to delete:', existingJenisPekerjaanIds);

        try {
            const progressResult = await deleteProgressByProduk(id_produk);
            const progressDeleted = (progressResult as any).affectedRows || 0;
        } catch (error) {
            console.error('Error deleting progress_pekerjaan:', error);
        }

        try {
            const upahResult = await deleteUpahByProduk(id_produk);
            const upahDeleted = (upahResult as any).affectedRows || 0;
        } catch (error) {
            console.error('Error deleting upah_karyawan:', error);
        }

        try {
            const pekerjaanResult = await deletePekerjaanByProduk(id_produk);
            const pekerjaanDeleted = (pekerjaanResult as any).affectedRows || 0;
            
            if (pekerjaanDeleted === 0) {
                console.warn('WARNING: No pekerjaan_karyawan rows were deleted!');
            }
        } catch (error) {
            console.error('CRITICAL ERROR deleting pekerjaan_karyawan:', error);
            throw error; 
        }

        let jenisDeleted = 0;
        for (const jenisId of existingJenisPekerjaanIds) {
            try {
                await deleteJenisPekerjaan(jenisId);
                jenisDeleted++
            } catch (error) {
                console.error(`Error deleting jenis_pekerjaan ${jenisId}:`, error);
            }
        }
        console.log(`Total deleted jenis_pekerjaan: ${jenisDeleted}`);

        const allPekerjaanData: any[] = [];
        for (const pekerjaan of pekerjaan_list) {
            const { 
                nama_pekerjaan, 
                upah_per_unit, 
                karyawan_ids,
                karyawan_assignments 
            } = pekerjaan;


            let id_jenis_pekerjaan: number;
            try {
                const result = await createJenisPekerjaan({
                    nama_pekerjaan: nama_pekerjaan.trim(),
                    upah_per_unit: parseFloat(upah_per_unit.toString())
                });

                id_jenis_pekerjaan = (result as any).insertId;
                console.log(`Created new jenis_pekerjaan "${nama_pekerjaan}" with ID: ${id_jenis_pekerjaan}`);
            } catch (error) {
                console.error('Error creating jenis_pekerjaan:', error);
                continue;
            }

            if (karyawan_assignments && Array.isArray(karyawan_assignments) && karyawan_assignments.length > 0) {
                karyawan_assignments.forEach((assignment: any) => {
                    allPekerjaanData.push({
                        id_produk: parseInt(id_produk.toString()),
                        id_karyawan: parseInt(assignment.id_karyawan.toString()),
                        id_jenis_pekerjaan,
                        unit_dikerjakan: 0,
                        target_unit: parseInt(assignment.target_unit.toString()),
                        tanggal_selesai: null,
                        status: 'dikerjakan' as const
                    });
                });
            } 
            else if (karyawan_ids && Array.isArray(karyawan_ids) && karyawan_ids.length > 0) {
                const totalKaryawan = karyawan_ids.length;
                const baseUnit = Math.floor(totalPola / totalKaryawan);
                const remainder = totalPola % totalKaryawan;

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
                        tanggal_selesai: null,
                        status: 'dikerjakan' as const
                    });
                });
            }
        }

        console.log(`Total new assignments to create: ${allPekerjaanData.length}`);

        if (allPekerjaanData.length === 0) {
            return NextResponse.json(
                { success: false, message: "Tidak ada data pekerjaan yang valid" },
                { status: 400 }
            );
        }

        await createMultiplePekerjaanKaryawan(allPekerjaanData);
        await calculateAndSaveUpahFromPekerjaan(parseInt(id_produk.toString()));

        return NextResponse.json(
            {
                success: true,
                message: "Pekerjaan berhasil diperbarui",
                data: {
                    total_assignments: allPekerjaanData.length,
                    total_pola: totalPola
                }
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in PUT /api/work-assignment:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Gagal memperbarui pekerjaan", 
                error: (error as Error).message 
            },
            { status: 500 }
        );
    }
}