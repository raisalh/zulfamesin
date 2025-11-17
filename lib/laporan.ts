import pool from '@/lib/db';

export interface LaporanProduksi {
    bulan: string;
    total_produksi: number;
    selesai: number;
    diproses: number;
}

export interface LaporanProduksiDetail {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    status: string;
    progress: number;
    deadline: Date;
    tanggal_mulai: Date | null;
    tanggal_selesai: Date | null;
    total_gulungan: number;
    total_pola: number;
}

export interface LaporanKaryawan {
    id_karyawan: number;
    nama_karyawan: string;
    total_pekerjaan: number;
    total_unit: number; 
    unit_selesai: number;  
    unit_sisa: number;  
}

export interface LaporanKaryawanDetail {
    id_karyawan: number;
    nama_karyawan: string;
    nama_produk: string;
    nama_pekerjaan: string;
    unit_dikerjakan: number;
    target_unit: number;
    status: string;
    tanggal_mulai: Date | null;
    tanggal_selesai: Date | null;
}

export interface LaporanUpah {
    id_karyawan: number;
    nama_karyawan: string;
    total_pekerjaan: number;
    total_unit: number;
    total_upah: number;
    dibayar: number;
    belum_dibayar: number;
}

export interface LaporanUpahDetail {
    id_upah: number;
    id_karyawan: number;
    nama_karyawan: string;
    id_produk: number;
    nama_produk: string;
    total_pekerjaan: number;
    total_unit: number;
    total_upah: number;
    status_pembayaran: string;
    tanggal_pembayaran: Date | null;
}

export interface LaporanPolaProduksi {
    total_pola: number;
    pola_selesai: number;
    pola_belum_selesai: number;
}

export async function getLaporanProduksiPerBulan(params: {
    tahun?: number;
    bulan?: number;
}) {
    try {
        let query = `
            SELECT 
                DATE_FORMAT(tanggal_mulai, '%Y-%m') as bulan,
                CAST(COUNT(*) AS UNSIGNED) as total_produksi,
                CAST(SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) AS UNSIGNED) as selesai,
                CAST(SUM(CASE WHEN status = 'diproses' THEN 1 ELSE 0 END) AS UNSIGNED) as diproses
            FROM produksi
            WHERE 1=1
        `;

        const queryParams: any[] = [];

        if (params.tahun) {
            query += ` AND YEAR(tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }

        query += ` GROUP BY bulan ORDER BY bulan`;

        const [rows] = await pool.query(query, queryParams);

        return rows as LaporanProduksi[];
    } catch (error) {
        console.error('Error getting laporan produksi per bulan:', error);
        throw error;
    }
}

export async function getLaporanProduksiDetail(params: {
    tahun?: number;
    bulan?: number;
    status?: string;
}) {
    try {
        let query = `
            SELECT 
                p.id_produk,
                p.nama_produk,
                p.warna,
                p.ukuran,
                p.status,
                p.progress,
                p.deadline,
                p.tanggal_mulai,
                p.tanggal_selesai,
                p.gulungan as total_gulungan,
                COALESCE(SUM(g.jumlah_pola), 0) as total_pola
            FROM produksi p
            LEFT JOIN gulungan g ON p.id_produk = g.id_produk
            WHERE 1=1
        `;

        const queryParams: any[] = [];

        if (params.tahun) {
            query += ` AND YEAR(tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }

        if (params.status) {
            query += ` AND p.status = ?`;
            queryParams.push(params.status);
        }

        query += ` GROUP BY p.id_produk ORDER BY p.tanggal_mulai DESC`;

        const [rows] = await pool.query(query, queryParams);

        return rows as LaporanProduksiDetail[];
    } catch (error) {
        console.error('Error getting laporan produksi detail:', error);
        throw error;
    }
}

export async function getLaporanKaryawan(params: {
    tahun?: number;
    bulan?: number;
}) {
    try {
        let query = `
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                CAST(COUNT(DISTINCT pk.id_pekerjaan_karyawan) AS UNSIGNED) as total_pekerjaan,
                CAST(COALESCE(SUM(pk.target_unit), 0) AS UNSIGNED) as total_unit,
                CAST(COALESCE(SUM(pk.unit_dikerjakan), 0) AS UNSIGNED) as unit_selesai,
                CAST(COALESCE(SUM(pk.target_unit - pk.unit_dikerjakan), 0) AS UNSIGNED) as unit_sisa
            FROM karyawan k
            LEFT JOIN pekerjaan_karyawan pk ON k.id_karyawan = pk.id_karyawan
            LEFT JOIN produksi p ON pk.id_produk = p.id_produk
            WHERE 1=1
        `;

        const queryParams: any[] = [];

        if (params.tahun) {
            query += ` AND YEAR(p.tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(p.tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }
        
        query += ` GROUP BY k.id_karyawan ORDER BY unit_selesai DESC`;

        const [rows] = await pool.query(query, queryParams);

        return rows as LaporanKaryawan[];
    } catch (error) {
        console.error('Error getting laporan karyawan:', error);
        throw error;
    }
}

export async function getLaporanKaryawanDetail(
    id_karyawan: number,
    params: {
        tahun?: number;
        bulan?: number;
    }
) {
    try {
        let query = `
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                p.nama_produk,
                jp.nama_pekerjaan,
                pk.unit_dikerjakan,
                pk.target_unit,
                pk.status,
                p.tanggal_mulai,
                pk.tanggal_selesai
            FROM pekerjaan_karyawan pk
            INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            INNER JOIN produksi p ON pk.id_produk = p.id_produk
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            WHERE k.id_karyawan = ?
        `;

        const queryParams: any[] = [id_karyawan];

        if (params.tahun) {
            query += ` AND YEAR(tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }
        query += ` ORDER BY p.tanggal_mulai DESC`;

        const [rows] = await pool.query(query, queryParams);

        return rows as LaporanKaryawanDetail[];
    } catch (error) {
        console.error('Error getting laporan karyawan detail:', error);
        throw error;
    }
}

export async function getLaporanUpah(params: {
    tahun?: number;
    bulan?: number;
    status?: string;
}) {
    try {
        let query = `
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                COUNT(DISTINCT pk.id_pekerjaan_karyawan) as total_pekerjaan,
                SUM(pk.unit_dikerjakan) as total_unit,
                SUM(pk.unit_dikerjakan * jp.upah_per_unit) as total_upah,
                SUM(CASE WHEN pk.status = 'selesai' THEN pk.unit_dikerjakan * jp.upah_per_unit ELSE 0 END) as dibayar,
                SUM(CASE WHEN pk.status = 'dikerjakan' THEN pk.unit_dikerjakan * jp.upah_per_unit ELSE 0 END) as belum_dibayar
            FROM karyawan k
            LEFT JOIN pekerjaan_karyawan pk ON k.id_karyawan = pk.id_karyawan
            LEFT JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            LEFT JOIN produksi p ON pk.id_produk = p.id_produk
            WHERE 1=1
        `;

        const queryParams: any[] = [];
        if (params.tahun) {
            query += ` AND YEAR(tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }

        if (params.status) {
            query += ` AND pk.status = ?`;
            queryParams.push(params.status);
        }

        query += ` GROUP BY k.id_karyawan ORDER BY total_upah DESC`;

        const [rows] = await pool.query(query, queryParams);

        return rows as LaporanUpah[];
    } catch (error) {
        console.error('Error getting laporan upah:', error);
        throw error;
    }
}

export async function getLaporanUpahPerProduk(params: {
    tahun?: number;
    bulan?: number;
    id_karyawan?: number;
}) {
    try {
        let query = `
            SELECT 
                k.id_karyawan,
                k.nama_karyawan,
                p.id_produk,
                p.nama_produk,
                COUNT(DISTINCT pk.id_pekerjaan_karyawan) as total_pekerjaan,
                SUM(pk.unit_dikerjakan) as total_unit,
                SUM(pk.unit_dikerjakan * jp.upah_per_unit) as total_upah
            FROM pekerjaan_karyawan pk
            INNER JOIN karyawan k ON pk.id_karyawan = k.id_karyawan
            INNER JOIN produksi p ON pk.id_produk = p.id_produk
            INNER JOIN jenis_pekerjaan jp ON pk.id_jenis_pekerjaan = jp.id_jenis_pekerjaan
            WHERE 1=1
        `;

        const queryParams: any[] = [];
        if (params.tahun) {
            query += ` AND YEAR(tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }
        
        if (params.id_karyawan) {
            query += ` AND k.id_karyawan = ?`;
            queryParams.push(params.id_karyawan);
        }

        query += ` GROUP BY k.id_karyawan, p.id_produk ORDER BY total_upah DESC`;

        const [rows] = await pool.query(query, queryParams);

        return rows;
    } catch (error) {
        console.error('Error getting laporan upah per produk:', error);
        throw error;
    }
}

export async function getLaporanPolaProduksi(params: {
    tahun?: number;
    bulan?: number;
}) {
    try {
        let query = `
            SELECT 
                CAST(COALESCE(SUM(pk.target_unit), 0) AS UNSIGNED) as total_pola,
                CAST(COALESCE(SUM(pk.unit_dikerjakan), 0) AS UNSIGNED) as pola_selesai,
                CAST(COALESCE(SUM(pk.target_unit - pk.unit_dikerjakan), 0) AS UNSIGNED) as pola_belum_selesai
            FROM produksi p
            LEFT JOIN pekerjaan_karyawan pk ON p.id_produk = pk.id_produk
            WHERE 1=1
        `;

        const queryParams: any[] = [];

        if (params.tahun) {
            query += ` AND YEAR(p.tanggal_mulai) = ?`;
            queryParams.push(params.tahun);
        }

        if (params.bulan) {
            query += ` AND MONTH(p.tanggal_mulai) = ?`;
            queryParams.push(params.bulan);
        }

        const [rows] = await pool.query(query, queryParams);
        return (rows as any)[0] as LaporanPolaProduksi;
    } catch (error) {
        console.error('Error getting laporan pola produksi:', error);
        throw error;
    }
}