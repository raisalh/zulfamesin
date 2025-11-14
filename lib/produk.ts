import pool from "@/lib/db";

export interface Produksi {
  id_produk: number;
  nama_produk: string;
  warna: string | null;
  ukuran: string | null;
  gulungan: number | null;
  progress: number | null;
  deadline: Date | null;
  status: "diproses" | "selesai" | null;
  id_user: number;
  tanggal_mulai: Date | null;
  tanggal_selesai: Date | null;
}

export interface ProduksiStats {
  total: number;
  sedang_diproses: number;
  sudah_selesai: number;
}

export async function getAllProduksi(page: number = 1, limit: number = 10) {
  const offset = (page - 1) * limit;

  try {
    const [rows] = await pool.query(
      "SELECT * FROM produksi ORDER BY id_produk DESC LIMIT ? OFFSET ?",
      [limit, offset],
    );

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM produksi",
    );

    const total = (countResult as any)[0].total;

    return {
      data: rows as Produksi[],
      total,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error getting produksi:", error);
    throw error;
  }
}

export async function getProduksiStats(): Promise<ProduksiStats> {
  try {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'diproses' THEN 1 ELSE 0 END) as sedang_diproses,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as sudah_selesai
      FROM produksi
    `);

    const result = (rows as any)[0];

    return {
      total: result.total || 0,
      sedang_diproses: result.sedang_diproses || 0,
      sudah_selesai: result.sudah_selesai || 0,
    };
  } catch (error) {
    console.error("Error getting stats:", error);
    throw error;
  }
}

export async function getProduksiById(id: number) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM produksi WHERE id_produk = ?",
      [id],
    );

    const data = rows as Produksi[];

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error getting produksi by id:", error);
    throw error;
  }
}

export async function createProduksi(data: Omit<Produksi, "id_produk">) {
  try {
    const [result] = await pool.query(
      `INSERT INTO produksi 
      (nama_produk, warna, ukuran, gulungan, progress, deadline, status, id_user, tanggal_mulai, tanggal_selesai)  
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.nama_produk,
        data.warna,
        data.ukuran,
        data.gulungan,
        data.progress,
        data.deadline,
        data.status,
        data.id_user,
        data.tanggal_mulai,
        data.tanggal_selesai
      ],
    );

    return result;
  } catch (error) {
    console.error("Error creating produksi:", error);
    throw error;
  }
}

export async function updateProduksi(
  id: number,
  data: Partial<Omit<Produksi, "id_produk">>,
) {
  try {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);

    const [result] = await pool.query(
      `UPDATE produksi SET ${fields} WHERE id_produk = ?`,
      [...values, id],
    );

    return result;
  } catch (error) {
    console.error("Error updating produksi:", error);
    throw error;
  }
}

export async function deleteProduksi(id: number) {
  try {
    const [result] = await pool.query(
      "DELETE FROM produksi WHERE id_produk = ?",
      [id],
    );

    return result;
  } catch (error) {
    console.error("Error deleting produksi:", error);
    throw error;
  }
}

export async function updateStatusBasedOnProgress(id_produk: number) {
  try {
    const progress = await getOverallProgressByProduk(id_produk);
    
    if (progress >= 100) {
      await pool.query(`
        UPDATE produksi 
        SET status = 'selesai', 
            tanggal_selesai = CASE 
              WHEN tanggal_selesai IS NULL THEN CURRENT_DATE 
              ELSE tanggal_selesai 
            END
        WHERE id_produk = ? AND status != 'selesai'
      `, [id_produk]);
      
      return { updated: true, progress };
    }
    
    return { updated: false, progress };
  } catch (error) {
    console.error("Error updating status based on progress:", error);
    throw error;
  }
}

export async function getOverallProgressByProduk(id_produk: number): Promise<number> {
  try {
    const [rows] = await pool.query(
      `SELECT 
        COALESCE(
          CASE 
            WHEN SUM(target_unit) > 0 
            THEN LEAST(ROUND((SUM(unit_dikerjakan) / SUM(target_unit)) * 100, 2), 100)
            ELSE 0 
          END, 
          0
        ) as progress
      FROM pekerjaan_karyawan
      WHERE id_produk = ?`,
      [id_produk]
    );

    const result = (rows as any)[0];
    return result.progress || 0;
  } catch (error) {
    console.error('Error getting overall progress:', error);
    throw error;
  }
}