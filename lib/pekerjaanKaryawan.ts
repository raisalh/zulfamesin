import pool from '@/lib/db';

export interface PekerjaanKaryawan {
    id_pekerjaan_karyawan: number;
    id_produk: number;
    id_karyawan: number;
    id_jenis_pekerjaan: number;
    unit_dikerjakan: number;
    target_unit: number | null;
    tanggal_selesai: Date | null;
    status: 'dikerjakan' | 'selesai';
}

export interface PekerjaanKaryawanWithDetails extends PekerjaanKaryawan {
    nama_karyawan?: string;
    nama_pekerjaan?: string;
    upah_per_unit?: number;
}

export async function getPekerjaanByProduk(id_produk: number) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                pk.*,
                k.nama_karyawan,
                jp.nama_pekerjaan,
                jp.upah_per_unit
            FROM pekerjaan_karyawan pk
            LEFT JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            LEFT JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            WHERE pk.id_produk = ?
            ORDER BY pk.id_jenis_pekerjaan, pk.id_karyawan`,
            [id_produk]
        );

        return rows as PekerjaanKaryawanWithDetails[];
    } catch (error) {
        console.error('Error getting pekerjaan by produk:', error);
        throw error;
    }
}

export async function getPekerjaanByKaryawan(id_karyawan: number) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                pk.*,
                p.nama_produk,
                jp.nama_pekerjaan,
                jp.upah_per_unit
            FROM pekerjaan_karyawan pk
            LEFT JOIN produksi p ON pk.id_produk = p.id_produk
            LEFT JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            WHERE pk.id_karyawan = ?`,
            [id_karyawan]
        );

        return rows;
    } catch (error) {
        console.error('Error getting pekerjaan by karyawan:', error);
        throw error;
    }
}

export async function createPekerjaanKaryawan(data: Omit<PekerjaanKaryawan, 'id_pekerjaan_karyawan'>) {
    try {
        const [result] = await pool.query(
            `INSERT INTO pekerjaan_karyawan 
            (id_produk, id_karyawan, id_jenis_pekerjaan, unit_dikerjakan, target_unit, tanggal_selesai, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_produk,
                data.id_karyawan,
                data.id_jenis_pekerjaan,
                data.unit_dikerjakan,
                data.target_unit,
                data.tanggal_selesai,
                data.status
            ]
        );

        return result;
    } catch (error) {
        console.error('Error creating pekerjaan karyawan:', error);
        throw error;
    }
}

export async function createMultiplePekerjaanKaryawan(pekerjaanList: Omit<PekerjaanKaryawan, 'id_pekerjaan_karyawan'>[]) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        for (const pekerjaan of pekerjaanList) {
            await connection.query(
                `INSERT INTO pekerjaan_karyawan 
                (id_produk, id_karyawan, id_jenis_pekerjaan, unit_dikerjakan, target_unit, tanggal_selesai, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    pekerjaan.id_produk,
                    pekerjaan.id_karyawan,
                    pekerjaan.id_jenis_pekerjaan,
                    pekerjaan.unit_dikerjakan,
                    pekerjaan.target_unit,
                    pekerjaan.tanggal_selesai,
                    pekerjaan.status
                ]
            );
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Error creating multiple pekerjaan karyawan:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function updatePekerjaanKaryawan(id: number, data: Partial<Omit<PekerjaanKaryawan, 'id_pekerjaan_karyawan'>>) {
    try {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);

        const [result] = await pool.query(
            `UPDATE pekerjaan_karyawan SET ${fields} WHERE id_pekerjaan_karyawan = ?`,
            [...values, id]
        );

        return result;
    } catch (error) {
        console.error('Error updating pekerjaan karyawan:', error);
        throw error;
    }
}

export async function deletePekerjaanKaryawan(id: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM pekerjaan_karyawan WHERE id_pekerjaan_karyawan = ?',
            [id]
        );

        return result;
    } catch (error) {
        console.error('Error deleting pekerjaan karyawan:', error);
        throw error;
    }
}

export async function deletePekerjaanByProduk(id_produk: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM pekerjaan_karyawan WHERE id_produk = ?',
            [id_produk]
        );

        return result;
    } catch (error) {
        console.error('Error deleting pekerjaan by produk:', error);
        throw error;
    }
}

export async function deletePekerjaanByJenis(id_produk: number, id_jenis_pekerjaan: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM pekerjaan_karyawan WHERE id_produk = ? AND id_jenis_pekerjaan = ?',
            [id_produk, id_jenis_pekerjaan]
        );

        return result;
    } catch (error) {
        console.error('Error deleting pekerjaan by jenis:', error);
        throw error;
    }
}