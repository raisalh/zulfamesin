"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconUser, IconDownload } from "@tabler/icons-react";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
}

interface Produk {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    status: "selesai" | "diproses" | null;
}

interface PekerjaanDetail {
    id_pekerjaan_karyawan: number;
    nama_pekerjaan: string;
    unit_dikerjakan: number;
    upah_per_unit: number;
    target_unit: number | null;
}

interface Ringkasan {
    total_kategori: number;
    total_unit: number;
    total_upah: number;
}

export default function DetailInformasiUpahKaryawan() {
    const params = useParams();
    const router = useRouter();
    const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
    const [produk, setProduk] = useState<Produk | null>(null);
    const [pekerjaanList, setPekerjaanList] = useState<PekerjaanDetail[]>([]);
    const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
    const [statusPembayaran, setStatusPembayaran] = useState<string>("belum");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [params.id, params.id_produk]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `/api/employee/${params.id}/works/${params.id_produk}`
            );
            const result = await response.json();

            if (result.success) {
                setKaryawan(result.data.karyawan);
                setProduk(result.data.produk);
                setPekerjaanList(result.data.pekerjaan_list);
                setRingkasan(result.data.ringkasan);
                setStatusPembayaran(result.data.status_pembayaran);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleExport = () => {
        //belum, bingung
    };

    const handleStatusChange = async (newStatus: string) => {
        if (produk?.status !== "selesai") {
            alert("Pembayaran hanya bisa diubah jika produk sudah selesai");
            return;
        }

        try {
            const response = await fetch(`/api/employee/${params.id}/works/${params.id_produk}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status_pembayaran: newStatus })
            });

            const result = await response.json();

            if (result.success) {
                setStatusPembayaran(newStatus);
            } else {
                alert(result.message || "Gagal mengubah status");
            }
        } catch (error) {
            console.error("Error updating status:", error);
            alert("Terjadi kesalahan saat mengubah status");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-6">
            <div>
                <div className="flex items-center justify-between mb-6">

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-gray-200"
                        >
                            <IconArrowLeft size={20} />
                        </button>

                        <h1 className="text-xl font-semibold text-gray-800">
                            Detail Informasi Upah Karyawan
                        </h1>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                    >
                        <IconDownload size={18} />
                        Export
                    </button>
                </div>

                {karyawan && produk && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                <IconUser size={24} className="text-gray-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    {karyawan.nama_karyawan}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Produk: {produk.nama_produk} ({produk.ukuran}) - {produk.warna}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Rincian Pekerjaan & Upah
                            </h3>

                            <div className="space-y-4">
                                {pekerjaanList.map((pekerjaan, index) => (
                                    <div
                                        key={pekerjaan.id_pekerjaan_karyawan}
                                        className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4 pb-4 border-b last:border-b-0"
                                    >
                                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                            <IconUser size={20} className="text-gray-600" />
                                        </div>

                                        <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900">{pekerjaan.nama_pekerjaan}</h4>
                                            <p className="text-sm text-gray-600">
                                                {pekerjaan.unit_dikerjakan} buah × {formatRupiah(pekerjaan.upah_per_unit)}
                                            </p>
                                        </div>

                                        <div className="text-left md:text-right">
                                            <p className="font-semibold text-gray-900">
                                                {formatRupiah(pekerjaan.unit_dikerjakan * pekerjaan.upah_per_unit)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Ringkasan Upah
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Pekerjaan</span>
                                    <span className="font-semibold text-gray-900">
                                        {ringkasan?.total_kategori || 0} Kategori
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Unit Dikerjakan</span>
                                    <span className="font-semibold text-gray-900">
                                        {ringkasan?.total_unit || 0} Unit
                                    </span>
                                </div>
                                <div className="pt-3 border-t">
                                    <div className="flex justify-between items-center text-left md:text-right">
                                        <span className="text-lg font-semibold text-gray-900">
                                            Total Upah
                                        </span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatRupiah(ringkasan?.total_upah || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Status Pembayaran
                            </h3>

                            <select
                                value={statusPembayaran}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={produk?.status !== "selesai"}
                                className={`w-full px-3 py-2 md:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500  ${produk?.status !== "selesai"
                                    ? 'bg-gray-100 cursor-not-allowed text-gray-500'
                                    : ''
                                    }`}
                            >
                                <option value="dibayar">Dibayar</option>
                                <option value="belum">Belum</option>
                            </select>

                            {produk?.status !== "selesai" && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>Status pembayaran hanya dapat diubah setelah produk selesai</span>
                                </p>
                            )}

                            {statusPembayaran === "dibayar" && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        ✓ Sudah Dibayar
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}