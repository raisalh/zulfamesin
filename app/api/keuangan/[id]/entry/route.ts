import { NextRequest, NextResponse } from 'next/server';
import { getKeuanganById, updateKeuangan, deleteKeuangan } from '@/lib/keuangan';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const id_keuangan = parseInt(id);

        if (isNaN(id_keuangan)) {
            return NextResponse.json(
                { success: false, message: 'ID keuangan tidak valid' },
                { status: 400 }
            );
        }

        const keuangan = await getKeuanganById(id_keuangan);

        if (!keuangan) {
            return NextResponse.json(
                { success: false, message: 'Keuangan tidak ditemukan' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: keuangan
        });
    } catch (error) {
        console.error('Error fetching keuangan:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil data keuangan' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const id_keuangan = parseInt(id);
        const body = await request.json();

        if (isNaN(id_keuangan)) {
            return NextResponse.json(
                { success: false, message: 'ID keuangan tidak valid' },
                { status: 400 }
            );
        }

        if (!body.tipe || !body.keterangan || !body.amount) {
            return NextResponse.json(
                { success: false, message: 'Semua field wajib diisi' },
                { status: 400 }
            );
        }

        const updateData = {
            tipe: body.tipe,
            keterangan: body.keterangan,
            amount: body.amount
        };

        await updateKeuangan(id_keuangan, updateData);

        return NextResponse.json({
            success: true,
            message: 'Keuangan berhasil diperbarui'
        });
    } catch (error) {
        console.error('Error updating keuangan:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal memperbarui keuangan' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const id_keuangan = parseInt(id);

        if (isNaN(id_keuangan)) {
            return NextResponse.json(
                { success: false, message: 'ID keuangan tidak valid' },
                { status: 400 }
            );
        }

        await deleteKeuangan(id_keuangan);

        return NextResponse.json({
            success: true,
            message: 'Keuangan berhasil dihapus'
        });
    } catch (error) {
        console.error('Error deleting keuangan:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal menghapus keuangan' },
            { status: 500 }
        );
    }
}