"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconEye } from "@tabler/icons-react";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
    jenis_kelamin: "perempuan" | "laki-laki" | null;
}

interface ProdukItem {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    total_upah: number;
    status_pembayaran: "dibayar" | "belum" | null;
    status_kerjaan: "selesai" | "diproses" | null;
    tanggal_pembayaran: string;
}

export default function DetailUpahKaryawan() {
    const params = useParams();
    const router = useRouter();
    const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
    const [produkList, setProdukList] = useState<ProdukItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchData();
    }, [params.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/employee/${params.id}/works`);
            const result = await response.json();

            if (result.success) {
                setKaryawan(result.data.karyawan);
                setProdukList(result.data.produk_list);
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

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const totalPages = Math.ceil(produkList.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentData = produkList.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleViewDetail = (id_produk: number) => {
        router.push(`/karyawan/${params.id}/upah/${id_produk}`);
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
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4"
                    >
                        <IconArrowLeft size={20} />
                        <span className="text-lg font-semibold">Detail Upah Karyawan</span>
                    </button>

                    {karyawan && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xl font-bold text-gray-600">
                                        {karyawan.nama_karyawan.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {karyawan.nama_karyawan}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        Produk: {produkList.length} Produk
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider w-[60px]">
                                        Aksi
                                    </th>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        Produk yang Dikerjakan
                                    </th>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        Total Upah
                                    </th>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        Status Pekerjaan
                                    </th>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        Status Pembayaran
                                    </th>
                                    <th className="px-3 py-2 md:px-6 md:py-3 text-[10px] md:text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]">
                                        Tanggal Pembayaran
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200 border-t border-gray-200">
                                {currentData.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Tidak ada data pekerjaan
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((item) => (
                                        <tr key={item.id_produk} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm w-[60px]">
                                                <button
                                                    onClick={() => handleViewDetail(item.id_produk)}
                                                    className="text-gray-600 hover:text-gray-900"
                                                    title="Lihat Detail"
                                                >
                                                    <IconEye size={20} />
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm min-w-[140px]">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {item.nama_produk} ({item.ukuran}) - {item.warna}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm min-w-[140px]">
                                                <div className="text-sm text-gray-900">
                                                    {formatRupiah(item.total_upah || 0)}
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm min-w-[140px] text-center">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full ${item.status_kerjaan === "selesai"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-yellow-100 text-yellow-800"
                                                        }`}
                                                >
                                                    {item.status_kerjaan === "selesai" ? "Selesai" : "Diproses"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm min-w-[140px] text-center">
                                                <span
                                                    className={`inline-flex px-2 py-0.5 text-[10px] md:text-xs font-medium rounded-full ${item.status_pembayaran === "dibayar"
                                                        ? "bg-green-100 text-green-800"
                                                        : "bg-red-100 text-red-800"
                                                        }`}
                                                >
                                                    {item.status_pembayaran === "dibayar" ? "Dibayar" : "Belum"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 md:px-6 md:py-4 text-xs md:text-sm min-w-[140px] text-center">
                                                <span>
                                                    {item.status_pembayaran === "dibayar"
                                                        ? (formatDate(item.tanggal_pembayaran)) : "-"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {produkList.length > 0 && (
                        <div className="bg-white px-3 md:px-6 py-4 flex flex-col md:flex-row gap-3 md:gap-0 items-start md:items-center justify-between border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Menampilkan {startIndex + 1}-{Math.min(endIndex, produkList.length)} dari{" "}
                                {produkList.length} pekerjaan
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="px-2 py-1 md:px-3 md:py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sebelumnya
                                </button>
                                {[...Array(Math.min(totalPages, 3))].map((_, idx) => {
                                    let pageNum;
                                    if (totalPages <= 3) {
                                        pageNum = idx + 1;
                                    } else if (currentPage === 1) {
                                        pageNum = idx + 1;
                                    } else if (currentPage === totalPages) {
                                        pageNum = totalPages - 2 + idx;
                                    } else {
                                        pageNum = currentPage - 1 + idx;
                                    }

                                    if (pageNum < 1 || pageNum > totalPages) return null;

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`px-2 py-1 md:px-3 md:py-1 text-sm border rounded ${currentPage === pageNum
                                                ? "bg-teal-500 text-white"
                                                : "hover:bg-gray-100"
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="px-2 py-1 md:px-3 md:py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}