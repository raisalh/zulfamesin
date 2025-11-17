import { NextRequest, NextResponse } from "next/server";
import { getAllUpahKaryawan, createUpahKaryawan } from "@/lib/upahKaryawan";

export async function GET(request: NextRequest) {
    try {
        const result = await getAllUpahKaryawan();

        return NextResponse.json({
            success: true,
            data: result.data,
            total: result.total
        });
    } catch (error) {
        console.error("Error in GET /api/upah-karyawan:", error);
        return NextResponse.json(
            { success: false, message: "Gagal mengambil data upah karyawan" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id_karyawan) {
            return NextResponse.json(
                { success: false, message: "ID Karyawan diperlukan" },
                { status: 400 }
            );
        }

        if (!body.id_produk) {
            return NextResponse.json(
                { success: false, message: "ID Produk diperlukan" },
                { status: 400 }
            );
        }

        const result = await createUpahKaryawan({
            id_karyawan: body.id_karyawan,
            id_produk: body.id_produk,
            total_pekerjaan: body.total_pekerjaan || 0,
            total_unit: body.total_unit || 0,
            total_upah: body.total_upah || 0,
            status_pembayaran: body.status_pembayaran || 'belum',
            tanggal_pembayaran: body.tanggal_pembayaran || null
        });

        return NextResponse.json(
            {
                success: true,
                message: "Upah karyawan berhasil ditambahkan",
                data: { id_upah: (result as any).insertId }
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error in POST /api/upah-karyawan:", error);
        return NextResponse.json(
            { success: false, message: "Gagal menambahkan upah karyawan" },
            { status: 500 }
        );
    }
}