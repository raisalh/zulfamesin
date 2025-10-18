import pool from "@/lib/db";

export interface Gulungan {
  id_gulungan: number;
  id_produk: number;
  nomor_gulungan: number;
  jumlah_pola: number;
}

export interface GulunganInput {
  id_produk: number;
  nomor_gulungan: number;
  jumlah_pola: number;
}

export async function getGulunganByProduk(id_produk: number) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM gulungan WHERE id_produk = ? ORDER BY nomor_gulungan ASC",
      [id_produk],
    );

    return rows as Gulungan[];
  } catch (error) {
    console.error("Error getting gulungan by produk:", error);
    throw error;
  }
}

export async function getGulunganById(id_gulungan: number) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM gulungan WHERE id_gulungan = ?",
      [id_gulungan],
    );

    const data = rows as Gulungan[];

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error getting gulungan by id:", error);
    throw error;
  }
}

export async function createGulungan(data: GulunganInput) {
  try {
    const [result] = await pool.query(
      `INSERT INTO gulungan 
            (id_produk, nomor_gulungan, jumlah_pola) 
            VALUES (?, ?, ?)`,
      [data.id_produk, data.nomor_gulungan, data.jumlah_pola],
    );

    return result;
  } catch (error) {
    console.error("Error creating gulungan:", error);
    throw error;
  }
}

export async function createMultipleGulungan(gulunganList: GulunganInput[]) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const gulungan of gulunganList) {
      await connection.query(
        `INSERT INTO gulungan 
                (id_produk, nomor_gulungan, jumlah_pola) 
                VALUES (?, ?, ?)`,
        [gulungan.id_produk, gulungan.nomor_gulungan, gulungan.jumlah_pola],
      );
    }

    await connection.commit();

    return { success: true };
  } catch (error) {
    await connection.rollback();
    console.error("Error creating multiple gulungan:", error);
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateGulungan(
  id_gulungan: number,
  data: Partial<Omit<Gulungan, "id_gulungan" | "tanggal_dibuat">>,
) {
  try {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);

    const [result] = await pool.query(
      `UPDATE gulungan SET ${fields} WHERE id_gulungan = ?`,
      [...values, id_gulungan],
    );

    return result;
  } catch (error) {
    console.error("Error updating gulungan:", error);
    throw error;
  }
}

export async function deleteGulungan(id_gulungan: number) {
  try {
    const [result] = await pool.query(
      "DELETE FROM gulungan WHERE id_gulungan = ?",
      [id_gulungan],
    );

    return result;
  } catch (error) {
    console.error("Error deleting gulungan:", error);
    throw error;
  }
}

export async function deleteGulunganByProduk(id_produk: number) {
  try {
    const [result] = await pool.query(
      "DELETE FROM gulungan WHERE id_produk = ?",
      [id_produk],
    );

    return result;
  } catch (error) {
    console.error("Error deleting gulungan by produk:", error);
    throw error;
  }
}

export async function getTotalPolaByProduk(id_produk: number): Promise<number> {
  try {
    const [rows] = await pool.query(
      "SELECT COALESCE(SUM(jumlah_pola), 0) as total_pola FROM gulungan WHERE id_produk = ?",
      [id_produk],
    );

    const result = (rows as any)[0];

    return result.total_pola || 0;
  } catch (error) {
    console.error("Error getting total pola:", error);
    throw error;
  }
}
