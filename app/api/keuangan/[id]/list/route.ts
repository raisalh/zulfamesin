import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

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

        const [keuanganManualResult] = await pool.query(`
            SELECT 
                id_keuangan as id,
                'manual' as source,
                tipe,
                keterangan,
                amount,
                tanggal,
                null as nama_karyawan
            FROM keuangan
            WHERE id_produk = ?
        `, [id_produk]);

        const [upahDibayarResult] = await pool.query(`
            SELECT 
                uk.id_upah as id,
                'upah' as source,
                'pengeluaran' as tipe,
                CONCAT('Pembayaran upah - ', k.nama_karyawan) as keterangan,
                uk.total_upah as amount,
                uk.tanggal_pembayaran as tanggal,
                k.nama_karyawan
            FROM upah_karyawan uk
            INNER JOIN karyawan k ON uk.id_karyawan = k.id_karyawan
            WHERE uk.id_produk = ? AND uk.status_pembayaran = 'dibayar'
        `, [id_produk]);
        const upahDibayar = upahDibayarResult as any[];

        const keuanganManual = keuanganManualResult as any[];

        const allTransactions = [...keuanganManual, ...upahDibayar].sort((a: any, b: any) => {
            return new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
        });

        return NextResponse.json({
            success: true,
            data: allTransactions
        });
    } catch (error) {
        console.error('Error fetching keuangan list:', error);
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil daftar keuangan' },
            { status: 500 }
        );
    }
}