import pool from "@/lib/db";

export interface Karyawan {
  id_karyawan: number;
  nama_karyawan: string;
  jenis_kelamin: "perempuan" | "laki-laki" | null;
  no_telp: string | null;
  email: string | null;
  alamat: string | null;
}
export async function getAllKaryawan() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM karyawan ORDER BY id_karyawan",
    );

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM karyawan",
    );

    const total = (countResult as any)[0].total;

    return {
      data: rows as Karyawan[],
      total,
    };
  } catch (error) {
    console.error("Error getting karaywan:", error);
    throw error;
  }
}

export async function getKaryawanById(id: number) {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM karyawan WHERE id_karyawan = ?",
      [id],
    );

    const data = rows as Karyawan[];

    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("Error getting karyawan by id:", error);
    throw error;
  }
}

export async function createKaryawan(data: Omit<Karyawan, "id_karyawan">) {
  try {
    const [result] = await pool.query(
      `INSERT INTO karyawan 
            (nama_karyawan, jenis_kelamin, no_telp, email, alamat) 
            VALUES (?, ?, ?, ?, ?)`,
      [data.nama_karyawan, data.jenis_kelamin, data.no_telp, data.email, data.alamat],
    );

    return result;
  } catch (error) {
    console.error("Error creating karyawan:", error);
    throw error;
  }
}

export async function updateKaryawan(
  id: number,
  data: Partial<Omit<Karyawan, "id_karyawan">>,
) {
  try {
    const fields = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = Object.values(data);

    const [result] = await pool.query(
      `UPDATE karyawan SET ${fields} WHERE id_karyawan = ?`,
      [...values, id],
    );

    return result;
  } catch (error) {
    console.error("Error updating karyawan:", error);
    throw error;
  }
}

export async function deleteKaryawan(id: number) {
  try {
    const [result] = await pool.query(
      "DELETE FROM karyawan WHERE id_karyawan = ?",
      [id],
    );

    return result;
  } catch (error) {
    console.error("Error deleting karyawan:", error);
    throw error;
  }
}
