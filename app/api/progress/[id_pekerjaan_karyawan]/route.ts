import { NextRequest, NextResponse } from "next/server";
import { getProgressByPekerjaanKaryawan } from "@/lib/progressPekerjaan";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id_pekerjaan_karyawan: string }> }
) {
    try {
        const { id_pekerjaan_karyawan: idParam } = await params;
        const id = parseInt(idParam);

        if (isNaN(id)) {
            return NextResponse.json(
                { success: false, message: "ID tidak valid" },
                { status: 400 }
            );
        }

        const progressList = await getProgressByPekerjaanKaryawan(id);

        return NextResponse.json({
            success: true,
            data: progressList
        });
    } catch (error) {
        console.error("Error in GET /api/progress/[id_pekerjaan_karyawan]:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data progress" },
            { status: 500 }
        );
    }
}