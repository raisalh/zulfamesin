import { NextRequest, NextResponse } from "next/server";
import { 
    getUpahKaryawanById, 
    updateUpahKaryawan, 
    deleteUpahKaryawan 
} from "@/lib/upahKaryawan";

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

        const upah = await getUpahKaryawanById(id);

        if (!upah) {
            return NextResponse.json(
                { success: false, message: "Upah karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: upah
        });
    } catch (error) {
        console.error("Error in GET /api/upah-karyawan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data upah karyawan" },
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

        const existing = await getUpahKaryawanById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Upah karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (body.total_pekerjaan !== undefined) updateData.total_pekerjaan = body.total_pekerjaan;
        if (body.total_unit !== undefined) updateData.total_unit = body.total_unit;
        if (body.total_upah !== undefined) updateData.total_upah = body.total_upah;
        if (body.status_pembayaran !== undefined) updateData.status_pembayaran = body.status_pembayaran;
        if (body.tanggal_pembayaran !== undefined) updateData.tanggal_pembayaran = body.tanggal_pembayaran;

        await updateUpahKaryawan(id, updateData);

        return NextResponse.json({
            success: true,
            message: "Upah karyawan berhasil diupdate"
        });
    } catch (error) {
        console.error("Error in PUT /api/upah-karyawan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengupdate upah karyawan" },
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

        const existing = await getUpahKaryawanById(id);
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "Upah karyawan tidak ditemukan" },
                { status: 404 }
            );
        }

        await deleteUpahKaryawan(id);

        return NextResponse.json({
            success: true,
            message: "Upah karyawan berhasil dihapus"
        });
    } catch (error) {
        console.error("Error in DELETE /api/upah-karyawan/[id]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menghapus upah karyawan" },
            { status: 500 }
        );
    }
}