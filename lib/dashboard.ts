import pool from '@/lib/db';

export interface DashboardStats {
    produkBulanIni: number;
    upahTerbayar: number;
    upahBelumDibayar: number;
    totalKaryawan: number;
}

export interface DistribusiUpah {
    upahTinggi: number;
    upahMenengah: number;
    upahRendah: number;
}

export interface ProdukTerbaru {
    id_produk: number;
    nama_produk: string;
    warna: string;
    status: string;
    progress: number;
}

export interface ProdukDeadlineMendekat {
    id_produk: number;
    nama_produk: string;
    warna: string;
    deadline: Date;
    status: string;
    progress: number;
    hariTersisa: number;
}

export interface ProdukProgress {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    progress: number;
    totalPola: number;
    polaSelesai: number;
}

export interface AbsensiKaryawan {
    id_karyawan: number;
    nama_karyawan: string;
    tanggal_terakhir: Date;
    jumlah_kehadiran: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        const [produkRows] = await pool.query(`
            SELECT COUNT(*) as total 
            FROM produksi 
            WHERE MONTH(tanggal_mulai) = MONTH(CURRENT_DATE()) 
            AND YEAR(tanggal_mulai) = YEAR(CURRENT_DATE())
        `);
        const produkBulanIni = (produkRows as any)[0].total || 0;

        const [upahTerbayarRows] = await pool.query(`
            SELECT COALESCE(SUM(total_upah), 0) as total 
            FROM upah_karyawan 
            WHERE status_pembayaran = 'dibayar'
            AND MONTH(tanggal_pembayaran) = MONTH(CURRENT_DATE())
            AND YEAR(tanggal_pembayaran) = YEAR(CURRENT_DATE())
        `);
        const upahTerbayar = (upahTerbayarRows as any)[0].total || 0;

        const [upahBelumRows] = await pool.query(`
            SELECT COALESCE(SUM(uk.total_upah), 0) as total 
            FROM upah_karyawan uk
            INNER JOIN produksi p ON uk.id_produk = p.id_produk
            WHERE uk.status_pembayaran = 'belum'
            AND MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
            AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
        `);
        const upahBelumDibayar = (upahBelumRows as any)[0].total || 0;

        const [karyawanRows] = await pool.query(`
            SELECT COUNT(*) as total FROM karyawan
        `);
        const totalKaryawan = (karyawanRows as any)[0].total || 0;

        return {
            produkBulanIni,
            upahTerbayar,
            upahBelumDibayar,
            totalKaryawan
        };
    } catch (error) {
        console.error('Error getting dashboard stats:', error);
        throw error;
    }
}

export async function getDistribusiUpah(): Promise<DistribusiUpah> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                SUM(CASE WHEN uk.total_upah > 100000 THEN 1 ELSE 0 END) as upah_tinggi,
                SUM(CASE WHEN uk.total_upah BETWEEN 50000 AND 100000 THEN 1 ELSE 0 END) as upah_menengah,
                SUM(CASE WHEN uk.total_upah < 500000 THEN 1 ELSE 0 END) as upah_rendah
            FROM upah_karyawan uk
            INNER JOIN produksi p ON uk.id_produk = p.id_produk
            WHERE uk.status_pembayaran = 'belum'
            AND MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
            AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
        `);

        const result = (rows as any)?.[0];
        
        return {
            upahTinggi: Number(result?.upah_tinggi) || 0,
            upahMenengah: Number(result?.upah_menengah) || 0,
            upahRendah: Number(result?.upah_rendah) || 0
        };
    } catch (error) {
        console.error('Error getting distribusi upah:', error);
        throw error;
    }
}

export async function getProdukTerbaru(limit: number = 3): Promise<ProdukTerbaru[]> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id_produk,
                p.nama_produk,
                p.warna,
                p.status,
                COALESCE(
                    CASE 
                        WHEN SUM(pk.target_unit) > 0 
                        THEN LEAST(ROUND((SUM(pk.unit_dikerjakan) / SUM(pk.target_unit)) * 100, 2), 100)
                        ELSE 0 
                    END, 
                    0
                ) as progress
            FROM produksi p
            LEFT JOIN pekerjaan_karyawan pk ON p.id_produk = pk.id_produk
            WHERE MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
            AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
            GROUP BY p.id_produk, p.nama_produk, p.warna, p.status
            ORDER BY p.id_produk DESC
            LIMIT ?
        `, [limit]);

        return rows as ProdukTerbaru[];
    } catch (error) {
        console.error('Error getting produk terbaru:', error);
        throw error;
    }
}

export async function getProdukDeadlineMendekat(): Promise<ProdukDeadlineMendekat[]> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id_produk,
                p.nama_produk,
                p.warna,
                p.deadline,
                p.status,
                COALESCE(
                    CASE 
                        WHEN SUM(pk.target_unit) > 0 
                        THEN LEAST(ROUND((SUM(pk.unit_dikerjakan) / SUM(pk.target_unit)) * 100, 2), 100)
                        ELSE 0 
                    END, 
                    0
                ) as progress,
                DATEDIFF(p.deadline, CURRENT_DATE()) as hariTersisa
            FROM produksi p
            LEFT JOIN pekerjaan_karyawan pk ON p.id_produk = pk.id_produk
            WHERE p.status = 'diproses'
            AND MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
            AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
            AND DATEDIFF(p.deadline, CURRENT_DATE()) <= 7
            AND DATEDIFF(p.deadline, CURRENT_DATE()) >= 0
            GROUP BY p.id_produk, p.nama_produk, p.warna, p.deadline, p.status
            ORDER BY p.deadline ASC
        `);

        return rows as ProdukDeadlineMendekat[];
    } catch (error) {
        console.error('Error getting produk deadline mendekat:', error);
        throw error;
    }
}

export async function getProdukProgress(): Promise<ProdukProgress[]> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id_produk,
                p.nama_produk,
                p.warna,
                p.ukuran,
                COALESCE(
                    CASE 
                        WHEN SUM(pk.target_unit) > 0 
                        THEN LEAST(ROUND((SUM(pk.unit_dikerjakan) / SUM(pk.target_unit)) * 100, 2), 100)
                        ELSE 0 
                    END, 
                    0
                ) as progress,
                COALESCE(SUM(pk.target_unit), 0) as totalPola,
                COALESCE(SUM(pk.unit_dikerjakan), 0) as polaSelesai
            FROM produksi p
            LEFT JOIN pekerjaan_karyawan pk ON p.id_produk = pk.id_produk
            WHERE p.status = 'diproses'
            AND MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
            AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
            GROUP BY p.id_produk, p.nama_produk, p.warna, p.ukuran
            ORDER BY p.id_produk DESC
        `);

        return rows as ProdukProgress[];
    } catch (error) {
        console.error('Error getting produk progress:', error);
        throw error;
    }
}

export async function getAbsensiKaryawan(hari: number = 7): Promise<AbsensiKaryawan[]> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                MAX(pp.tanggal_update) as tanggal_terakhir,
                COUNT(DISTINCT DATE(pp.tanggal_update)) as jumlah_kehadiran
            FROM karyawan k
            INNER JOIN pekerjaan_karyawan pk ON k.id_karyawan = pk.id_karyawan
            INNER JOIN progress_pekerjaan pp ON pk.id_pekerjaan_karyawan = pp.id_pekerjaan_karyawan
            WHERE pp.tanggal_update >= DATE_SUB(CURRENT_DATE(), INTERVAL ? DAY)
            GROUP BY k.id_karyawan, k.nama_karyawan
            HAVING jumlah_kehadiran > 0
            ORDER BY tanggal_terakhir DESC
        `, [hari]);

        return rows as AbsensiKaryawan[];
    } catch (error) {
        console.error('Error getting absensi karyawan:', error);
        throw error;
    }
}