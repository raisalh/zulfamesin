"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconArrowLeft } from '@tabler/icons-react';

interface ProgressDetail {
    id_progress: number;
    id_pekerjaan_karyawan: number;
    unit_progress: number;
    tanggal_update: string;
    nama_karyawan: string;
    target_unit: number;
    unit_dikerjakan: number;
    status: string;
}

interface PekerjaanProgress {
    id_jenis_pekerjaan: number;
    nama_pekerjaan: string;
    progress_list: ProgressDetail[];
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
        const grouped = new Map();
    
        for (const p of progressList) {
            const key = `${p.nama_karyawan}-${p.tanggal_update.split("T")[0]}`;
    
            if (!grouped.has(key)) {
                grouped.set(key, {
                    ...p,
                    unit_progress: p.unit_progress
                });
            } else {
                grouped.get(key).unit_progress += p.unit_progress;
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
                                        status: karyawan.status
                                    });
                                });
                            }
                        }

                        progressList.sort((a, b) => 
                            new Date(b.tanggal_update).getTime() - new Date(a.tanggal_update).getTime()
                        );

                        return {
                            id_jenis_pekerjaan: pekerjaan.id_jenis_pekerjaan,
                            nama_pekerjaan: pekerjaan.nama_pekerjaan,
                            progress_list: groupProgress(progressList)
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

    const getStatusBadge = (unitDikerjakan: number, target: number) => {
        if (unitDikerjakan >= target) {
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
                                                {pekerjaan.progress_list.map((progress) => (
                                                    <tr key={progress.id_progress} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {formatDate(progress.tanggal_update)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                            {progress.nama_karyawan}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                            {progress.unit_progress}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                                            {progress.target_unit}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                                            {getStatusBadge(progress.unit_dikerjakan, progress.target_unit)}
                                                        </td>
                                                    </tr>
                                                ))}
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