import { NextRequest, NextResponse } from "next/server";
import { getKaryawanById, deleteKaryawan, updateKaryawan } from "@/lib/karyawan";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const karyawan = await getKaryawanById(id);

    if (!karyawan) {
      return NextResponse.json(
        { success: false, message: "Karyawan not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: karyawan,
    });
  } catch (error) {
    console.error("Error in GET /api/employee/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch karyawan" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const existing = await getKaryawanById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Karyawan not found" },
        { status: 404 },
      );
    }

    const updateData: any = {};

    if (body.nama_karyawan !== undefined)
      updateData.nama_karyawan = body.nama_karyawan;
    if (body.jenis_kelamin !== undefined)
      updateData.jenis_kelamin = body.jenis_kelamin;
    if (body.no_telp !== undefined) 
      updateData.no_telp = body.no_telp;
    if (body.email !== undefined)
      updateData.email = body.email;
    if (body.alamat !== undefined)
      updateData.alamat = body.alamat;

    await updateKaryawan(id, updateData);

    return NextResponse.json({
      success: true,
      message: "Karyawan updated successfully",
    });
  } catch (error) {
    console.error("Error in PUT /api/employee/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to update karyawan" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const connection = await pool.getConnection();
  
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "ID tidak valid" },
        { status: 400 },
      );
    }

    const existing = await getKaryawanById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan" },
        { status: 404 },
      );
    }

    await connection.beginTransaction();

    const [upahDibayar] = await connection.query(
      `SELECT COUNT(*) as count FROM upah_karyawan 
        WHERE id_karyawan = ? AND status_pembayaran = 'dibayar'`,
      [id]
    );

    if ((upahDibayar as any)[0].count > 0) {
      await connection.rollback();
      return NextResponse.json(
        { 
          success: false, 
          message: "Karyawan tidak dapat dihapus karena memiliki riwayat pembayaran yang sudah diselesaikan" 
        },
        { status: 400 },
      );
    }

    await connection.query(
      `DELETE pp FROM progress_pekerjaan pp
        INNER JOIN pekerjaan_karyawan pk ON pp.id_pekerjaan_karyawan = pk.id_pekerjaan_karyawan
        WHERE pk.id_karyawan = ?`,
      [id]
    );

    await connection.query(
      'DELETE FROM upah_karyawan WHERE id_karyawan = ?',
      [id]
    );

    await connection.query(
      'DELETE FROM pekerjaan_karyawan WHERE id_karyawan = ?',
      [id]
    );

    await connection.query(
      'DELETE FROM karyawan WHERE id_karyawan = ?',
      [id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error in DELETE /api/employee/[id]:", error);

    return NextResponse.json(
      { 
        success: false, 
        message: "Gagal menghapus karyawan. Silakan coba lagi." 
      },
      { status: 500 },
    );
  } finally {
    connection.release();
  }
}