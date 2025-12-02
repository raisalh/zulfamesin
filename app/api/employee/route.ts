
import { NextRequest, NextResponse } from "next/server";
import { getAllKaryawan, createKaryawan } from "@/lib/karyawan";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const result = await getAllKaryawan(includeDeleted);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in GET /api/employee:", error);

    return NextResponse.json(
      { success: false, message: "Failed to fetch karyawan" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.nama_karyawan) {
      return NextResponse.json(
        { success: false, message: "Nama Karyawan is required" },
        { status: 400 },
      );
    }

    const result = await createKaryawan({
      nama_karyawan: body.nama_karyawan,
      jenis_kelamin: body.jenis_kelamin || null,
      no_telp: body.no_telp || null,
      email: body.email || null,
      alamat: body.alamat || null,
      jenis_upah: body.jenis_upah || null,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Karyawan created successfully",
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/employee:", error);

    return NextResponse.json(
      { success: false, message: "Failed to create karyawan" },
      { status: 500 },
    );
  }
}