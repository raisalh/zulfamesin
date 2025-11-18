export interface PekerjaanDetail {
    nama_produk: string;
    warna: string;
    nama_pekerjaan: string;
    total_unit: number;
    jumlah_progress: number;
}

export interface KaryawanDetail {
    id_karyawan: number;
    nama_karyawan: string;
    jenis_kelamin: string;
    pekerjaan: PekerjaanDetail[];
}

export interface AbsensiData {
    month: number;
    year: number;
    summary: { [key: string]: number };
    details: { [key: string]: KaryawanDetail[] };
    total_karyawan: number;
}

export interface AbsensiResponse {
    success: boolean;
    message?: string;
    data?: AbsensiData;
    error?: string;
}