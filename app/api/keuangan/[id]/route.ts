import { NextRequest, NextResponse } from 'next/server';
import { getKeuanganByProduk } from '@/lib/keuangan';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const id_produk = parseInt(id);

        if (isNaN(id_produk)) {
            return NextResponse.json(
                { success: false, message: 'ID produk tidak valid' },
                { status: 400 }
            );
        }

        const keuanganList = await getKeuanganByProduk(id_produk);

        return NextResponse.json({
            success: true,
            data: keuanganList
        });
    } catch (error) {
        console.error('Error fetching keuangan:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data keuangan' },
            { status: 500 }
        );
    }
}