import { NextRequest, NextResponse } from "next/server";
import {getKaryawanById, updateKaryawan, deleteKaryawan} from "@/lib/karyawan";

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
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid ID" },
        { status: 400 },
      );
    }

    const existing = await getKaryawanById(id);

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Karyawan not found" },
        { status: 404 },
      );
    }

    await deleteKaryawan(id);

    return NextResponse.json({
      success: true,
      message: "Karyawan deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE /api/employee/[id]:", error);

    return NextResponse.json(
      { success: false, message: "Failed to delete karyawan" },
      { status: 500 },
    );
  }
}