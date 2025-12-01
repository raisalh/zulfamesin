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
            AND deleted_at IS NULL
        `);
        const produkBulanIni = (produkRows as any)[0].total || 0;

        const [upahTerbayarRows] = await pool.query(`
            SELECT COALESCE(SUM(total_upah), 0) AS total 
            FROM upah_karyawan
            WHERE status_pembayaran = 'dibayar'
            AND tanggal_pembayaran IS NOT NULL
            AND MONTH(tanggal_pembayaran) = MONTH(CURRENT_DATE())
            AND YEAR(tanggal_pembayaran) = YEAR(CURRENT_DATE())
        `);
        const upahTerbayar = (upahTerbayarRows as any)[0].total || 0;

        const [upahBelumRows] = await pool.query(`
            SELECT COALESCE(SUM(uk.total_upah), 0) AS total
            FROM upah_karyawan uk
            INNER JOIN produksi p ON uk.id_produk = p.id_produk
            WHERE uk.status_pembayaran = 'belum'
            AND uk.tanggal_pembayaran IS NULL
            AND p.deleted_at IS NULL
        `);
        const upahBelumDibayar = (upahBelumRows as any)[0].total || 0;

        const [karyawanRows] = await pool.query(`
            SELECT COUNT(*) as total FROM karyawan WHERE deleted_at IS NULL
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

export async function getDistribusiUpah(params?: {
    minUpahTinggi?: number;
    minUpahMenengah?: number;
    maxUpahMenengah?: number;
}): Promise<DistribusiUpah> {
    try {
        const minUpahTinggi = params?.minUpahTinggi || 100000;
        const minUpahMenengah = params?.minUpahMenengah || 50000;
        const maxUpahMenengah = params?.maxUpahMenengah || 99999;

        const [rows] = await pool.query(`
            SELECT 
                SUM(CASE WHEN total_upah_karyawan >= ? THEN 1 ELSE 0 END) AS upah_tinggi,
                SUM(CASE WHEN total_upah_karyawan >= ? AND total_upah_karyawan <= ? THEN 1 ELSE 0 END) AS upah_menengah,
                SUM(CASE WHEN total_upah_karyawan < ? THEN 1 ELSE 0 END) AS upah_rendah
            FROM (
                SELECT 
                    uk.id_karyawan,
                    SUM(uk.total_upah) AS total_upah_karyawan
                FROM upah_karyawan uk
                JOIN produksi p ON uk.id_produk = p.id_produk
                WHERE MONTH(p.tanggal_mulai) = MONTH(CURRENT_DATE())
                AND YEAR(p.tanggal_mulai) = YEAR(CURRENT_DATE())
                AND p.deleted_at IS NULL
                GROUP BY uk.id_karyawan
            ) AS grouped;
        `, [minUpahTinggi, minUpahMenengah, maxUpahMenengah, minUpahMenengah]);

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
                p.ukuran,
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
            AND p.deleted_at IS NULL
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
                p.ukuran,
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
            AND p.deleted_at IS NULL
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

                COALESCE(g.totalPola, 0) AS totalPola,

                COALESCE(
                    CASE WHEN pk.sumTarget > 0 
                        THEN ROUND((pk.sumSelesai / pk.sumTarget) * g.totalPola, 0)
                    ELSE 0 END,
                0) AS polaSelesai,

                COALESCE(
                    CASE WHEN pk.sumTarget > 0
                        THEN LEAST(ROUND((pk.sumSelesai / pk.sumTarget) * 100, 2), 100)
                    ELSE 0 END,
                0) AS progress

            FROM produksi p

            LEFT JOIN (
                SELECT id_produk, SUM(jumlah_pola) AS totalPola
                FROM gulungan
                GROUP BY id_produk
            ) g ON g.id_produk = p.id_produk

            LEFT JOIN (
                SELECT id_produk,
                    SUM(unit_dikerjakan) AS sumSelesai,
                    SUM(target_unit) AS sumTarget
                FROM pekerjaan_karyawan
                GROUP BY id_produk
            ) pk ON pk.id_produk = p.id_produk

            WHERE p.status = 'diproses'
            AND DATE_FORMAT(p.tanggal_mulai, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
            AND p.deleted_at IS NULL

            ORDER BY p.id_produk DESC;
        `);

        return rows as ProdukProgress[];
    } catch (error) {
        console.error('Error getting produk progress:', error);
        throw error;
    }
}

export async function getAbsensiKaryawan(): Promise<AbsensiKaryawan[]> {
    try {
        const [rows] = await pool.query(`
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                MAX(pp.tanggal_update) AS tanggal_terakhir,
                COUNT(DISTINCT DATE(pp.tanggal_update)) AS jumlah_kehadiran
            FROM karyawan k
            INNER JOIN pekerjaan_karyawan pk 
                ON k.id_karyawan = pk.id_karyawan
            INNER JOIN progress_pekerjaan pp 
                ON pk.id_pekerjaan_karyawan = pp.id_pekerjaan_karyawan
            WHERE MONTH(pp.tanggal_update) = MONTH(CURRENT_DATE())
            AND YEAR(pp.tanggal_update) = YEAR(CURRENT_DATE())
            AND k.deleted_at IS NULL
            GROUP BY k.id_karyawan, k.nama_karyawan
            HAVING jumlah_kehadiran > 0
            ORDER BY tanggal_terakhir DESC;
        `);

        return rows as AbsensiKaryawan[];
    } catch (error) {
        console.error('Error getting absensi karyawan:', error);
        throw error;
    }
}

export async function getCountProductionThisMonth() {
    try {
        const [rows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM produksi
            WHERE DATE_FORMAT(tanggal_mulai, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
            AND deleted_at IS NULL
        `);
        return (rows as any)[0].total || 0;
    } catch (error) {
        console.error('Error counting production this month:', error);
        throw error;
    }
}

export async function getCountProductionLastMonth() {
    try {
        const [rows] = await pool.query(`
            SELECT COUNT(*) AS total
            FROM produksi
            WHERE DATE_FORMAT(tanggal_mulai, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')
            AND deleted_at IS NULL
        `);
        return (rows as any)[0].total || 0;
    } catch (error) {
        console.error('Error counting production last month:', error);
        throw error;
    }
}

export async function getCountPolaThisMonth() {
    try {
        const [rows] = await pool.query(`
            SELECT COALESCE(SUM(g.jumlah_pola), 0) AS total
            FROM gulungan g
            INNER JOIN produksi p ON g.id_produk = p.id_produk
            WHERE DATE_FORMAT(p.tanggal_mulai, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
            AND p.deleted_at IS NULL
        `);
        return (rows as any)[0].total || 0;
    } catch (error) {
        console.error('Error counting pola this month:', error);
        throw error;
    }
}

export async function getCountPolaLastMonth() {
    try {
        const [rows] = await pool.query(`
            SELECT COALESCE(SUM(g.jumlah_pola), 0) AS total
            FROM gulungan g
            INNER JOIN produksi p ON g.id_produk = p.id_produk
            WHERE DATE_FORMAT(p.tanggal_mulai, '%Y-%m') = DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 1 MONTH), '%Y-%m')
            AND p.deleted_at IS NULL
        `);
        return (rows as any)[0].total || 0;
    } catch (error) {
        console.error('Error counting pola last month:', error);
        throw error;
    }
}