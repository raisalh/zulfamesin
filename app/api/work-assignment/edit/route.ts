// app/api/work-assignment/edit/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getProduksiById } from "@/lib/produk";
import { getTotalPolaByProduk } from "@/lib/gulungan";
import { 
    createJenisPekerjaan, 
    updateJenisPekerjaan 
} from "@/lib/jenisPekerjaan";

interface EditAssignment {
    id_pekerjaan_karyawan?: number; // Ada jika edit existing
    id_karyawan: number;
    target_unit: number;
    unit_dikerjakan?: number; // Untuk validasi
}

interface EditPekerjaan {
    id_jenis_pekerjaan?: number; // Ada jika edit existing
    nama_pekerjaan: string;
    upah_per_unit: number;
    tipe: 'sistem' | 'manual';
    assignments: EditAssignment[];
}

export async function PUT(request: NextRequest) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const body = await request.json();
        const { id_produk, pekerjaan_list } = body as {
            id_produk: number;
            pekerjaan_list: EditPekerjaan[];
        };

        console.log('Edit pekerjaan payload:', { id_produk, pekerjaan_list });

        // Validasi produk exists
        const produk = await getProduksiById(id_produk);
        if (!produk) {
            await connection.rollback();
            return NextResponse.json(
                { success: false, message: "Produk tidak ditemukan" },
                { status: 404 }
            );
        }

        const totalPola = await getTotalPolaByProduk(id_produk);

        // Process setiap pekerjaan
        for (const pekerjaan of pekerjaan_list) {
            let id_jenis_pekerjaan = pekerjaan.id_jenis_pekerjaan;

            // Jika pekerjaan baru, create jenis_pekerjaan
            if (!id_jenis_pekerjaan) {
                const result = await connection.query(
                    `INSERT INTO jenis_pekerjaan (nama_pekerjaan, upah_per_unit, tipe) 
                     VALUES (?, ?, ?)`,
                    [pekerjaan.nama_pekerjaan, pekerjaan.upah_per_unit, pekerjaan.tipe]
                );
                id_jenis_pekerjaan = (result as any)[0].insertId;
                console.log('Created new jenis_pekerjaan:', id_jenis_pekerjaan);
            } else {
                // Update existing jenis_pekerjaan
                await connection.query(
                    `UPDATE jenis_pekerjaan 
                     SET nama_pekerjaan = ?, upah_per_unit = ?, tipe = ?
                     WHERE id_jenis_pekerjaan = ?`,
                    [pekerjaan.nama_pekerjaan, pekerjaan.upah_per_unit, pekerjaan.tipe, id_jenis_pekerjaan]
                );
                console.log('Updated jenis_pekerjaan:', id_jenis_pekerjaan);
            }

            // Process setiap assignment
            for (const assignment of pekerjaan.assignments) {
                // Validasi: cek apakah karyawan ada (termasuk yang deleted)
                const [karyawanCheck] = await connection.query(
                    'SELECT id_karyawan, nama_karyawan, deleted_at FROM karyawan WHERE id_karyawan = ?',
                    [assignment.id_karyawan]
                );

                if ((karyawanCheck as any[]).length === 0) {
                    await connection.rollback();
                    return NextResponse.json(
                        { success: false, message: `Karyawan dengan ID ${assignment.id_karyawan} tidak ditemukan` },
                        { status: 400 }
                    );
                }

                const karyawan = (karyawanCheck as any)[0];
                const isDeleted = karyawan.deleted_at !== null;

                if (assignment.id_pekerjaan_karyawan) {
                    // EDIT EXISTING ASSIGNMENT
                    
                    // Get current progress
                    const [progressCheck] = await connection.query(
                        'SELECT unit_dikerjakan, target_unit FROM pekerjaan_karyawan WHERE id_pekerjaan_karyawan = ?',
                        [assignment.id_pekerjaan_karyawan]
                    );

                    if ((progressCheck as any[]).length === 0) {
                        await connection.rollback();
                        return NextResponse.json(
                            { success: false, message: `Pekerjaan karyawan tidak ditemukan` },
                            { status: 404 }
                        );
                    }

                    const currentData = (progressCheck as any)[0];
                    const currentProgress = currentData.unit_dikerjakan;

                    // VALIDASI: Target baru tidak boleh lebih kecil dari progress
                    if (assignment.target_unit < currentProgress) {
                        await connection.rollback();
                        return NextResponse.json(
                            { 
                                success: false, 
                                message: `Target untuk ${karyawan.nama_karyawan} tidak boleh lebih kecil dari progress yang sudah dikerjakan (${currentProgress} pola)${isDeleted ? '. Karyawan ini sudah tidak aktif.' : ''}`,
                                karyawan: karyawan.nama_karyawan,
                                current_progress: currentProgress,
                                new_target: assignment.target_unit
                            },
                            { status: 400 }
                        );
                    }

                    // Update assignment
                    await connection.query(
                        `UPDATE pekerjaan_karyawan 
                         SET target_unit = ?, 
                             status = CASE 
                                 WHEN unit_dikerjakan >= ? THEN 'selesai' 
                                 ELSE 'dikerjakan' 
                             END,
                             tanggal_selesai = CASE 
                                 WHEN unit_dikerjakan >= ? AND tanggal_selesai IS NULL THEN NOW() 
                                 ELSE tanggal_selesai 
                             END
                         WHERE id_pekerjaan_karyawan = ?`,
                        [assignment.target_unit, assignment.target_unit, assignment.target_unit, assignment.id_pekerjaan_karyawan]
                    );

                    console.log('Updated assignment:', assignment.id_pekerjaan_karyawan);

                } else {
                    // CREATE NEW ASSIGNMENT
                    
                    // Cek apakah sudah ada assignment untuk karyawan ini di pekerjaan ini
                    const [existingCheck] = await connection.query(
                        `SELECT id_pekerjaan_karyawan FROM pekerjaan_karyawan 
                         WHERE id_produk = ? AND id_karyawan = ? AND id_jenis_pekerjaan = ?`,
                        [id_produk, assignment.id_karyawan, id_jenis_pekerjaan]
                    );

                    if ((existingCheck as any[]).length > 0) {
                        await connection.rollback();
                        return NextResponse.json(
                            { 
                                success: false, 
                                message: `${karyawan.nama_karyawan} sudah memiliki assignment untuk pekerjaan ini` 
                            },
                            { status: 400 }
                        );
                    }

                    await connection.query(
                        `INSERT INTO pekerjaan_karyawan 
                         (id_produk, id_karyawan, id_jenis_pekerjaan, unit_dikerjakan, target_unit, status) 
                         VALUES (?, ?, ?, 0, ?, 'dikerjakan')`,
                        [id_produk, assignment.id_karyawan, id_jenis_pekerjaan, assignment.target_unit]
                    );

                    console.log('Created new assignment for karyawan:', assignment.id_karyawan);
                }
            }
        }

        // Recalculate upah
        await connection.query(
            'DELETE FROM upah_karyawan WHERE id_produk = ?',
            [id_produk]
        );

        const [pekerjaanData] = await connection.query(
            `SELECT 
                pk.id_karyawan,
                COUNT(DISTINCT pk.id_jenis_pekerjaan) as total_pekerjaan,
                SUM(pk.unit_dikerjakan) as total_unit,
                SUM(pk.unit_dikerjakan * jp.upah_per_unit) as total_upah
             FROM pekerjaan_karyawan pk
             INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
             WHERE pk.id_produk = ?
             GROUP BY pk.id_karyawan`,
            [id_produk]
        );

        for (const data of (pekerjaanData as any[])) {
            await connection.query(
                `INSERT INTO upah_karyawan 
                 (id_karyawan, id_produk, total_pekerjaan, total_unit, total_upah, status_pembayaran) 
                 VALUES (?, ?, ?, ?, ?, 'belum')`,
                [data.id_karyawan, id_produk, data.total_pekerjaan, data.total_unit, data.total_upah]
            );
        }

        await connection.commit();

        return NextResponse.json({
            success: true,
            message: "Pekerjaan berhasil diperbarui"
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error in PUT /api/work-assignment/edit:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Gagal memperbarui pekerjaan", 
                error: (error as Error).message 
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}