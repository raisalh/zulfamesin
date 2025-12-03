"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    IconArrowLeft,
    IconPlus,
    IconDotsVertical,
    IconEdit,
    IconTrash,
    IconLoader2,
    IconAlertTriangle,
    IconTrendingUp,
    IconTrendingDown,
    IconWallet,
    IconAlertCircle
} from '@tabler/icons-react';
import {
    Card,
    CardBody,
    Button,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Chip,
    addToast
} from "@heroui/react";
import axios from "axios";

interface KeuanganSummary {
    total_pemasukan: number;
    total_pengeluaran: number;
    total_pengeluaran_manual: number;
    total_upah_dibayar: number;
    total_upah_pola_belum: number;
    upah_harian_pending: {
        jumlah_karyawan: number;
        nama_karyawan: string;
        avg_upah_harian: number;
    };
    saldo: number;
}

interface KeuanganItem {
    id: number;
    source: 'manual' | 'upah';
    tipe: 'pemasukan' | 'pengeluaran';
    keterangan: string;
    amount: number;
    tanggal: string;
    nama_karyawan?: string;
}

export default function KeuanganPage() {
    const router = useRouter();
    const params = useParams();
    const idProduk = params.id as string;

    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<KeuanganSummary | null>(null);
    const [keuanganList, setKeuanganList] = useState<KeuanganItem[]>([]);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<KeuanganItem | null>(null);
    const [editForm, setEditForm] = useState({
        tipe: '',
        keterangan: '',
        amount: '',
        tanggal: ''
    });
    const [editErrors, setEditErrors] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingItem, setDeletingItem] = useState<KeuanganItem | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (idProduk) {
            fetchData();
        }
    }, [idProduk]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const [summaryRes, listRes] = await Promise.all([
                axios.get(`/api/keuangan/${idProduk}/summary`),
                axios.get(`/api/keuangan/${idProduk}/list`)
            ]);

            if (summaryRes.data.success) {
                setSummary(summaryRes.data.data);
            }

            if (listRes.data.success) {
                setKeuanganList(listRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: KeuanganItem) => {
        if (item.source === 'upah') {
            return;
        }

        setEditingItem(item);
        setEditForm({
            tipe: item.tipe,
            keterangan: item.keterangan,
            amount: String(Number(item.amount)),
            tanggal: new Date(item.tanggal).toISOString().split('T')[0]
        });
        setEditErrors({});
        setIsEditModalOpen(true);
    };

    const handleDelete = (item: KeuanganItem) => {
        if (item.source === 'upah') {
            return;
        }

        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const validateEditForm = (): boolean => {
        const errors: any = {};
        let hasError = false;

        if (!editForm.tipe) {
            errors.tipe = 'Tipe harus dipilih';
            hasError = true;
        }

        if (!editForm.keterangan || editForm.keterangan.trim().length < 2) {
            errors.keterangan = 'Keterangan minimal 2 karakter';
            hasError = true;
        }

        if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
            errors.amount = 'Jumlah harus lebih dari 0';
            hasError = true;
        }

        if (!editForm.tanggal) {
            errors.tanggal = 'Tanggal harus diisi';
            hasError = true;
        }

        setEditErrors(errors);
        return !hasError;
    };

    const handleSaveEdit = async () => {
        if (!validateEditForm() || !editingItem) return;

        try {
            setIsSaving(true);

            const response = await axios.put(`/api/keuangan/${editingItem.id}/entry`, {
                tipe: editForm.tipe,
                keterangan: editForm.keterangan.trim(),
                amount: parseFloat(editForm.amount),
                tanggal: editForm.tanggal
            });

            if (response.data.success) {
                setIsEditModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error updating:', error);
            addToast({
                title: "Gagal memperbarui keuangan",
                description: `Gagal memperbarui keuangan. Silakan coba lagi.`,
                color: "danger",
            }); 
        } finally {
            setIsSaving(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deletingItem) return;

        try {
            setIsDeleting(true);

            const response = await axios.delete(`/api/keuangan/${deletingItem.id}/entry`);

            if (response.data.success) {
                setIsDeleteModalOpen(false);
                fetchData();
            }
        } catch (error) {
            console.error('Error deleting:', error);
            addToast({
                title: "Gagal menghapus keuangan",
                description: `Gagal menghapus keuangan. Silakan coba lagi.`,
                color: "danger",
            }); 
        } finally {
            setIsDeleting(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <IconLoader2 className="animate-spin mx-auto mb-4" size={40} />
                    <p className="text-gray-600">Memuat data keuangan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push(`/produksi`)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <IconArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Keuangan Produksi
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Kelola pemasukan dan pengeluaran produksi
                            </p>
                        </div>
                    </div>
                    <Button
                        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        onPress={() => router.push(`/produksi/${idProduk}/tambah-keuangan`)}
                    >
                        <IconPlus size={18} />
                        Tambah Keuangan
                    </Button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Pemasukan</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(summary?.total_pemasukan || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <IconTrendingUp className="text-green-600" size={24} />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Total Pengeluaran</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(summary?.total_pengeluaran || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Manual: {formatCurrency(summary?.total_pengeluaran_manual || 0)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Upah: {formatCurrency(summary?.total_upah_dibayar || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <IconTrendingDown className="text-red-600" size={24} />
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Saldo</p>
                                    <p className={`text-2xl font-bold ${(summary?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                                        }`}>
                                        {formatCurrency(summary?.saldo || 0)}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <IconWallet className="text-blue-600" size={24} />
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                {((summary?.total_upah_pola_belum ?? 0) > 0 || (summary?.upah_harian_pending?.jumlah_karyawan ?? 0) > 0) && (
                    <Card className="border-l-4 border-l-yellow-500">
                        <CardBody className="p-6">
                            <div className="flex items-start gap-4">
                                <IconAlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 mb-2">
                                        Upah Belum Dibayar
                                    </h3>

                                    {(summary?.total_upah_pola_belum ?? 0) > 0 && (
                                        <p className="text-sm text-gray-700 mb-1">
                                            <span className="font-medium">Upah Pola (Estimasi):</span>{' '}
                                            {formatCurrency(summary?.total_upah_pola_belum ?? 0)}
                                        </p>
                                    )}

                                    {(summary?.upah_harian_pending?.jumlah_karyawan ?? 0) > 0 && (
                                        <div className="text-sm text-gray-700">
                                            <p className="font-medium mb-1">
                                                Upah Harian (Memerlukan Konfirmasi Hari Kerja):
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                {summary?.upah_harian_pending?.jumlah_karyawan ?? 0} karyawan:{' '}
                                                {summary?.upah_harian_pending?.nama_karyawan ?? ''}
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1">
                                                Rata-rata upah harian: {formatCurrency(summary?.upah_harian_pending?.avg_upah_harian ?? 0)}/hari
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                )}

                <Card>
                    <CardBody className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Riwayat Transaksi
                        </h3>

                        {keuanganList.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">Belum ada transaksi</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tanggal
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Keterangan
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Tipe
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                Jumlah
                                            </th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {keuanganList.map((item) => (
                                            <tr key={`${item.source}-${item.id}`} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-700">
                                                    {formatDate(item.tanggal)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-sm text-gray-900">{item.keterangan}</p>
                                                        {item.nama_karyawan && (
                                                            <p className="text-xs text-gray-500">
                                                                Karyawan: {item.nama_karyawan}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <Chip
                                                        size="sm"
                                                        color={item.tipe === 'pemasukan' ? 'success' : 'danger'}
                                                        variant="flat"
                                                    >
                                                        {item.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                                                    </Chip>
                                                    {item.source === 'upah' && (
                                                        <Chip size="sm" color="warning" variant="flat" className="ml-2">
                                                            Upah
                                                        </Chip>
                                                    )}
                                                </td>
                                                <td className={`px-4 py-3 text-sm font-medium text-right ${item.tipe === 'pemasukan' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {item.tipe === 'pemasukan' ? '+' : '-'}
                                                    {formatCurrency(item.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {item.source === 'manual' && (
                                                        <Dropdown>
                                                            <DropdownTrigger>
                                                                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                                                    <IconDotsVertical size={18} />
                                                                </button>
                                                            </DropdownTrigger>
                                                            <DropdownMenu aria-label="Actions">
                                                                <DropdownItem
                                                                    key="edit"
                                                                    startContent={<IconEdit size={16} />}
                                                                    onPress={() => handleEdit(item)}
                                                                >
                                                                    Edit Keuangan
                                                                </DropdownItem>
                                                                <DropdownItem
                                                                    key="delete"
                                                                    className="text-danger"
                                                                    color="danger"
                                                                    startContent={<IconTrash size={16} />}
                                                                    onPress={() => handleDelete(item)}
                                                                >
                                                                    Hapus Keuangan
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            <Modal
                isOpen={isEditModalOpen}
                onClose={() => !isSaving && setIsEditModalOpen(false)}
                size="2xl"
            >
                <ModalContent>
                    <ModalHeader>Edit Keuangan</ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tipe <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={editForm.tipe}
                                    onChange={(e) => setEditForm({ ...editForm, tipe: e.target.value })}
                                    className={`w-full px-4 py-3 border ${editErrors.tipe ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                >
                                    <option value="">Pilih Tipe</option>
                                    <option value="pemasukan">Pemasukan</option>
                                    <option value="pengeluaran">Pengeluaran</option>
                                </select>
                                {editErrors.tipe && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.tipe}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tanggal <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={editForm.tanggal}
                                    onChange={(e) => setEditForm({ ...editForm, tanggal: e.target.value })}
                                    className={`w-full px-4 py-3 border ${editErrors.tanggal ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-nonee`}
                                />
                                {editErrors.tanggal && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.tanggal}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Keterangan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.keterangan}
                                    onChange={(e) => setEditForm({ ...editForm, keterangan: e.target.value })}
                                    placeholder="Masukkan keterangan"
                                    className={`w-full px-4 py-3 border ${editErrors.keterangan ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                />
                                {editErrors.keterangan && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.keterangan}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Jumlah (Rp) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.amount}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        setEditForm({ ...editForm, amount: value });
                                    }}
                                    placeholder="0"
                                    className={`w-full px-4 py-3 border ${editErrors.amount ? 'border-red-500' : 'border-gray-300'
                                        } rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none`}
                                />
                                {editErrors.amount && (
                                    <p className="text-red-500 text-sm mt-1">{editErrors.amount}</p>
                                )}
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => setIsEditModalOpen(false)}
                            disabled={isSaving}
                        >
                            Batal
                        </Button>
                        <Button
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            onPress={handleSaveEdit}
                            disabled={isSaving}
                            isLoading={isSaving}
                        >
                            Simpan Perubahan
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>

            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
            >
                <ModalContent>
                    <ModalHeader>Konfirmasi Hapus</ModalHeader>
                    <ModalBody>
                        <div className="text-center py-4">
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <IconAlertTriangle className="text-red-600" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Hapus Transaksi?
                            </h3>
                            <p className="text-gray-600 mb-2">
                                Anda yakin ingin menghapus transaksi ini?
                            </p>
                            {deletingItem && (
                                <div className="bg-gray-50 rounded-lg p-3 mt-4">
                                    <p className="text-sm text-gray-700">
                                        <span className="font-medium">Keterangan:</span> {deletingItem.keterangan}
                                    </p>
                                    <p className="text-sm text-gray-700 mt-1">
                                        <span className="font-medium">Jumlah:</span> {formatCurrency(deletingItem.amount)}
                                    </p>
                                </div>
                            )}
                            <p className="text-red-600 text-sm mt-4">
                                Data yang dihapus tidak dapat dikembalikan!
                            </p>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            variant="light"
                            onPress={() => setIsDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Batal
                        </Button>
                        <Button
                            color="danger"
                            onPress={handleConfirmDelete}
                            disabled={isDeleting}
                            isLoading={isDeleting}
                        >
                            Ya, Hapus
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}