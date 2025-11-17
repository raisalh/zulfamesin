import pool from '@/lib/db';

export interface UpahKaryawan {
    id_upah: number;
    id_karyawan: number;
    id_produk: number;
    total_pekerjaan: number;
    total_unit: number;
    total_upah: number;
    status_pembayaran: 'dibayar' | 'belum';
    tanggal_pembayaran: Date | null;
}

export interface UpahKaryawanWithDetails extends UpahKaryawan {
    nama_karyawan?: string;
    nama_produk?: string;
    warna?: string;
    ukuran?: string;
}

export async function getAllUpahKaryawan() {
    try {
        const [rows] = await pool.query(
            `SELECT 
                uk.*,
                k.nama_karyawan,
                p.nama_produk,
                p.warna,
                p.ukuran,
                p.status as status_produk
            FROM upah_karyawan uk
            LEFT JOIN karyawan k ON uk.id_karyawan = k.id_karyawan
            LEFT JOIN produksi p ON uk.id_produk = p.id_produk
            ORDER BY uk.id_upah DESC`
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM upah_karyawan'
        );

        const total = (countResult as any)[0].total;

        return {
            data: rows as UpahKaryawanWithDetails[],
            total,
        };
    } catch (error) {
        console.error('Error getting upah karyawan:', error);
        throw error;
    }
}

export async function getUpahKaryawanById(id: number) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                uk.*,
                k.nama_karyawan,
                p.nama_produk,
                p.warna,
                p.ukuran
            FROM upah_karyawan uk
            LEFT JOIN karyawan k ON uk.id_karyawan = k.id_karyawan
            LEFT JOIN produksi p ON uk.id_produk = p.id_produk
            WHERE uk.id_upah = ?`,
            [id]
        );

        const data = rows as UpahKaryawanWithDetails[];
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error getting upah karyawan by id:', error);
        throw error;
    }
}

export async function getUpahByKaryawanAndProduk(id_karyawan: number, id_produk: number) {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM upah_karyawan 
            WHERE id_karyawan = ? AND id_produk = ?`,
            [id_karyawan, id_produk]
        );

        const data = rows as UpahKaryawan[];
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error getting upah by karyawan and produk:', error);
        throw error;
    }
}

export async function createUpahKaryawan(data: Omit<UpahKaryawan, 'id_upah'>) {
    try {
        const [result] = await pool.query(
            `INSERT INTO upah_karyawan 
            (id_karyawan, id_produk, total_pekerjaan, total_unit, total_upah, status_pembayaran, tanggal_pembayaran) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                data.id_karyawan,
                data.id_produk,
                data.total_pekerjaan,
                data.total_unit,
                data.total_upah,
                data.status_pembayaran,
                data.tanggal_pembayaran
            ]
        );

        return result;
    } catch (error) {
        console.error('Error creating upah karyawan:', error);
        throw error;
    }
}

export async function updateUpahKaryawan(id: number, data: Partial<Omit<UpahKaryawan, 'id_upah'>>) {
    try {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);

        const [result] = await pool.query(
            `UPDATE upah_karyawan SET ${fields} WHERE id_upah = ?`,
            [...values, id]
        );

        return result;
    } catch (error) {
        console.error('Error updating upah karyawan:', error);
        throw error;
    }
}

export async function updateUpahByKaryawanAndProduk(
    id_karyawan: number, 
    id_produk: number, 
    data: Partial<Omit<UpahKaryawan, 'id_upah' | 'id_karyawan' | 'id_produk'>>
) {
    try {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);

        const [result] = await pool.query(
            `UPDATE upah_karyawan SET ${fields} WHERE id_karyawan = ? AND id_produk = ?`,
            [...values, id_karyawan, id_produk]
        );

        return result;
    } catch (error) {
        console.error('Error updating upah by karyawan and produk:', error);
        throw error;
    }
}

export async function deleteUpahKaryawan(id: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM upah_karyawan WHERE id_upah = ?',
            [id]
        );

        return result;
    } catch (error) {
        console.error('Error deleting upah karyawan:', error);
        throw error;
    }
}

export async function deleteUpahByProduk(id_produk: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM upah_karyawan WHERE id_produk = ?',
            [id_produk]
        );

        return result;
    } catch (error) {
        console.error('Error deleting upah by produk:', error);
        throw error;
    }
}

export async function calculateAndSaveUpahFromPekerjaan(id_produk: number) {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        const [pekerjaanRows] = await connection.query(
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

        const pekerjaanData = pekerjaanRows as any[];

        await connection.query(
            'DELETE FROM upah_karyawan WHERE id_produk = ?',
            [id_produk]
        );

        for (const data of pekerjaanData) {
            await connection.query(
                `INSERT INTO upah_karyawan 
                (id_karyawan, id_produk, total_pekerjaan, total_unit, total_upah, status_pembayaran) 
                VALUES (?, ?, ?, ?, ?, 'belum')`,
                [
                    data.id_karyawan,
                    id_produk,
                    data.total_pekerjaan,
                    data.total_unit,
                    data.total_upah
                ]
            );
        }

        await connection.commit();
        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error('Error calculating and saving upah:', error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function recalculateUpah(id_produk: number) {
    try {
        await calculateAndSaveUpahFromPekerjaan(id_produk);
        return { success: true };
    } catch (error) {
        console.error('Error recalculating upah:', error);
        throw error;
    }
}