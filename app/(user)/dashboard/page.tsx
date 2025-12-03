"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconShirt, IconCurrencyDollar, IconAlertCircle, IconUsers, IconCalendar, IconTrendingUp, IconChartBar, IconSettings } from '@tabler/icons-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@heroui/react";
import axios from 'axios';
import { toast } from 'sonner';

interface DashboardData {
    stats: {
        produkBulanIni: number;
        upahTerbayar: number;
        upahBelumDibayar: number;
        totalKaryawan: number;
    };

    distribusiUpah: {
        upahTinggi: number;
        upahMenengah: number;
        upahRendah: number;
    };

    produkTerbaru: Array<{
        id_produk: number;
        nama_produk: string;
        warna: string;
        ukuran: string;
        status: string;
        progress: number;
    }>;

    deadlineMendekat: Array<{
        id_produk: number;
        nama_produk: string;
        warna: string;
        ukuran: string;
        deadline: string;
        hariTersisa: number;
        progress: number;
    }>;

    produkProgress: Array<{
        id_produk: number;
        nama_produk: string;
        warna: string;
        ukuran: string;
        progress: number;
        totalPola: number;
        polaSelesai: number;
    }>;

    absensiKaryawan: Array<{
        id_karyawan: number;
        nama_karyawan: string;
        tanggal_terakhir: string;
        jumlah_kehadiran: number;
    }>;

    produkGrowth: {
        bulanIni: number;
        bulanLalu: number;
        persen: number;
    };

    polaGrowth: {
        bulanIni: number;
        bulanLalu: number;
        persen: number;
    };
}

interface DistribusiUpahConfig {
    batasBawah: string;
    batasAtas: string;
}

interface FormErrors {
    batasBawah?: string;
    batasAtas?: string;
}

const COLORS = ['#10b981', '#3b82f6', '#94a3b8'];

export default function BerandaPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const [distribusiConfig, setDistribusiConfig] = useState<DistribusiUpahConfig>({
        batasBawah: '50000',
        batasAtas: '100000',
    });

    const [formErrors, setFormErrors] = useState<FormErrors>({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async (config?: DistribusiUpahConfig) => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            
            if (config) {
                params.append('minUpahTinggi', config.batasAtas);
                params.append('minUpahMenengah', config.batasBawah);
                params.append('maxUpahMenengah', String(Number(config.batasAtas) - 1));
            }

            const response = await axios.get(`/api/dashboard?${params.toString()}`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
            toast.error('Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: FormErrors = {};
        let isValid = true;

        if (!distribusiConfig.batasBawah || distribusiConfig.batasBawah.trim() === '') {
            errors.batasBawah = 'Batas bawah harus diisi';
            isValid = false;
        } else if (isNaN(Number(distribusiConfig.batasBawah)) || Number(distribusiConfig.batasBawah) <= 0) {
            errors.batasBawah = 'Batas bawah harus berupa angka positif';
            isValid = false;
        }

        if (!distribusiConfig.batasAtas || distribusiConfig.batasAtas.trim() === '') {
            errors.batasAtas = 'Batas atas harus diisi';
            isValid = false;
        } else if (isNaN(Number(distribusiConfig.batasAtas)) || Number(distribusiConfig.batasAtas) <= 0) {
            errors.batasAtas = 'Batas atas harus berupa angka positif';
            isValid = false;
        }

        if (isValid) {
            const bawah = Number(distribusiConfig.batasBawah);
            const atas = Number(distribusiConfig.batasAtas);

            if (atas <= bawah) {
                errors.batasAtas = 'Batas atas harus lebih besar dari batas bawah';
                isValid = false;
            }
        }

        setFormErrors(errors);
        return isValid;
    };

    const handleInputChange = (field: keyof DistribusiUpahConfig, value: string) => {
        const numericValue = value.replace(/[^0-9]/g, '');
        
        setDistribusiConfig(prev => ({
            ...prev,
            [field]: numericValue
        }));

        if (formErrors[field]) {
            setFormErrors(prev => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            toast.error('Mohon periksa kembali form Anda');
            return;
        }

        try {
            setIsSubmitting(true);
            await fetchDashboardData(distribusiConfig);
            setIsModalOpen(false);
            toast.success('Distribusi upah berhasil diperbarui');
        } catch (error) {
            console.error('Error updating distribution:', error);
            toast.error('Gagal memperbarui distribusi upah');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReset = () => {
        const defaultConfig = {
            batasBawah: '50000',
            batasAtas: '100000',
        };
        setDistribusiConfig(defaultConfig);
        setFormErrors({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Memuat data...</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg text-red-500">Gagal memuat data</div>
            </div>
        );
    }

    const chartData = [
        { name: `Upah Tinggi (≥${formatRupiah(Number(distribusiConfig.batasAtas))})`, value: data.distribusiUpah.upahTinggi || 0 },
        { name: `Upah Menengah (${formatRupiah(Number(distribusiConfig.batasBawah))} - ${formatRupiah(Number(distribusiConfig.batasAtas) - 1)})`, value: data.distribusiUpah.upahMenengah || 0 },
        { name: `Upah Rendah (<${formatRupiah(Number(distribusiConfig.batasBawah))})`, value: data.distribusiUpah.upahRendah || 0 },
    ];

    function formatRupiah(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    const renderPercentageText = (growth: { bulanIni: number; bulanLalu: number; persen: number }) => {
        if (growth.persen > 0) {
            return (
                <p className="text-sm text-green-600 mt-1">
                    ▲ Naik {growth.persen}% dari bulan lalu, yaitu {growth.bulanLalu}
                </p>
            );
        } else if (growth.persen < 0) {
            return (
                <p className="text-sm text-red-600 mt-1">
                    ▼ Turun {Math.abs(growth.persen)}% dari bulan lalu, yaitu {growth.bulanLalu}
                </p>
            );
        } else {
            return (
                <p className="text-sm text-gray-500 mt-1">
                    Tidak ada perubahan dari bulan lalu, yaitu {growth.bulanLalu}
                </p>
            );
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Order Bulan Ini</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {data.stats.produkBulanIni}
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <IconShirt className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Upah Terbayar</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatRupiah(data.stats.upahTerbayar)}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <IconCurrencyDollar className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Upah Belum Dibayar</p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                {formatRupiah(data.stats.upahBelumDibayar)}
                            </p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <IconCurrencyDollar className="w-8 h-8 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Karyawan</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {data.stats.totalKaryawan}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <IconUsers className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600">Perbandingan Jumlah Order</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {data.produkGrowth.bulanIni} Order
                            </p>
                            {renderPercentageText(data.produkGrowth)}
                        </div>
                        <div className="bg-gray-100 p-3 rounded-full">
                            <IconChartBar className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <p className="text-sm text-gray-600">Perbandingan Jumlah Pola</p>
                            <p className="text-3xl font-bold text-gray-800 mt-2">
                                {data.polaGrowth.bulanIni} Pola
                            </p>
                            {renderPercentageText(data.polaGrowth)}
                        </div>
                        <div className="bg-gray-100 p-3 rounded-full">
                            <IconChartBar className="w-8 h-8 text-gray-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Distribusi Upah Karyawan
                        </h2>
                        <Button
                            className="bg-teal-500 hover:bg-teal-600 text-white text-sm"
                            onPress={() => setIsModalOpen(true)}
                        >
                            <IconSettings className="w-4 h-4" />
                            Atur Distribusi
                        </Button>
                    </div>
                    <div className="flex flex-col items-center">
                        {chartData.every(item => item.value === 0) ? (
                            <div className="flex items-center justify-center h-[250px]">
                                <p className="text-gray-500 text-center">Tidak ada data upah</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                        <div className="mt-4 space-y-2 w-full">
                            {chartData.map((item, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: COLORS[index] }}
                                        />
                                        <span className="text-gray-600">{item.name}</span>
                                    </div>
                                    <span className="font-semibold">{item.value} orang</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-800">Order Terbaru</h2>
                        <button
                            onClick={() => router.push('/produksi')}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium transition"
                        >
                            <span>Lihat Semua</span>
                        </button>
                    </div>
                    <div className="space-y-3">
                        {data.produkTerbaru.map((produk) => (
                            <div
                                key={produk.id_produk}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <IconShirt className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {produk.nama_produk}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Detail: {produk.warna} - {produk.ukuran}
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${produk.status === 'selesai'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                >
                                    {produk.status === 'selesai' ? 'Selesai' : 'Diproses'}
                                </span>
                            </div>
                        ))}
                        {data.produkTerbaru.length === 0 && (
                            <p className="text-center text-gray-500 py-4">
                                Belum ada order bulan ini
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {data.deadlineMendekat.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <IconAlertCircle className="w-6 h-6 text-red-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Order Deadline Mendekat ({"<"} 7 Hari)
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.deadlineMendekat.map((produk) => (
                            <div
                                key={produk.id_produk}
                                className="border border-red-200 rounded-lg p-4 bg-red-50 hover:shadow-md transition"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-semibold text-gray-800">
                                            {produk.nama_produk}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Detail: {produk.warna} - {produk.ukuran}
                                        </p>
                                    </div>
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">
                                        {produk.hariTersisa} hari
                                    </span>
                                </div>
                                <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600">Progress</span>
                                        <span className="font-semibold">{produk.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-red-600 h-2 rounded-full transition-all"
                                            style={{ width: `${produk.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <IconTrendingUp className="w-6 h-6 text-blue-600" />
                    <h2 className="text-xl font-semibold text-gray-800">
                        Progress Order Bulan Ini
                    </h2>
                </div>
                <div className="space-y-4">
                    {data.produkProgress.map((produk) => (
                        <div
                            key={produk.id_produk}
                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-gray-800 text-lg">
                                        {produk.nama_produk}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {produk.warna} - {produk.ukuran}
                                    </p>
                                </div>
                                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                                    {produk.progress}%
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className="text-gray-600">
                                        Pola Selesai: {produk.polaSelesai} / {produk.totalPola}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div 
                                        className={`h-3 rounded-full transition-all ${produk.progress === 100 ? 'bg-green-500' : 'bg-yellow-400'}`} 
                                        style={{ width: `${produk.progress}%` }} 
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.produkProgress.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                            Tidak ada order yang sedang dikerjakan bulan ini
                        </p>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <IconCalendar className="w-6 h-6 text-purple-600" />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Absensi Karyawan
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push('/absensi')}
                        className="text-sm text-purple-600 hover:underline"
                    >
                        Lihat semua
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Nama Karyawan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tanggal Terakhir
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Jumlah Kehadiran
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.absensiKaryawan.map((karyawan) => (
                                <tr key={karyawan.id_karyawan} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="bg-purple-100 p-2 rounded-full mr-3">
                                                <IconUsers className="w-5 h-5 text-purple-600" />
                                            </div>
                                            <span className="font-medium text-gray-800">
                                                {karyawan.nama_karyawan}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        {new Date(karyawan.tanggal_terakhir).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            {karyawan.jumlah_kehadiran} hari
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {data.absensiKaryawan.length === 0 && (
                        <p className="text-center text-gray-500 py-8">
                            Tidak ada data absensi
                        </p>
                    )}
                </div>
            </div>

            <Modal 
                isOpen={isModalOpen} 
                onClose={() => {
                    setIsModalOpen(false);
                    setFormErrors({});
                }}
                size="2xl"
                scrollBehavior="inside"
            >
                <ModalContent>
                    <ModalHeader className="flex flex-col gap-1">
                        <h3 className="text-xl font-semibold">Atur Distribusi Upah</h3>
                        <p className="text-sm text-gray-500 font-normal">
                            Tentukan range upah untuk setiap kategori karyawan
                        </p>
                    </ModalHeader>
                    <ModalBody>
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-sm text-blue-800">
                                    <strong>Cara Kerja:</strong> Masukkan 2 angka sebagai batas distribusi upah. 
                                    Angka pertama memisahkan upah rendah dan menengah, angka kedua memisahkan upah menengah dan tinggi.
                                </p>
                            </div>

                            <Input
                                type="text"
                                label="Batas Bawah"
                                placeholder="Contoh: 50000"
                                value={distribusiConfig.batasBawah}
                                onChange={(e) => handleInputChange('batasBawah', e.target.value)}
                                isInvalid={!!formErrors.batasBawah}
                                errorMessage={formErrors.batasBawah}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">Rp</span>
                                    </div>
                                }
                                description="Batas antara upah rendah dan menengah"
                            />

                            <Input
                                type="text"
                                label="Batas Atas"
                                placeholder="Contoh: 100000"
                                value={distribusiConfig.batasAtas}
                                onChange={(e) => handleInputChange('batasAtas', e.target.value)}
                                isInvalid={!!formErrors.batasAtas}
                                errorMessage={formErrors.batasAtas}
                                startContent={
                                    <div className="pointer-events-none flex items-center">
                                        <span className="text-default-400 text-small">Rp</span>
                                    </div>
                                }
                                description="Batas antara upah menengah dan tinggi"
                            />

                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
                                <p className="text-sm font-semibold text-gray-700">Preview Kategori:</p>
                                <div className="space-y-1 text-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                                        <p className="text-gray-600">
                                            Upah Rendah: {'<'} {formatRupiah(Number(distribusiConfig.batasBawah) || 0)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                        <p className="text-gray-600">
                                            Upah Menengah: {formatRupiah(Number(distribusiConfig.batasBawah) || 0)} - {formatRupiah((Number(distribusiConfig.batasAtas) - 1) || 0)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <p className="text-gray-600">
                                            Upah Tinggi: ≥ {formatRupiah(Number(distribusiConfig.batasAtas) || 0)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="default"
                            variant="light"
                            onPress={handleReset}
                        >
                            Reset ke Default
                        </Button>
                        <Button
                            color="danger"
                            variant="light"
                            onPress={() => {
                                setIsModalOpen(false);
                                setFormErrors({});
                            }}
                        >
                            Batal
                        </Button>
                        <Button
                            className="bg-teal-500 hover:bg-teal-600 text-white text-sm"
                            onPress={handleSubmit}
                            isLoading={isSubmitting}
                            isDisabled={isSubmitting}
                        >
                            Terapkan
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </div>
    );
}