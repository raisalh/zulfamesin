import pool from '@/lib/db';
import { updateStatusBasedOnProgress } from './produk';

export interface ProgressPekerjaan {
    id_progress: number;
    id_pekerjaan_karyawan: number;
    unit_progress: number;
    tanggal_update: Date;
}

export interface ProgressPekerjaanInput {
    id_pekerjaan_karyawan: number;
    unit_progress: number;
    tanggal_update: Date;
}

export async function getProgressByPekerjaanKaryawan(id_pekerjaan_karyawan: number) {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM progress_pekerjaan WHERE id_pekerjaan_karyawan = ? ORDER BY tanggal_update DESC',
            [id_pekerjaan_karyawan]
        );

        return rows as ProgressPekerjaan[];
    } catch (error) {
        console.error('Error getting progress by pekerjaan karyawan:', error);
        throw error;
    }
}

export async function createProgressPekerjaan(data: ProgressPekerjaanInput) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [result] = await connection.query(
            `INSERT INTO progress_pekerjaan 
            (id_pekerjaan_karyawan, unit_progress, tanggal_update) 
            VALUES (?, ?, ?)`,
            [
                data.id_pekerjaan_karyawan,
                data.unit_progress,
                data.tanggal_update
            ]
        );

        await connection.query(
            `UPDATE pekerjaan_karyawan 
            SET unit_dikerjakan = unit_dikerjakan + ? 
            WHERE id_pekerjaan_karyawan = ?`,
            [data.unit_progress, data.id_pekerjaan_karyawan]
        );

        const [pekerjaanRows] = await connection.query(
            `SELECT id_produk, unit_dikerjakan, target_unit 
            FROM pekerjaan_karyawan 
            WHERE id_pekerjaan_karyawan = ?`,
            [data.id_pekerjaan_karyawan]
        );

        const pekerjaan = (pekerjaanRows as any)[0];

        if (pekerjaan.unit_dikerjakan >= pekerjaan.target_unit) {
            await connection.query(
                `UPDATE pekerjaan_karyawan 
                SET status = 'selesai', tanggal_selesai = NOW() 
                WHERE id_pekerjaan_karyawan = ?`,
                [data.id_pekerjaan_karyawan]
            );
        }

        await connection.commit();

        const id_produk = pekerjaan.id_produk;
        await updateStatusBasedOnProgress(id_produk);

        return result;
    } catch (error) {
        await connection.rollback();
        console.error('Error creating progress pekerjaan:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function createMultipleProgress(progressList: ProgressPekerjaanInput[]) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const affectedProducts = new Set<number>();

        for (const progress of progressList) {
            await connection.query(
                `INSERT INTO progress_pekerjaan 
                (id_pekerjaan_karyawan, unit_progress, tanggal_update) 
                VALUES (?, ?, ?)`,
                [
                    progress.id_pekerjaan_karyawan,
                    progress.unit_progress,
                    progress.tanggal_update
                ]
            );

            await connection.query(
                `UPDATE pekerjaan_karyawan 
                SET unit_dikerjakan = unit_dikerjakan + ? 
                WHERE id_pekerjaan_karyawan = ?`,
                [progress.unit_progress, progress.id_pekerjaan_karyawan]
            );

            const [pekerjaanRows] = await connection.query(
                `SELECT id_produk, unit_dikerjakan, target_unit 
                FROM pekerjaan_karyawan 
                WHERE id_pekerjaan_karyawan = ?`,
                [progress.id_pekerjaan_karyawan]
            );

            const pekerjaan = (pekerjaanRows as any)[0];

            if (pekerjaan.unit_dikerjakan >= pekerjaan.target_unit) {
                await connection.query(
                    `UPDATE pekerjaan_karyawan 
                    SET status = 'selesai', tanggal_selesai = NOW() 
                    WHERE id_pekerjaan_karyawan = ?`,
                    [progress.id_pekerjaan_karyawan]
                );
            }

            affectedProducts.add(pekerjaan.id_produk);
        }

        await connection.commit();

        const productIds = Array.from(affectedProducts);
        for (const id_produk of productIds) {
            await updateStatusBasedOnProgress(id_produk);
        }

        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Error creating multiple progress:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function deleteProgressPekerjaan(id_progress: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM progress_pekerjaan WHERE id_progress = ?',
            [id_progress]
        );

        return result;
    } catch (error) {
        console.error('Error deleting progress pekerjaan:', error);
        throw error;
    }
}

export async function deleteProgressByProduk(id_produk: number) {
    try {
        const [result] = await pool.query(
            `DELETE FROM progress_pekerjaan 
                WHERE id_pekerjaan_karyawan IN (
                    SELECT id_pekerjaan_karyawan 
                    FROM pekerjaan_karyawan 
                    WHERE id_produk = ?
                )`,
            [id_produk]
        );

        const affectedRows = (result as any).affectedRows || 0;
        console.log(`Deleted ${affectedRows} progress_pekerjaan rows for produk ${id_produk}`);
        
        return result;
    } catch (error) {
        console.error('Error deleting progress by produk:', error);
        throw error;
    }
}