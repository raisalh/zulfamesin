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
    getPerbandinganUpahBulanan,
    getCashflowMingguan,
    getCashflowBulanan,
    getCashflowTahunan
} from '@/lib/laporan';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const category = searchParams.get('category');
        const type = searchParams.get('type');

        const tahunStr = searchParams.get('tahun');
        const bulanStr = searchParams.get('bulan');
        const status = searchParams.get('status') || undefined;

        let tahun: number | undefined = undefined;
        if (tahunStr && tahunStr.trim() !== '') {
            const parsedTahun = parseInt(tahunStr.trim());
            if (!isNaN(parsedTahun) && parsedTahun > 2000 && parsedTahun <= 2100) {
                tahun = parsedTahun;
            }
        }

        let bulan: number | undefined = undefined;
        if (bulanStr && bulanStr.trim() !== '') {
            const parsedBulan = parseInt(bulanStr.trim());
            if (!isNaN(parsedBulan) && parsedBulan >= 1 && parsedBulan <= 12) {
                bulan = parsedBulan;
            }
        }

        console.log('🔍 API Laporan - Filters:', { category, type, tahun, bulan, status });

        if (category === 'produksi') {
            if (type === 'monthly') {
                const data = await getLaporanProduksiPerBulan({ tahun, bulan });
                console.log('Monthly data count:', data.length);
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
                console.log('Pola data:', data);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'on-time-delivery') {
                const data = await getOnTimeDelivery({ tahun, bulan });
                console.log('On-time delivery:', data);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'durasi-pengerjaan') {
                const limit = searchParams.get('limit')
                    ? parseInt(searchParams.get('limit')!)
                    : 10;
                const data = await getDurasiPengerjaan({ tahun, bulan, limit });
                console.log('Durasi pengerjaan count:', data.length);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'distribusi-jenis-pekerjaan') {
                const data = await getDistribusiJenisPekerjaan({ tahun, bulan });
                console.log('Distribusi jenis pekerjaan count:', data.length);
                return NextResponse.json({ success: true, data });
            }
        }

        if (category === 'karyawan') {
            if (type === 'summary') {
                const data = await getLaporanKaryawan({
                    tahun,
                    bulan
                });
                console.log('Karyawan summary count:', data.length);
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
                console.log('Completion rate count:', data.length);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'tingkat-kehadiran') {
                const data = await getTingkatKehadiran({ tahun, bulan });
                console.log('Tingkat kehadiran count:', data.length);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'workload-balance') {
                const data = await getWorkloadBalance({ tahun, bulan });
                console.log('Workload balance count:', data.length);
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
                console.log('Upah summary count:', data.length, 'with status:', status);
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
                console.log('Upah belum dibayar count:', data.length);
                return NextResponse.json({ success: true, data });
            }

            if (type === 'perbandingan-bulanan') {
                if (!tahun || !bulan) {
                    return NextResponse.json(
                        { success: false, message: 'Tahun dan bulan harus diisi untuk perbandingan bulanan' },
                        { status: 400 }
                    );
                }
                const data = await getPerbandinganUpahBulanan({ tahun, bulan });
                console.log('Perbandingan bulanan:', data);
                return NextResponse.json({ success: true, data });
            }
        }

        if (category === 'cashflow') {
            const periode = searchParams.get('periode') || 'mingguan';
        
            if (periode === 'mingguan') {
                const data = await getCashflowMingguan();
                return NextResponse.json({ success: true, data });
            }
        
            if (periode === 'bulanan') {
                if (!tahun || !bulan) {
                    return NextResponse.json(
                        { success: false, message: 'Tahun dan bulan harus diisi untuk periode bulanan' },
                        { status: 400 }
                    );
                }
                const data = await getCashflowBulanan();
                return NextResponse.json({ success: true, data });
            }
        
            if (periode === 'tahunan') {
                if (!tahun) {
                    return NextResponse.json(
                        { success: false, message: 'Tahun harus diisi untuk periode tahunan' },
                        { status: 400 }
                    );
                }
                const data = await getCashflowTahunan();
                return NextResponse.json({ success: true, data });
            }
        }

        return NextResponse.json(
            { success: false, message: 'Invalid category or type parameter' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Error in laporan API:', error);
        return NextResponse.json(
            { success: false, message: 'Terjadi kesalahan pada server', error: String(error) },
            { status: 500 }
        );
    }
}