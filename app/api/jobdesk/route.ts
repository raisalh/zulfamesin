import { NextRequest, NextResponse } from "next/server";
import { getAllJenisPekerjaan, createJenisPekerjaan } from "@/lib/jenisPekerjaan";

export async function GET(request: NextRequest) {
    try {
        const result = await getAllJenisPekerjaan();

        return NextResponse.json({
            success: true,
            data: result.data,
            total: result.total
        });
    } catch (error) {
        console.error("Error in GET /api/jenis-pekerjaan:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data jenis pekerjaan" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.nama_pekerjaan) {
            return NextResponse.json(
                { success: false, message: "Nama pekerjaan diperlukan" },
                { status: 400 }
            );
        }

        if (!body.upah_per_unit || body.upah_per_unit <= 0) {
            return NextResponse.json(
                { success: false, message: "Upah per unit harus lebih dari 0" },
                { status: 400 }
            );
        }

        const result = await createJenisPekerjaan({
            nama_pekerjaan: body.nama_pekerjaan,
            upah_per_unit: body.upah_per_unit,
            tipe: body.tipe || "sistem",
            upah_harian: body.upah_harian
        });

        return NextResponse.json(
            {
                success: true,
                message: "Jenis pekerjaan berhasil ditambahkan",
                data: { id_jenis_pekerjaan: (result as any).insertId }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/jenis-pekerjaan:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menambahkan jenis pekerjaan" },
            { status: 500 }
        );
    }
}