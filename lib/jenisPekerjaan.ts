import pool from '@/lib/db';

export interface JenisPekerjaan {
    id_jenis_pekerjaan: number;
    nama_pekerjaan: string;
    upah_per_unit: number;
    tipe: 'sistem' | 'manual';
    upah_harian: number;
}

export async function getAllJenisPekerjaan() {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM jenis_pekerjaan ORDER BY id_jenis_pekerjaan',
        );

        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM jenis_pekerjaan'
        );

        const total = (countResult as any)[0].total;

        return {
            data: rows as JenisPekerjaan[],
            total,
        };
    } catch (error) {
        console.error('Error getting jenis pekerjaan:', error);
        throw error;
    }
}

export async function getJenisPekerjaanById(id: number) {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM jenis_pekerjaan WHERE id_jenis_pekerjaan = ?',
            [id]
        );

        const data = rows as JenisPekerjaan[];
        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error('Error getting jenis pekerjaan by id:', error);
        throw error;
    }
}

export async function createJenisPekerjaan(data: Omit<JenisPekerjaan, 'id_jenis_pekerjaan'>) {
    try {
        const [result] = await pool.query(
            `INSERT INTO jenis_pekerjaan 
            (nama_pekerjaan, upah_per_unit, tipe, upah_harian) 
            VALUES (?, ?, ?, ?)`,
            [
                data.nama_pekerjaan,
                data.upah_per_unit, 
                data.tipe,
                data.upah_harian
            ]
        );

        return result;
    } catch (error) {
        console.error('Error creating jenis pekerjaan:', error);
        throw error;
    }
}

export async function updateJenisPekerjaan(id: number, data: Partial<Omit<JenisPekerjaan, 'id_jenis_pekerjaan'>>) {
    try {
        const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);

        const [result] = await pool.query(
            `UPDATE jenis_pekerjaan SET ${fields} WHERE id_jenis_pekerjaan = ?`,
            [...values, id]
        );

        return result;
    } catch (error) {
        console.error('Error updating jenis pekerjaan:', error);
        throw error;
    }
}

export async function deleteJenisPekerjaan(id: number) {
    try {
        const [result] = await pool.query(
            'DELETE FROM jenis_pekerjaan WHERE id_jenis_pekerjaan = ?',
            [id]
        );

        return result;
    } catch (error) {
        console.error('Error deleting jenis pekerjaan:', error);
        throw error;
    }
}