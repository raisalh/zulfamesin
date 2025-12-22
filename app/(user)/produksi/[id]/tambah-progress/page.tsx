"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconPlus, IconAlertTriangle, IconUserX } from '@tabler/icons-react';

interface Karyawan {
    id_pekerjaan_karyawan: number;
    id_karyawan: number;
    nama_karyawan: string;
    target_unit: number;
    unit_dikerjakan: number;
    status: string;
    deleted_at?: string | null; 
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
    total_pola: number;
}

interface FormErrors {
    tanggal_progress?: string;
    progress_data?: { [key: number]: string };
}

export default function TambahProgressPage() {
    const router = useRouter();
    const params = useParams();
    const idProduk = params.id as string;

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [produk, setProduk] = useState<ProdukData | null>(null);
    const [pekerjaanList, setPekerjaanList] = useState<Pekerjaan[]>([]);
    const [selectedPekerjaan, setSelectedPekerjaan] = useState<number | null>(null);
    const [tanggalProgress, setTanggalProgress] = useState('');
    const [progressData, setProgressData] = useState<{ [key: number]: string }>({});
    const [errors, setErrors] = useState<FormErrors>({});
    const [showCancelModal, setShowCancelModal] = useState(false);

    useEffect(() => {
        if (idProduk) {
            fetchWorkAssignments();
        }
    }, [idProduk]);

    const fetchWorkAssignments = async () => {
        try {
            setFetchingData(true);
            const response = await fetch(`/api/work-assignment/${idProduk}`);
            const result = await response.json();

            if (result.success) {
                setProduk(result.data.produk);
                setPekerjaanList(result.data.pekerjaan_list);

                if (result.data.pekerjaan_list.length > 0) {
                    setSelectedPekerjaan(result.data.pekerjaan_list[0].id_jenis_pekerjaan);
                }
            }
        } catch (error) {
            console.error('Error fetching work assignments:', error);
            alert('Gagal mengambil data pekerjaan');
        } finally {
            setFetchingData(false);
        }
    };

    const isKaryawanDeleted = (karyawan: Karyawan) => {
        return karyawan.deleted_at !== null && karyawan.deleted_at !== undefined;
    };

    const handleProgressChange = (idPekerjaanKaryawan: number, value: string) => {
        setProgressData(prev => ({
            ...prev,
            [idPekerjaanKaryawan]: value
        }));

        if (errors.progress_data?.[idPekerjaanKaryawan]) {
            setErrors(prev => ({
                ...prev,
                progress_data: {
                    ...prev.progress_data,
                    [idPekerjaanKaryawan]: ''
                }
            }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        const progressErrors: { [key: number]: string } = {};
    
        if (!tanggalProgress) {
            newErrors.tanggal_progress = "Tanggal progress harus diisi";
        }
    
        const selected = pekerjaanList.find(
            p => p.id_jenis_pekerjaan === selectedPekerjaan
        );
    
        if (!selected) {
            newErrors.progress_data = { 0: "Data pekerjaan tidak ditemukan" };
            setErrors(newErrors);
            return false;
        }
    
        let hasAnyProgress = false;
        let hasAnyInput = false;
    
        selected.karyawan.forEach((k) => {
            if (k.status === "selesai" || isKaryawanDeleted(k)) return;
    
            const rawValue = progressData[k.id_pekerjaan_karyawan];
    
            if (rawValue === "" || rawValue === undefined) {
                return;
            }
    
            hasAnyInput = true;
    
            if (!/^[0-9]+$/.test(rawValue)) {
                progressErrors[k.id_pekerjaan_karyawan] = "Progress hanya boleh berisi angka";
                return;
            }
    
            const progress = parseInt(rawValue);
            const sisa = k.target_unit - k.unit_dikerjakan;
    
            if (isNaN(progress)) {
                progressErrors[k.id_pekerjaan_karyawan] = "Nilai tidak valid";
            } else if (progress < 0) {
                progressErrors[k.id_pekerjaan_karyawan] = "Progress tidak boleh negatif";
            } else if (progress > sisa) {
                progressErrors[k.id_pekerjaan_karyawan] =
                    `Progress tidak boleh lebih dari sisa (${sisa} pola)`;
            } else if (progress > 0) {
                hasAnyProgress = true;
            }
        });
    
        if (Object.keys(progressErrors).length > 0) {
            newErrors.progress_data = progressErrors;
        } else if (!hasAnyProgress) {
            newErrors.progress_data = {
                0: "Minimal satu karyawan harus memiliki progress"
            };
        }
    
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBatal = () => {
        setShowCancelModal(true);
    };

    const confirmBatal = () => {
        router.back();
    };

    const cancelBatal = () => {
        setShowCancelModal(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
    
        if (!selectedPekerjaan) {
            alert('Pilih jenis pekerjaan terlebih dahulu');
            return;
        }
    
        if (!validateForm()) {
            return;
        }
    
        const selectedPekerjaanData = pekerjaanList.find(
            p => p.id_jenis_pekerjaan === selectedPekerjaan
        );
    
        if (!selectedPekerjaanData) {
            alert('Data pekerjaan tidak ditemukan');
            return;
        }
    
        const progressList = selectedPekerjaanData.karyawan
            .filter(karyawan => {
                const progress = parseInt(progressData[karyawan.id_pekerjaan_karyawan] || '0');
                return progress > 0;
            })
            .map(karyawan => ({
                id_pekerjaan_karyawan: karyawan.id_pekerjaan_karyawan,
                unit_progress: parseInt(progressData[karyawan.id_pekerjaan_karyawan])
            }));
    
        if (progressList.length === 0) {
            alert('Minimal satu karyawan harus memiliki progress');
            return;
        }
    
        try {
            setLoading(true);
    
            const response = await fetch('/api/progress', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_produk: idProduk,
                    id_jenis_pekerjaan: selectedPekerjaan,
                    tanggal_progress: tanggalProgress,
                    progress_list: progressList
                }),
            });
    
            const result = await response.json();
    
            if (result.success) {
                alert('Progress berhasil disimpan');
                router.push(`/produksi/${idProduk}/lihat-progress`);
            } else {
                alert(result.message || 'Gagal menyimpan progress');
            }
        } catch (error) {
            console.error('Error saving progress:', error);
            alert('Terjadi kesalahan saat menyimpan progress');
        } finally {
            setLoading(false);
        }
    };

    const selectedPekerjaanData = pekerjaanList.find(
        p => p.id_jenis_pekerjaan === selectedPekerjaan
    );

    // ⭐ UPDATE: Cek juga karyawan yang deleted
    const allFinished = selectedPekerjaanData?.karyawan.every(
        k => k.status === 'selesai' || isKaryawanDeleted(k)
    ) ?? false;

    if (fetchingData) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center">Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Tambah Progress</h1>
                    <p className="text-gray-600 mt-1">
                        Masukkan progress pengerjaan produk {produk?.nama_produk}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Pekerjaan
                        </label>
                        <select
                            value={selectedPekerjaan || ''}
                            onChange={(e) => {
                                setSelectedPekerjaan(Number(e.target.value));
                                setProgressData({});
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            {pekerjaanList.map((pekerjaan) => (
                                <option
                                    key={pekerjaan.id_jenis_pekerjaan}
                                    value={pekerjaan.id_jenis_pekerjaan}
                                >
                                    {pekerjaan.nama_pekerjaan}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <label className="block text-sm font-medium text-gray-900 mb-2">
                            Tanggal Progress Pengerjaan
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={tanggalProgress}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setTanggalProgress(val);

                                    if (val && errors.tanggal_progress) {
                                        setErrors(prev => ({ ...prev, tanggal_progress: '' }));
                                    }
                                }}
                                placeholder="Pilih Tanggal Progress Pengerjaan"
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.tanggal_progress ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                        </div>
                        {errors.tanggal_progress && (
                            <p className="text-red-500 text-sm mt-1">{errors.tanggal_progress}</p>
                        )}
                    </div>

                    {selectedPekerjaanData && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-sm font-medium text-gray-900 mb-4">Karyawan</h3>

                            {allFinished ? (
                                <div className="text-center py-8">
                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        Semua Pekerjaan Sudah Selesai
                                    </h3>
                                    <p className="text-gray-600">
                                        Seluruh karyawan telah menyelesaikan target mereka atau sudah tidak aktif untuk pekerjaan ini.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        {selectedPekerjaanData.karyawan.map((karyawan, index) => {
                                            const isDeleted = isKaryawanDeleted(karyawan);
                                            const isDisabled = karyawan.status === 'selesai' || isDeleted;

                                            return (
                                                <div 
                                                    key={karyawan.id_pekerjaan_karyawan} 
                                                    className={`flex items-start gap-4 p-4 rounded-lg ${
                                                        isDeleted ? 'bg-red-50 border border-red-200' : ''
                                                    }`}
                                                >
                                                    <div className={`flex-shrink-0 w-8 h-8 ${
                                                        isDeleted ? 'bg-red-500' : 'bg-gray-900'
                                                    } text-white rounded-full flex items-center justify-center text-sm font-medium`}>
                                                        {index + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`font-medium ${
                                                                isDeleted ? 'text-red-600' : 'text-gray-900'
                                                            }`}>
                                                                {karyawan.nama_karyawan}
                                                            </span>
                                                            {isDeleted && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                                                                    <IconUserX size={12} />
                                                                    KELUAR
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className={`text-sm mb-2 ${
                                                            isDeleted ? 'text-red-700' : 'text-gray-500'
                                                        }`}>
                                                            Target: {karyawan.target_unit} pola |
                                                            Dikerjakan: {karyawan.unit_dikerjakan} pola |
                                                            Sisa: {karyawan.target_unit - karyawan.unit_dikerjakan} pola
                                                        </div>
                                                        {karyawan.status === 'selesai' ? (
                                                            <div className="flex items-center gap-2 text-green-600">
                                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                                <span className="text-sm font-medium">Pekerjaan sudah selesai</span>
                                                            </div>
                                                        ) : isDeleted ? (
                                                            <div className="flex items-center gap-2 text-red-600">
                                                                <IconUserX size={18} />
                                                                <span className="text-sm font-medium">Karyawan sudah tidak aktif</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    min="0"
                                                                    max={karyawan.target_unit - karyawan.unit_dikerjakan}
                                                                    value={progressData[karyawan.id_pekerjaan_karyawan] || ''}
                                                                    onChange={(e) => handleProgressChange(karyawan.id_pekerjaan_karyawan, e.target.value)}
                                                                    placeholder="Masukkan jumlah pola"
                                                                    disabled={isDisabled}
                                                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                                                        errors.progress_data?.[karyawan.id_pekerjaan_karyawan]
                                                                            ? 'border-red-500'
                                                                            : 'border-gray-300'
                                                                    } ${isDisabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                                />
                                                                {errors.progress_data?.[karyawan.id_pekerjaan_karyawan] && (
                                                                    <p className="text-red-500 text-sm mt-1">
                                                                        {errors.progress_data[karyawan.id_pekerjaan_karyawan]}
                                                                    </p>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {errors.progress_data?.[0] && (
                                        <p className="text-red-500 text-sm mt-2 ml-12.5">
                                            {errors.progress_data[0]}
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={handleBatal}
                            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading || !selectedPekerjaanData || allFinished}
                        >
                            <IconPlus size={20} />
                            {loading ? 'Menyimpan...' : 'Tambah Progress'}
                        </button>
                    </div>
                </form>

                {showCancelModal && (
                    <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                <IconAlertTriangle className="w-10 h-10 text-gray-700" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                PERINGATAN
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Anda yakin ingin membatalkan penambahan progress?
                            </p>
                            <p className="text-gray-500 text-sm mb-8">
                                Penambahan yang Anda buat akan hilang!
                            </p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    className="px-8 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition-colors min-w-[120px]"
                                    onClick={cancelBatal}
                                >
                                    Kembali
                                </button>
                                <button
                                    className="px-8 py-3 bg-[#8EC3B3] rounded-full text-gray-900 font-semibold hover:bg-[#7AB9A8] transition-colors min-w-[120px]"
                                    onClick={confirmBatal}
                                >
                                    Ya
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}