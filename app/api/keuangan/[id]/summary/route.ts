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

        console.log('Fetching keuangan data...');
        const [keuanganRows] = await pool.query(`
            SELECT 
                COALESCE(SUM(CASE WHEN tipe = 'pemasukan' THEN amount ELSE 0 END), 0) as total_pemasukan,
                COALESCE(SUM(CASE WHEN tipe = 'pengeluaran' THEN amount ELSE 0 END), 0) as total_pengeluaran
            FROM keuangan
            WHERE id_produk = ?
        `, [id_produk]);
        console.log('Keuangan data:', keuanganRows);

        console.log('Fetching upah dibayar...');
        const [upahDibayarRows] = await pool.query(`
            SELECT COALESCE(SUM(total_upah), 0) as upah_dibayar
            FROM upah_karyawan
            WHERE id_produk = ? AND status_pembayaran = 'dibayar'
        `, [id_produk]);
        console.log('Upah dibayar:', upahDibayarRows);

        console.log('Fetching upah pola belum...');
        const [upahPolaBelumRows] = await pool.query(`
            SELECT COALESCE(SUM(uk.total_upah), 0) as upah_pola_belum
            FROM upah_karyawan uk
            INNER JOIN karyawan k ON uk.id_karyawan = k.id_karyawan
            WHERE uk.id_produk = ? 
            AND k.jenis_upah = 'pola'
            AND uk.status_pembayaran = 'belum_dibayar'
        `, [id_produk]);
        console.log('Upah pola belum:', upahPolaBelumRows);

        console.log('Fetching upah harian pending...');
        const [upahHarianBelumRows] = await pool.query(`
            SELECT 
                COUNT(DISTINCT pk.id_karyawan) as jumlah_karyawan,
                GROUP_CONCAT(DISTINCT k.nama_karyawan SEPARATOR ', ') as nama_karyawan,
                COALESCE(AVG(jp.upah_harian), 0) as avg_upah_harian
            FROM pekerjaan_karyawan pk
            INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            WHERE pk.id_produk = ? 
            AND k.jenis_upah = 'harian'
            AND pk.status IN ('diproses', 'selesai')
            AND NOT EXISTS (
                SELECT 1 FROM upah_karyawan uk 
                WHERE uk.id_karyawan = pk.id_karyawan
                AND uk.id_produk = pk.id_produk
                AND uk.status_pembayaran = 'dibayar'
            )
        `, [id_produk]);
        console.log('Upah harian pending:', upahHarianBelumRows);

        const keuanganData = (keuanganRows as any)[0];
        const upahDibayarData = (upahDibayarRows as any)[0];
        const upahPolaData = (upahPolaBelumRows as any)[0];
        const upahHarianData = (upahHarianBelumRows as any)[0];

        const totalPemasukan = parseFloat(keuanganData.total_pemasukan || 0);
        const totalPengeluaranManual = parseFloat(keuanganData.total_pengeluaran || 0);
        const totalUpahDibayar = parseFloat(upahDibayarData.upah_dibayar || 0);
        const totalUpahPolaBelum = parseFloat(upahPolaData.upah_pola_belum || 0);

        const totalPengeluaran = totalPengeluaranManual + totalUpahDibayar;
        const saldo = totalPemasukan - totalPengeluaran;

        return NextResponse.json({
            success: true,
            data: {
                total_pemasukan: totalPemasukan,
                total_pengeluaran: totalPengeluaran,
                total_pengeluaran_manual: totalPengeluaranManual,
                total_upah_dibayar: totalUpahDibayar,
                total_upah_pola_belum: totalUpahPolaBelum,
                upah_harian_pending: {
                    jumlah_karyawan: upahHarianData.jumlah_karyawan || 0,
                    nama_karyawan: upahHarianData.nama_karyawan || '',
                    avg_upah_harian: parseFloat(upahHarianData.avg_upah_harian || 0)
                },
                saldo: saldo
            }
        });
    } catch (error: any) {
        console.error('Error fetching keuangan summary:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sql: error.sql
        });
        return NextResponse.json(
            { success: false, message: 'Gagal mengambil ringkasan keuangan' },
            { status: 500 }
        );
    }
}