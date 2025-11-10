import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
    getDashboardStats,
    getDistribusiUpah,
    getProdukTerbaru,
    getProdukDeadlineMendekat,
    getProdukProgress,
    getAbsensiKaryawan
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

        const [
            stats,
            distribusiUpah,
            produkTerbaru,
            deadlineMendekat,
            produkProgress,
            absensiKaryawan
        ] = await Promise.all([
            getDashboardStats(),
            getDistribusiUpah(),
            getProdukTerbaru(5),
            getProdukDeadlineMendekat(),
            getProdukProgress(),
            getAbsensiKaryawan(7)
        ]);

        return NextResponse.json({
            stats,
            distribusiUpah,
            produkTerbaru,
            deadlineMendekat,
            produkProgress,
            absensiKaryawan
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        );
    }
}