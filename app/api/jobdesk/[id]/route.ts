import { NextRequest, NextResponse } from "next/server";
import { getJenisPekerjaanById, updateJenisPekerjaan, deleteJenisPekerjaan } from "@/lib/jenisPekerjaan";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const jenisPekerjaan = await getJenisPekerjaanById(id);

        if (!jenisPekerjaan) {
            return NextResponse.json(
                { success: false, message: "Jenis pekerjaan tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: jenisPekerjaan
        });
    } catch (error) {
        console.error("Error in GET /api/jenis-pekerjaan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data jenis pekerjaan" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const body = await request.json();

        const existing = await getJenisPekerjaanById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Jenis pekerjaan tidak ditemukan" },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (body.nama_pekerjaan !== undefined) updateData.nama_pekerjaan = body.nama_pekerjaan;
        if (body.upah_per_unit !== undefined) updateData.upah_per_unit = body.upah_per_unit;

        await updateJenisPekerjaan(id, updateData);

        return NextResponse.json({
            success: true,
            message: "Jenis pekerjaan berhasil diupdate"
        });
    } catch (error) {
        console.error("Error in PUT /api/jenis-pekerjaan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengupdate jenis pekerjaan" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const existing = await getJenisPekerjaanById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Jenis pekerjaan tidak ditemukan" },
                { status: 404 }
            );
        }

        await deleteJenisPekerjaan(id);

        return NextResponse.json({
            success: true,
            message: "Jenis pekerjaan berhasil dihapus"
        });
    } catch (error) {
        console.error("Error in DELETE /api/jenis-pekerjaan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menghapus jenis pekerjaan" },
            { status: 500 }
        );
    }
}