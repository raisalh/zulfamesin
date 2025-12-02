import pool from "@/lib/db";

export interface Karyawan {
  id_karyawan: number;
  nama_karyawan: string;
  jenis_kelamin: "perempuan" | "laki-laki" | null;
  no_telp: string | null;
  email: string | null;
  alamat: string | null;
  deleted_at: Date | null;
  jenis_upah: "pola" | "harian" | null;
}

export async function getAllKaryawan(includeDeleted: boolean = false) {
  try {
    const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
    
    const [rows] = await pool.query(
      `SELECT * FROM karyawan ${whereClause} ORDER BY id_karyawan`
    );

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM karyawan ${whereClause}`
    );

    const total = (countResult as any)[0].total;

    return {
      data: rows as Karyawan[],
      total,
    };
  } catch (error) {
    console.error("Error getting karyawan:", error);
    throw error;
  }
}

export async function getKaryawanById(id: number) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM karyawan WHERE id_karyawan = ?",
      [id]
    );

    const data = rows as Karyawan[];

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error getting karyawan by id:", error);
    throw error;
  }
}

export async function createKaryawan(data: Omit<Karyawan, "id_karyawan" | "deleted_at">) {
  try {
    const [result] = await pool.query(
      `INSERT INTO karyawan 
            (nama_karyawan, jenis_kelamin, no_telp, email, alamat, jenis_upah) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [data.nama_karyawan, data.jenis_kelamin, data.no_telp, data.email, data.alamat, data.jenis_upah]
    );

    return result;
  } catch (error) {
    console.error("Error creating karyawan:", error);
    throw error;
  }
}

export async function updateKaryawan(
  id: number,
  data: Partial<Omit<Karyawan, "id_karyawan" | "deleted_at">>
) {
  try {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);

    const [result] = await pool.query(
      `UPDATE karyawan SET ${fields} WHERE id_karyawan = ?`,
      [...values, id]
    );

    return result;
  } catch (error) {
    console.error("Error updating karyawan:", error);
    throw error;
  }
}

// SOFT DELETE - Hanya update deleted_at
export async function deleteKaryawan(id: number) {
  try {
    const [result] = await pool.query(
      "UPDATE karyawan SET deleted_at = NOW() WHERE id_karyawan = ?",
      [id]
    );

    return result;
  } catch (error) {
    console.error("Error soft deleting karyawan:", error);
    throw error;
  }
}

// RESTORE - Untuk mengembalikan karyawan yang sudah dihapus (optional)
export async function restoreKaryawan(id: number) {
  try {
    const [result] = await pool.query(
      "UPDATE karyawan SET deleted_at = NULL WHERE id_karyawan = ?",
      [id]
    );

    return result;
  } catch (error) {
    console.error("Error restoring karyawan:", error);
    throw error;
  }
}

// HARD DELETE - Untuk benar-benar menghapus dari database (hanya untuk admin/maintenance)
export async function hardDeleteKaryawan(id: number) {
  try {
    const [result] = await pool.query(
      "DELETE FROM karyawan WHERE id_karyawan = ?",
      [id]
    );

    return result;
  } catch (error) {
    console.error("Error hard deleting karyawan:", error);
    throw error;
  }
}