import { NextRequest, NextResponse } from 'next/server';
import { createMultipleKeuangan, KeuanganInput } from '@/lib/keuangan';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { keuanganList } = body;

        if (!keuanganList || !Array.isArray(keuanganList) || keuanganList.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Data keuangan tidak valid' },
                { status: 400 }
            );
        }

        for (const item of keuanganList) {
            if (!item.id_produk || !item.tipe || !item.keterangan || !item.amount || !item.tanggal) {
                return NextResponse.json(
                    { success: false, message: 'Semua field wajib diisi' },
                    { status: 400 }
                );
            }
        }

        await createMultipleKeuangan(keuanganList);

        return NextResponse.json({
            success: true,
            message: 'Keuangan berhasil disimpan'
        });
    } catch (error) {
        console.error('Error saving keuangan:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menyimpan keuangan' },
            { status: 500 }
        );
    }
}