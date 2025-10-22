"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconPlus, IconTrash, IconCheck, IconAlertTriangle } from "@tabler/icons-react";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
    jenis_kelamin: "perempuan" | "laki-laki" | null;
}

interface PekerjaanItem {
    id: string;
    nama_pekerjaan: string;
    upah_per_unit: number | string;
    karyawan_ids: number[];
}

interface AssignmentDetail {
    nama_karyawan: string;
    unit: number;
}

interface FormErrors {
    nama_pekerjaan?: string;
    upah_per_unit?: string;
}

export default function WorkAssignmentPage() {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [pekerjaanList, setPekerjaanList] = useState<PekerjaanItem[]>([
        {
            id: Date.now().toString(),
            nama_pekerjaan: "",
            upah_per_unit: "",
            karyawan_ids: [],
        },
    ]);

    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [totalPola, setTotalPola] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: FormErrors }>({});

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const karyawanResponse = await fetch("/api/employee");
            const karyawanData = await karyawanResponse.json();
            if (karyawanData.success) {
                setKaryawanList(karyawanData.data);
            }

            const gulunganResponse = await fetch(`/api/production/${id}`);
            const gulunganData = await gulunganResponse.json();

            if (gulunganData.success && gulunganData.data) {
                const totalPolaValue = gulunganData.data.jumlah_pola || 0;
                setTotalPola(totalPolaValue);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoadingData(false);
        }
    };

    const handleAddPekerjaan = () => {
        setPekerjaanList([
            ...pekerjaanList,
            {
                id: Date.now().toString(),
                nama_pekerjaan: "",
                upah_per_unit: "",
                karyawan_ids: [],
            },
        ]);
    };

    const handleRemovePekerjaan = (id: string) => {
        setPekerjaanList(pekerjaanList.filter((p) => p.id !== id));
    };

    const handlePekerjaanChange = (id: string, field: string, value: any) => {
        setPekerjaanList(
            pekerjaanList.map((p) =>
                p.id === id ? { ...p, [field]: value } : p
            )
        );
    };

    const handleKaryawanToggle = (pekerjaanId: string, karyawanId: number) => {
        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    const isSelected = p.karyawan_ids.includes(karyawanId);
                    return {
                        ...p,
                        karyawan_ids: isSelected
                            ? p.karyawan_ids.filter((id) => id !== karyawanId)
                            : [...p.karyawan_ids, karyawanId],
                    };
                }
                return p;
            })
        );
    };

    const calculateUnitDistribution = (karyawanIds: number[]) => {
        const totalKaryawan = karyawanIds.length;
        if (totalKaryawan === 0) return [];

        const baseUnit = Math.floor(totalPola / totalKaryawan);
        const remainder = totalPola % totalKaryawan;

        return karyawanIds.map((id, index) => {
            const karyawan = karyawanList.find((k) => k.id_karyawan === id);
            return {
                nama_karyawan: karyawan?.nama_karyawan || "-",
                unit: index === totalKaryawan - 1 ? baseUnit + remainder : baseUnit,
            };
        });
    };

    const getTotalStats = () => {
        const totalPekerjaan = pekerjaanList.filter(
            (p) => p.nama_pekerjaan.trim() !== ""
        ).length;
        const totalUnit = totalPola;
        const totalUpah = pekerjaanList.reduce((sum, p) => {
            if (p.karyawan_ids.length > 0 && p.upah_per_unit) {
                const upah =
                    typeof p.upah_per_unit === "string"
                        ? parseFloat(p.upah_per_unit)
                        : p.upah_per_unit;
                return sum + upah * totalPola;
            }
            return sum;
        }, 0);

        return { totalPekerjaan, totalUnit, totalUpah };
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: FormErrors } = {};

        pekerjaanList.forEach((p) => {
            const fieldErrors: FormErrors = {};

            if (!p.nama_pekerjaan.trim()) {
                fieldErrors.nama_pekerjaan = "Nama pekerjaan harus diisi";
            }

            if (!String(p.upah_per_unit).trim()) {
                fieldErrors.upah_per_unit = "Upah per unit harus diisi";
            }

            if (Object.keys(fieldErrors).length > 0) {
                newErrors[p.id] = fieldErrors;
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleBatal = () => {
        setShowCancelModal(true);
    };

    const confirmBatal = () => {
        router.push("/produksi");
    };

    const cancelBatal = () => {
        setShowCancelModal(false);
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            alert("Harap lengkapi semua field pekerjaan sebelum menyimpan!");
            return;
        }

        const validPekerjaan = pekerjaanList.filter(
            (p) =>
                p.nama_pekerjaan.trim() !== "" &&
                p.upah_per_unit &&
                p.karyawan_ids.length > 0
        );

        if (validPekerjaan.length === 0) {
            alert("Harap lengkapi minimal 1 pekerjaan dengan nama, upah, dan karyawan!");
            return;
        }

        setLoading(true);

        const payload = {
            id_produk: id,
            pekerjaan_list: validPekerjaan.map((p) => ({
                nama_pekerjaan: p.nama_pekerjaan,
                upah_per_unit:
                    typeof p.upah_per_unit === "string"
                        ? parseFloat(p.upah_per_unit)
                        : p.upah_per_unit,
                karyawan_ids: p.karyawan_ids,
            })),
        };

        try {
            const response = await fetch("/api/work-assignment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.success) {
                alert("Pekerjaan berhasil disimpan!");
                router.push("/produksi");
            } else {
                alert(result.message || "Gagal menyimpan pekerjaan");
            }
        } catch (error) {
            console.error("Error submitting:", error);
            alert("Terjadi kesalahan saat menyimpan pekerjaan");
            router.push("/produksi");
        } finally {
            setLoading(false);
        }
    };

    const stats = getTotalStats();

    if (loadingData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                <h1 className="text-2xl font-semibold text-gray-900">Pengaturan Pekerjaan Karyawan</h1>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">Daftar Pekerjaan</h2>
                        <button
                            onClick={handleAddPekerjaan}
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                            <IconPlus size={18} />
                            Tambah Pekerjaan
                        </button>
                    </div>

                    <div className="space-y-6">
                        {pekerjaanList.map((pekerjaan, index) => (
                            <div key={pekerjaan.id} className="border border-gray-200 rounded-lg p-6">
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Nama Pekerjaan
                                        </label>
                                        <input
                                            type="text"
                                            value={pekerjaan.nama_pekerjaan}
                                            onChange={(e) => handlePekerjaanChange(pekerjaan.id, 'nama_pekerjaan', e.target.value)}
                                            placeholder="Contoh: Pasang Kancing"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        {errors[pekerjaan.id]?.nama_pekerjaan && (
                                            <p className="text-red-500 text-sm mt-1">{errors[pekerjaan.id]?.nama_pekerjaan}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Upah per Unit (Rp)
                                        </label>
                                        <input
                                            type="number"
                                            value={pekerjaan.upah_per_unit}
                                            onChange={(e) => handlePekerjaanChange(pekerjaan.id, 'upah_per_unit', e.target.value)}
                                            placeholder="Contoh: 2000"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                        {errors[pekerjaan.id]?.upah_per_unit && (
                                            <p className="text-red-500 text-sm mt-1">{errors[pekerjaan.id]?.upah_per_unit}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Pilih Karyawan
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {karyawanList.map(karyawan => {
                                            const isSelected = pekerjaan.karyawan_ids.includes(karyawan.id_karyawan);
                                            return (
                                                <button
                                                    key={karyawan.id_karyawan}
                                                    onClick={() => handleKaryawanToggle(pekerjaan.id, karyawan.id_karyawan)}
                                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${isSelected
                                                        ? 'bg-teal-600 text-white border-teal-600'
                                                        : 'bg-white text-gray-700 border-gray-300 hover:border-teal-600'
                                                        }`}
                                                >
                                                    {karyawan.nama_karyawan}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {pekerjaan.karyawan_ids.length > 0 && pekerjaan.upah_per_unit && (
                                    <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="flex justify-between items-center text-sm mb-2">
                                            <span className="text-gray-600">
                                                Karyawan Terpilih: <strong>{pekerjaan.karyawan_ids.length} karyawan</strong>
                                            </span>
                                            <span className="text-gray-600">
                                                Unit per Pekerja: <strong>
                                                    {Math.floor(totalPola / pekerjaan.karyawan_ids.length)}-
                                                    {Math.floor(totalPola / pekerjaan.karyawan_ids.length) + (totalPola % pekerjaan.karyawan_ids.length)} unit
                                                </strong>
                                            </span>
                                            <span className="text-gray-600">
                                                Total: <strong>Rp {(
                                                    (typeof pekerjaan.upah_per_unit === 'string'
                                                        ? parseFloat(pekerjaan.upah_per_unit)
                                                        : pekerjaan.upah_per_unit) * totalPola
                                                ).toLocaleString('id-ID')}</strong>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {pekerjaanList.length > 1 && (
                                    <button
                                        onClick={() => handleRemovePekerjaan(pekerjaan.id)}
                                        className="mt-4 flex items-center gap-2 text-red-600 hover:text-red-700"
                                    >
                                        <IconTrash size={18} />
                                        Hapus Pekerjaan
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Kesimpulan</h2>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalPekerjaan}</div>
                            <div className="text-sm text-gray-600">Total Pekerjaan</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">{stats.totalUnit}</div>
                            <div className="text-sm text-gray-600">Total Unit</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                Rp {stats.totalUpah.toLocaleString('id-ID')}
                            </div>
                            <div className="text-sm text-gray-600">Total Upah</div>
                        </div>
                    </div>

                    {pekerjaanList.map(pekerjaan => {
                        if (!pekerjaan.nama_pekerjaan.trim() || pekerjaan.karyawan_ids.length === 0) return null;

                        const distribution = calculateUnitDistribution(pekerjaan.karyawan_ids);

                        return (
                            <div key={pekerjaan.id} className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">{pekerjaan.nama_pekerjaan}</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">NO</th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">NAMA KARYAWAN</th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">TOTAL UNIT</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {distribution.map((item, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{idx + 1}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{item.nama_karyawan}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700 text-right">{item.unit}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={handleBatal} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || stats.totalPekerjaan === 0}
                        className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <IconCheck size={18} />
                        {loading ? 'Menyimpan...' : 'Simpan Pekerjaan'}
                    </button>
                </div>
            </div>

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
                            Anda yakin ingin membatalkan penambahan pekerjaan?
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
    );
}