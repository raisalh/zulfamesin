"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconArrowLeft, IconUserX } from '@tabler/icons-react';

interface ProgressDetail {
    id_progress: number;
    id_pekerjaan_karyawan: number;
    unit_progress: number;
    tanggal_update: string;
    nama_karyawan: string;
    target_unit: number;
    unit_dikerjakan: number;
    status: string;
    deleted_at?: string | null; 
}

interface PekerjaanProgress {
    id_jenis_pekerjaan: number;
    nama_pekerjaan: string;
    progress_list: GroupedProgress[];
}

interface GroupedProgress extends ProgressDetail {
    total_progress_sampai_tanggal_ini: number;
}

export default function DetailProgressPage() {
    const router = useRouter();
    const params = useParams();
    const idProduk = params.id as string;

    const [loading, setLoading] = useState(true);
    const [pekerjaanProgressList, setPekerjaanProgressList] = useState<PekerjaanProgress[]>([]);

    useEffect(() => {
        if (idProduk) {
            fetchProgressDetail();
        }
    }, [idProduk]);

    const groupProgress = (progressList: ProgressDetail[]) => {
        const grouped = new Map<string, GroupedProgress>();
        const totalProgressPerKaryawan = new Map<string, number>();

        for (const p of progressList) {
            const key = `${p.nama_karyawan}-${p.tanggal_update.split("T")[0]}`;
            const karyawanKey = p.nama_karyawan;

            const currentTotal = (totalProgressPerKaryawan.get(karyawanKey) || 0) + p.unit_progress;
            totalProgressPerKaryawan.set(karyawanKey, currentTotal);

            if (!grouped.has(key)) {
                grouped.set(key, {
                    ...p,
                    unit_progress: p.unit_progress,
                    total_progress_sampai_tanggal_ini: currentTotal
                });
            } else {
                const existing = grouped.get(key)!;
                existing.unit_progress += p.unit_progress;
                existing.total_progress_sampai_tanggal_ini = currentTotal;
            }
        }

        return Array.from(grouped.values());
    };

    const fetchProgressDetail = async () => {
        try {
            setLoading(true);
    
            const response = await fetch(`/api/work-assignment/${idProduk}`);
            const result = await response.json();
    
            if (result.success) {
                const pekerjaanWithProgress = await Promise.all(
                    result.data.pekerjaan_list.map(async (pekerjaan: any) => {
                        const progressList: ProgressDetail[] = [];
    
                        for (const karyawan of pekerjaan.karyawan) {
                            const progressResponse = await fetch(
                                `/api/progress/${karyawan.id_pekerjaan_karyawan}`
                            );
                            const progressResult = await progressResponse.json();
    
                            if (progressResult.success && progressResult.data.length > 0) {
                                progressResult.data.forEach((progress: any) => {
                                    progressList.push({
                                        ...progress,
                                        nama_karyawan: karyawan.nama_karyawan,
                                        target_unit: karyawan.target_unit,
                                        unit_dikerjakan: karyawan.unit_dikerjakan,
                                        status: karyawan.status,
                                        deleted_at: karyawan.deleted_at 
                                    });
                                });
                            }
                        }
    
                        progressList.sort((a, b) =>
                            new Date(a.tanggal_update).getTime() - new Date(b.tanggal_update).getTime()
                        );
    
                        const grouped = groupProgress(progressList);
    
                        grouped.sort((a, b) =>
                            new Date(b.tanggal_update).getTime() - new Date(a.tanggal_update).getTime()
                        );
    
                        return {
                            id_jenis_pekerjaan: pekerjaan.id_jenis_pekerjaan,
                            nama_pekerjaan: pekerjaan.nama_pekerjaan,
                            progress_list: grouped
                        };
                    })
                );
    
                setPekerjaanProgressList(pekerjaanWithProgress);
            }
        } catch (error) {
            console.error('Error fetching progress detail:', error);
        } finally {
            setLoading(false);
        }
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

    const getStatusBadge = (totalProgressSampaiTanggalIni: number, target: number) => {
        if (totalProgressSampaiTanggalIni >= target) {
            return (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Selesai
                </span>
            );
        }
        return (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                Diproses
            </span>
        );
    };

    const isKaryawanDeleted = (progress: ProgressDetail) => {
        return progress.deleted_at !== null && progress.deleted_at !== undefined;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        <IconArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Detail Progress Pengerjaan
                    </h1>
                </div>

                <div className="space-y-6">
                    {pekerjaanProgressList.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            Belum ada data progress
                        </div>
                    ) : (
                        pekerjaanProgressList.map((pekerjaan) => (
                            <div key={pekerjaan.id_jenis_pekerjaan} className="bg-white rounded-lg shadow">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {pekerjaan.nama_pekerjaan}
                                    </h2>
                                </div>

                                {pekerjaan.progress_list.length === 0 ? (
                                    <div className="px-6 py-8 text-center text-gray-500">
                                        Belum ada progress untuk pekerjaan ini
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Tanggal
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Nama Karyawan
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Pola Dikerjakan
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Target
                                                    </th>
                                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Status
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {pekerjaan.progress_list.map((progress) => {
                                                    const isDeleted = isKaryawanDeleted(progress);
                                                    
                                                    return (
                                                        <tr 
                                                            key={progress.id_progress} 
                                                            className={`hover:bg-gray-50 ${isDeleted ? 'bg-red-50' : ''}`}
                                                        >
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDeleted ? 'text-red-700' : 'text-gray-900'}`}>
                                                                {formatDate(progress.tanggal_update)}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={isDeleted ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                                                        {progress.nama_karyawan}
                                                                    </span>
                                                                    {isDeleted && (
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                                                                            <IconUserX size={12} />
                                                                            KELUAR
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isDeleted ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                                                                {progress.unit_progress}
                                                            </td>
                                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center ${isDeleted ? 'text-red-700 font-medium' : 'text-gray-900'}`}>
                                                                {progress.target_unit}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                {getStatusBadge(progress.total_progress_sampai_tanggal_ini, progress.target_unit)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}