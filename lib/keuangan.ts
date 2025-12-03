import pool from "@/lib/db";

export interface Keuangan {
    id_keuangan: number;
    id_produk: number;
    tipe: "pemasukan" | "pengeluaran";
    keterangan: string;
    amount: number;
    tanggal: Date;
}

export interface KeuanganInput {
    id_produk: number;
    tipe: "pemasukan" | "pengeluaran";
    keterangan: string;
    amount: number;
    tanggal: Date;
}

export async function getKeuanganByProduk(id_produk: number) {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM keuangan WHERE id_produk = ? ORDER BY id_keuangan ASC",
            [id_produk],
        );

        return rows as Keuangan[];
    } catch (error) {
        console.error("Error getting keuangan by produk:", error);
        throw error;
    }
}

export async function getKeuanganById(id_keuangan: number) {
    try {
        const [rows] = await pool.query(
            "SELECT * FROM keuangan WHERE id_keuangan = ?",
            [id_keuangan],
        );

        const data = rows as Keuangan[];

        return data.length > 0 ? data[0] : null;
    } catch (error) {
        console.error("Error getting keuangan by id:", error);
        throw error;
    }
}

export async function createKeuangan(data: KeuanganInput) {
    try {
        const [result] = await pool.query(
            `INSERT INTO keuangan 
            (id_produk, tipe, keterangan, amount, tanggal) 
            VALUES (?, ?, ?, ?, ?)`,
            [data.id_produk, data.tipe, data.keterangan, data.amount, data.tanggal],
        );

        return result;
    } catch (error) {
        console.error("Error creating keuangan:", error);
        throw error;
    }
}

export async function createMultipleKeuangan(keuanganList: KeuanganInput[]) {
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const keuangan of keuanganList) {
            await connection.query(
                `INSERT INTO keuangan 
                (id_produk, tipe, keterangan, amount, tanggal) 
                VALUES (?, ?, ?, ?, ?)`,
                [keuangan.id_produk, keuangan.tipe, keuangan.keterangan, keuangan.amount, keuangan.tanggal],
            );
        }

        await connection.commit();

        return { success: true };
    } catch (error) {
        await connection.rollback();
        console.error("Error creating multiple keuangan:", error);
        throw error;
    } finally {
        connection.release();
    }
}

export async function updateKeuangan(
    id_keuangan: number,
    data: Partial<Omit<Keuangan, "id_keuangan" | "tanggal">>,
) {
    try {
        const fields = Object.keys(data)
            .map((key) => `${key} = ?`)
            .join(", ");
        const values = Object.values(data);

        const [result] = await pool.query(
            `UPDATE keuangan SET ${fields} WHERE id_keuangan = ?`,
            [...values, id_keuangan],
        );

        return result;
    } catch (error) {
        console.error("Error updating keuangan:", error);
        throw error;
    }
}

export async function deleteKeuangan(id_keuangan: number) {
    try {
        const [result] = await pool.query(
            "DELETE FROM keuangan WHERE id_keuangan = ?",
            [id_keuangan],
        );

        return result;
    } catch (error) {
        console.error("Error deleting keuangan:", error);
        throw error;
    }
}

export async function deleteKeuanganByProduk(id_produk: number) {
    try {
        const [result] = await pool.query(
            "DELETE FROM keuangan WHERE id_produk = ?",
            [id_produk],
        );

        return result;
    } catch (error) {
        console.error("Error deleting keuangan by produk:", error);
        throw error;
    }
}

export async function getTotalPemasukanByProduk(id_produk: number): Promise<number> {
    try {
        const [rows] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total_pola FROM keuangan WHERE id_produk = ? AND tipe = 'pemasukan'",
            [id_produk],
        );

        const result = (rows as any)[0];

        return result.total_pola || 0;
    } catch (error) {
        console.error("Error getting total pemasukan:", error);
        throw error;
    }
}

export async function getTotalPengeluaranByProduk(id_produk: number): Promise<number> {
    try {
        const [rows] = await pool.query(
            "SELECT COALESCE(SUM(amount), 0) as total_pola FROM keuangan WHERE id_produk = ? AND tipe = 'pengeluaran'",
            [id_produk],
        );

        const result = (rows as any)[0];

        return result.total_pola || 0;
    } catch (error) {
        console.error("Error getting total pengeluaran:", error);
        throw error;
    }
}
