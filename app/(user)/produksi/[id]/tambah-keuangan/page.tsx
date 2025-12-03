"use client";

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { IconPlus, IconAlertTriangle, IconLoader2, IconTrash } from '@tabler/icons-react';
import { Button, Card, CardBody, addToast } from "@heroui/react";
import axios from "axios";

interface KeuanganItem {
    id: string;
    tipe: "pemasukan" | "pengeluaran" | "";
    keterangan: string;
    amount: string;
    tanggal: string;
}

interface FormErrors {
    [key: string]: string;
}

export default function TambahKeuanganPage() {
    const router = useRouter();
    const params = useParams();
    const idProduk = params.id as string;

    const [loading, setLoading] = useState(false);
    const [keuanganList, setKeuanganList] = useState<KeuanganItem[]>([
        {
            id: Date.now().toString(),
            tipe: "",
            keterangan: "",
            amount: "",
            tanggal: new Date().toISOString().split('T')[0]
        }
    ]);
    const [errors, setErrors] = useState<FormErrors>({});
    const [showCancelModal, setShowCancelModal] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        let hasError = false;

        keuanganList.forEach((keuangan, index) => {
            if (!keuangan.tipe || keuangan.tipe.trim() === "") {
                newErrors[`tipe_${index}`] = "Tipe harus dipilih";
                hasError = true;
            }

            if (!keuangan.keterangan || keuangan.keterangan.trim() === "") {
                newErrors[`keterangan_${index}`] = "Keterangan harus diisi";
                hasError = true;
            } else if (keuangan.keterangan.length < 2) {
                newErrors[`keterangan_${index}`] = "Keterangan minimal 2 karakter";
                hasError = true;
            }

            if (!keuangan.amount || keuangan.amount.trim() === "") {
                newErrors[`amount_${index}`] = "Jumlah harus diisi";
                hasError = true;
            } else if (!/^[0-9]+$/.test(keuangan.amount)) {
                newErrors[`amount_${index}`] = "Jumlah hanya boleh berisi angka";
                hasError = true;
            } else if (parseInt(keuangan.amount) <= 0) {
                newErrors[`amount_${index}`] = "Jumlah harus lebih dari 0";
                hasError = true;
            }

            if (!keuangan.tanggal || keuangan.tanggal.trim() === "") {
                newErrors[`tanggal_${index}`] = "Tanggal harus diisi";
                hasError = true;
            }
        });

        setErrors(newErrors);
        return !hasError;
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

    const clearError = (field: string) => {
        if (errors[field]) {
            const newErrors = { ...errors };
            delete newErrors[field];
            setErrors(newErrors);
        }
    };

    const handleAddKeuangan = () => {
        setKeuanganList([
            ...keuanganList,
            {
                id: Date.now().toString(),
                tipe: "",
                keterangan: "",
                amount: "",
                tanggal: new Date().toISOString().split('T')[0]
            }
        ]);
    };

    const handleRemoveKeuangan = (id: string) => {
        if (keuanganList.length === 1) {
            addToast({
                title: "Minimal harus ada 1 ",
                description: `Minimal harus ada 1 catatan keuangan`,
                color: "danger",
            });
            return;
        }
        setKeuanganList(keuanganList.filter((p) => p.id !== id));
    };

    const updateKeuanganField = (id: string, field: keyof Omit<KeuanganItem, 'id'>, value: string) => {
        setKeuanganList(keuanganList.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));

        const index = keuanganList.findIndex(k => k.id === id);
        if (index !== -1) {
            clearError(`${field}_${index}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);

            const keuanganData = keuanganList.map(item => ({
                id_produk: parseInt(idProduk),
                tipe: item.tipe,
                keterangan: item.keterangan.trim(),
                amount: parseFloat(item.amount),
                tanggal: item.tanggal
            }));

            const response = await axios.post('/api/keuangan', {
                keuanganList: keuanganData
            });

            if (response.data.success) {
                router.push(`/produksi/${idProduk}/keuangan`);
            } else {
                addToast({
                    title: "Gagal",
                    description: `Gagal menyimpan keuangan`,
                    color: "danger",
                });
            }
        } catch (error) {
            console.error('Error saving keuangan:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h1 className="text-2xl font-semibold text-gray-900">
                    Tambah Keuangan
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                    Masukkan informasi dan jumlah keuangan
                </p>
            </div>

            <div className="max-w-5xl mx-auto px-6 py-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
                        <div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">
                                Informasi Keuangan Produk
                            </h3>
                            <p className="text-sm text-red-600">
                                * Wajib diisi
                            </p>
                        </div>
                        
                        <Button
                            type="button"
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            onPress={handleAddKeuangan}
                        >
                            <IconPlus size={18} />
                            Tambah Keuangan
                        </Button>

                        {keuanganList.map((keuangan, index) => (
                            <Card key={keuangan.id} className="mb-4">
                                <CardBody className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-semibold text-gray-900">
                                            Keuangan #{index + 1}
                                        </h4>
                                        {keuanganList.length > 1 && (
                                            <Button
                                                color="danger"
                                                variant="light"
                                                startContent={<IconTrash size={18} />}
                                                onPress={() => handleRemoveKeuangan(keuangan.id)}
                                            >
                                                Hapus
                                            </Button>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Jenis Keuangan <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            className={`w-full px-4 py-3 border ${
                                                errors[`tipe_${index}`] ? "border-red-500" : "border-gray-300"
                                            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                            value={keuangan.tipe}
                                            onChange={(e) => updateKeuanganField(keuangan.id, 'tipe', e.target.value)}
                                        >
                                            <option value="">Pilih Tipe</option>
                                            <option value="pemasukan">Pemasukan</option>
                                            <option value="pengeluaran">Pengeluaran</option>
                                        </select>
                                        {errors[`tipe_${index}`] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[`tipe_${index}`]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tanggal <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            value={keuangan.tanggal}
                                            onChange={(e) => updateKeuanganField(keuangan.id, 'tanggal', e.target.value)}
                                            className={`w-full px-4 py-3 border ${
                                                errors[`tanggal_${index}`] ? "border-red-500" : "border-gray-300"
                                            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                        />
                                        {errors[`tanggal_${index}`] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[`tanggal_${index}`]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Keterangan <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={keuangan.keterangan}
                                            onChange={(e) => updateKeuanganField(keuangan.id, 'keterangan', e.target.value)}
                                            placeholder="Masukkan keterangan"
                                            className={`w-full px-4 py-3 border ${
                                                errors[`keterangan_${index}`] ? "border-red-500" : "border-gray-300"
                                            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                        />
                                        {errors[`keterangan_${index}`] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[`keterangan_${index}`]}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Jumlah (Rp) <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={keuangan.amount}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9]/g, '');
                                                updateKeuanganField(keuangan.id, 'amount', value);
                                            }}
                                            placeholder="0"
                                            className={`w-full px-4 py-3 border ${
                                                errors[`amount_${index}`] ? "border-red-500" : "border-gray-300"
                                            } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                        />
                                        {errors[`amount_${index}`] && (
                                            <p className="text-red-500 text-sm mt-1">{errors[`amount_${index}`]}</p>
                                        )}
                                    </div>
                                </CardBody>
                            </Card>
                        ))}
                        
                        <div className="flex justify-end gap-3 pt-4">
                            <button
                                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                                disabled={loading}
                                type="button"
                                onClick={handleBatal}
                            >
                                Batal
                            </button>

                            <button
                                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                                disabled={loading}
                                type="submit"
                            >
                                {loading ? (
                                    <>
                                        <IconLoader2 className="animate-spin" size={18} />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <IconPlus size={18} />
                                        Simpan Keuangan
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {showCancelModal && (
                <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <IconAlertTriangle className="text-gray-700" size={40} />
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            PERINGATAN
                        </h3>
                        <p className="text-gray-600 mb-2">
                            Anda yakin ingin membatalkan proses menambah keuangan?
                        </p>
                        <p className="text-gray-500 text-sm mb-8">
                            Data yang Anda masukkan akan hilang!
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