"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconArrowLeft, IconPlus } from '@tabler/icons-react';

interface Karyawan {
    id_pekerjaan_karyawan: number;
    id_karyawan: number;
    nama_karyawan: string;
    target_unit: number;
    unit_dikerjakan: number;
    status: string;
}

interface Pekerjaan {
    id_jenis_pekerjaan: number;
    nama_pekerjaan: string;
    upah_per_unit: number;
    karyawan: Karyawan[];
}

interface ProdukData {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    deadline: string;
    jumlah_pola: number;
    status: "selesai" | "diproses" | null;
}

export default function InformasiPengerjaanPage() {
    const router = useRouter();
    const params = useParams();
    const idProduk = params.id as string;

    const [showCancelModal, setShowCancelModal] = useState(false);
    const [loading, setLoading] = useState(true);
    const [produk, setProduk] = useState<ProdukData | null>(null);
    const [pekerjaanList, setPekerjaanList] = useState<Pekerjaan[]>([]);

    useEffect(() => {
        if (idProduk) {
            fetchData();
        }
    }, [idProduk]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const produkResponse = await fetch(`/api/production/${idProduk}`);
            const produkResult = await produkResponse.json();

            if (produkResult.success) {
                setProduk(produkResult.data);
            }

            const workResponse = await fetch(`/api/work-assignment/${idProduk}`);
            const workResult = await workResponse.json();

            if (workResult.success) {
                setPekerjaanList(workResult.data.pekerjaan_list);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (unitDikerjakan: number, targetUnit: number) => {
        if (targetUnit === 0) return 0;
        return Math.min((unitDikerjakan / targetUnit) * 100, 100);
    };

    const calculateOverallProgress = () => {
        if (!produk) return 0;

        let totalTarget = 0;
        let totalDikerjakan = 0;

        pekerjaanList.forEach(pekerjaan => {
            pekerjaan.karyawan.forEach(karyawan => {
                totalTarget += karyawan.target_unit;
                totalDikerjakan += karyawan.unit_dikerjakan;
            });
        });

        if (totalTarget === 0) return 0;
        return Math.min((totalDikerjakan / totalTarget) * 100, 100);
    };

    const getProgressColor = (progress: number) => {
        if (progress === 100) return 'bg-green-500';
        if (progress >= 75) return 'bg-yellow-500';
        return 'bg-yellow-500';
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    const overallProgress = calculateOverallProgress();

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            <IconArrowLeft size={24} />
                        </button>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Informasi Pengerjaan
                        </h1>
                    </div>
                    <div className="flex gap-3">
                    <button
                        onClick={() => router.push(`/produksi/${idProduk}/tambah-progress`)}
                        disabled={produk?.status === "selesai"} 
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                            ${produk?.status === "selesai"
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-teal-600 text-white hover:bg-teal-700"}
                        `}
                    >
                        <IconPlus size={20} />
                        Tambah Progress
                    </button>
                        <button
                            onClick={() => router.push(`/produksi/${idProduk}/detail-progress`)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Detail Lengkap
                        </button>
                    </div>
                </div>

                {produk && (
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900">
                                {produk.nama_produk}
                            </h2>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>Target: {produk.jumlah_pola} unit</span>
                                <span>•</span>
                                <span>Deadline: {formatDate(produk.deadline)}</span>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Progress Keseluruhan:</span>
                                <span className="font-medium text-gray-700">
                                    {overallProgress.toFixed(2)}%
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className={`h-3 rounded-full transition-all duration-300 ${
                                        overallProgress === 100 ? 'bg-blue-900' : 'bg-gray-900'
                                    }`}
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {pekerjaanList.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Belum ada data pengerjaan
                        </div>
                    ) : (
                        pekerjaanList.map((pekerjaan) => (
                            <div key={pekerjaan.id_jenis_pekerjaan} className="bg-white rounded-lg shadow p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    {pekerjaan.nama_pekerjaan}
                                </h3>

                                <div className="space-y-4">
                                    {pekerjaan.karyawan.map((karyawan) => {
                                        const progress = calculateProgress(
                                            karyawan.unit_dikerjakan,
                                            karyawan.target_unit
                                        );
                                        const progressColor = getProgressColor(progress);

                                        return (
                                            <div key={karyawan.id_pekerjaan_karyawan}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-medium text-gray-900">
                                                        {karyawan.nama_karyawan}
                                                    </span>
                                                    <span className="text-sm text-gray-600">
                                                        {karyawan.unit_dikerjakan}/{karyawan.target_unit} unit
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-300 ${progressColor}`}
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}