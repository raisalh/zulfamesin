import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getDashboardStats,
    getDistribusiUpah,
    getProdukTerbaru,
    getProdukDeadlineMendekat,
    getProdukProgress,
    getAbsensiKaryawan,
    getCountProductionLastMonth,
    getCountProductionThisMonth,
    getCountPolaThisMonth,
    getCountPolaLastMonth
} from '@/lib/dashboard';

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const minUpahTinggi = searchParams.get('minUpahTinggi');
        const minUpahMenengah = searchParams.get('minUpahMenengah');
        const maxUpahMenengah = searchParams.get('maxUpahMenengah');

        const distribusiParams = {
            minUpahTinggi: minUpahTinggi ? Number(minUpahTinggi) : undefined,
            minUpahMenengah: minUpahMenengah ? Number(minUpahMenengah) : undefined,
            maxUpahMenengah: maxUpahMenengah ? Number(maxUpahMenengah) : undefined,
        };

        const [
            stats,
            distribusiUpah,
            produkTerbaru,
            deadlineMendekat,
            produkProgress,
            absensiKaryawan,
            countLastMonth,
            countThisMonth,
            countPolaThisMonth,
            countPolaLastMonth
        ] = await Promise.all([
            getDashboardStats(),
            getDistribusiUpah(distribusiParams),
            getProdukTerbaru(5),
            getProdukDeadlineMendekat(),
            getProdukProgress(),
            getAbsensiKaryawan(),
            getCountProductionLastMonth(),
            getCountProductionThisMonth(),
            getCountPolaThisMonth(),
            getCountPolaLastMonth()
        ]);
        
        const bulanIni = Number(countThisMonth) || 0;
        const bulanLalu = Number(countLastMonth) || 0;

        let persenProduk = 0;
        if (bulanLalu > 0) {
            persenProduk = ((bulanIni - bulanLalu) / bulanLalu) * 100;
        } else if (bulanIni > 0) {
            persenProduk = 100;
        }

        const produkGrowth = {
            bulanIni,
            bulanLalu,
            persen: Number(persenProduk.toFixed(2))
        };

        const polaBulanIni = Number(countPolaThisMonth) || 0;
        const polaBulanLalu = Number(countPolaLastMonth) || 0;

        let persenPola = 0;
        if (polaBulanLalu > 0) {
            persenPola = ((polaBulanIni - polaBulanLalu) / polaBulanLalu) * 100;
        } else if (polaBulanIni > 0) {
            persenPola = 100;
        }

        const polaGrowth = {
            bulanIni: polaBulanIni,
            bulanLalu: polaBulanLalu,
            persen: Number(persenPola.toFixed(2))
        };

        const response = {
            stats,
            distribusiUpah,
            produkTerbaru,
            deadlineMendekat,
            produkProgress,
            absensiKaryawan,
            produkGrowth,
            polaGrowth
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}