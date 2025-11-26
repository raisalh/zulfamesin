import { NextRequest, NextResponse } from 'next/server';
import {
    getLaporanProduksiPerBulan,
    getLaporanProduksiDetail,
    getLaporanKaryawan,
    getLaporanKaryawanDetail,
    getLaporanUpah,
    getLaporanUpahPerProduk,
    getLaporanPolaProduksi,
    getOnTimeDelivery,
    getDurasiPengerjaan,
    getDistribusiJenisPekerjaan,
    getCompletionRate,
    getTingkatKehadiran,
    getWorkloadBalance,
    getUpahBelumDibayar,
    getPerbandinganUpahBulanan
} from '@/lib/laporan';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const type = searchParams.get('type');

        const status = searchParams.get('status') || undefined;
        const tahun = searchParams.get('tahun')
            ? parseInt(searchParams.get('tahun')!)
            : undefined;
        const bulan = searchParams.get('bulan')
            ? parseInt(searchParams.get('bulan')!)
            : undefined;

        if (category === 'produksi') {
            if (type === 'monthly') {
                const data = await getLaporanProduksiPerBulan({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'detail') {
                const data = await getLaporanProduksiDetail({
                    tahun,
                    bulan,
                    status
                });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'pola') {
                const data = await getLaporanPolaProduksi({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'on-time-delivery') {
                const data = await getOnTimeDelivery({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'durasi-pengerjaan') {
                const limit = searchParams.get('limit')
                    ? parseInt(searchParams.get('limit')!)
                    : 10;
                const data = await getDurasiPengerjaan({ tahun, bulan, limit });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'distribusi-jenis-pekerjaan') {
                const data = await getDistribusiJenisPekerjaan({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }
        }

        if (category === 'karyawan') {
            if (type === 'summary') {
                const data = await getLaporanKaryawan({
                    tahun,
                    bulan
                });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'detail') {
                const id_karyawan = searchParams.get('id_karyawan');
                if (!id_karyawan) {
                    return NextResponse.json(
                        { success: false, message: 'id_karyawan is required' },
                        { status: 400 }
                    );
                }

                const data = await getLaporanKaryawanDetail(parseInt(id_karyawan), {
                    tahun,
                    bulan
                });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'completion-rate') {
                const data = await getCompletionRate({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'tingkat-kehadiran') {
                const data = await getTingkatKehadiran({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'workload-balance') {
                const data = await getWorkloadBalance({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }
        }

        if (category === 'upah') {
            if (type === 'summary') {
                const data = await getLaporanUpah({
                    tahun,
                    bulan,
                    status
                });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'per-produk') {
                const id_karyawan = searchParams.get('id_karyawan');
                const data = await getLaporanUpahPerProduk({
                    tahun,
                    bulan,
                    id_karyawan: id_karyawan ? parseInt(id_karyawan) : undefined
                });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'belum-dibayar') {
                const data = await getUpahBelumDibayar({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

            if (type === 'perbandingan-bulanan') {
                if (!tahun || !bulan) {
                    return NextResponse.json(
                        { success: false, message: 'Tahun dan bulan harus diisi' },
                        { status: 400 }
                    );
                }
                const data = await getPerbandinganUpahBulanan({ tahun, bulan });
                return NextResponse.json({ success: true, data });
            }

        }
        return NextResponse.json(
            { success: false, message: 'Invalid parameters' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in laporan API:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error', error: String(error) },
            { status: 500 }
        );
    }
}