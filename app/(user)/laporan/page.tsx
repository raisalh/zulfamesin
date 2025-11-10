"use client";

import { useState, useEffect } from 'react';
import { IconChartBar, IconUsers, IconCash, IconFilter, IconCalendar, IconRefresh, IconFileSpreadsheet} from '@tabler/icons-react';
import {BarChart, Bar,PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';

type TabType = 'produksi' | 'karyawan' | 'upah';

interface FilterState {
    tahun: string;
    bulan: string;
    status: string;
    id_karyawan: string;
}

export default function LaporanPage() {
    const [activeTab, setActiveTab] = useState<TabType>('produksi');
    const [loading, setLoading] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    const [filters, setFilters] = useState<FilterState>({
        tahun: new Date().getFullYear().toString(),
        bulan: '',
        status: '',
        id_karyawan: ''
    });

    const [laporanProduksi, setLaporanProduksi] = useState<any[]>([]);
    const [laporanKaryawan, setLaporanKaryawan] = useState<any[]>([]);
    const [laporanUpah, setLaporanUpah] = useState<any[]>([]);

    const tabs = [
        { id: 'produksi' as TabType, label: 'Laporan Produksi', icon: IconChartBar },
        { id: 'karyawan' as TabType, label: 'Laporan Karyawan', icon: IconUsers },
        { id: 'upah' as TabType, label: 'Laporan Upah', icon: IconCash }
    ];

    useEffect(() => {
        loadData();
    }, [activeTab, filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'produksi') {
                await loadLaporanProduksi();
            } else if (activeTab === 'karyawan') {
                await loadLaporanKaryawan();
            } else if (activeTab === 'upah') {
                await loadLaporanUpah();
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadLaporanProduksi = async () => {
        const params = new URLSearchParams({
            category: 'produksi',
            type: 'monthly',
            tahun: filters.tahun,
            ...(filters.bulan && { bulan: filters.bulan })
        });

        const res = await fetch(`/api/laporan?${params}`);
        const json = await res.json();
        if (json.success) {
            setLaporanProduksi(json.data);
        }
    };

    const loadLaporanKaryawan = async () => {
        const params = new URLSearchParams({
            category: 'karyawan',
            type: 'summary',
            tahun: filters.tahun,
            ...(filters.bulan && { bulan: filters.bulan })
        });

        const res = await fetch(`/api/laporan?${params}`);
        const json = await res.json();
        if (json.success) {
            setLaporanKaryawan(json.data);
        }
    };

    const loadLaporanUpah = async () => {
        const params = new URLSearchParams({
            category: 'upah',
            type: 'summary',
            tahun: filters.tahun,
            ...(filters.bulan && { bulan: filters.bulan }),
            ...(filters.status && { status: filters.status })
        });

        const res = await fetch(`/api/laporan?${params}`);
        const json = await res.json();
        if (json.success) {
            setLaporanUpah(json.data);
        }
    };

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            tahun: new Date().getFullYear().toString(),
            bulan: '',
            status: '',
            id_karyawan: ''
        });
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <IconFilter size={20} />
                                Filter
                            </button>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                <IconRefresh size={20} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-2 border-b border-gray-200">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showFilter && (
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {activeTab === 'produksi' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Tahun
                                        </label>
                                        <input
                                            type="number"
                                            value={filters.tahun}
                                            onChange={(e) => handleFilterChange('tahun', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="2024"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Bulan
                                        </label>
                                        <select
                                            value={filters.bulan}
                                            onChange={(e) => handleFilterChange('bulan', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="">Semua Bulan</option>
                                            <option value="1">Januari</option>
                                            <option value="2">Februari</option>
                                            <option value="3">Maret</option>
                                            <option value="4">April</option>
                                            <option value="5">Mei</option>
                                            <option value="6">Juni</option>
                                            <option value="7">Juli</option>
                                            <option value="8">Agustus</option>
                                            <option value="9">September</option>
                                            <option value="10">Oktober</option>
                                            <option value="11">November</option>
                                            <option value="12">Desember</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {(activeTab === 'karyawan' || activeTab === 'upah') && (
                                <>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tahun
                                    </label>
                                    <input
                                        type="number"
                                        value={filters.tahun}
                                        onChange={(e) => handleFilterChange('tahun', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Bulan
                                    </label>
                                    <select
                                        value={filters.bulan}
                                        onChange={(e) => handleFilterChange('bulan', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Semua Bulan</option>
                                        <option value="1">Januari</option>
                                        <option value="2">Februari</option>
                                        <option value="3">Maret</option>
                                        <option value="4">April</option>
                                        <option value="5">Mei</option>
                                        <option value="6">Juni</option>
                                        <option value="7">Juli</option>
                                        <option value="8">Agustus</option>
                                        <option value="9">September</option>
                                        <option value="10">Oktober</option>
                                        <option value="11">November</option>
                                        <option value="12">Desember</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="diproses">Diproses</option>
                                        <option value="selesai">Selesai</option>
                                    </select>
                                </div>
                            </>
                            )}

                            {activeTab === 'upah' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Status Pekerjaan
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        <option value="">Semua Status</option>
                                        <option value="selesai">Selesai</option>
                                        <option value="dikerjakan">Dikerjakan</option>
                                    </select>
                                </div>
                            )}

                            <div className="flex items-end">
                                <button
                                    onClick={resetFilters}
                                    className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Reset Filter
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <div className="text-center">
                            <IconRefresh className="animate-spin mx-auto mb-4" size={48} />
                            <p className="text-gray-600">Memuat data...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'produksi' && (
                            <LaporanProduksiContent data={laporanProduksi} colors={COLORS} />
                        )}
                        {activeTab === 'karyawan' && (
                            <LaporanKaryawanContent data={laporanKaryawan} colors={COLORS} />
                        )}
                        {activeTab === 'upah' && (
                            <LaporanUpahContent data={laporanUpah} colors={COLORS} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function LaporanProduksiContent({ data, colors }: { data: any[]; colors: string[] }) {
    const formatBulan = (bulanStr: string) => {
        const [year, month] = bulanStr.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const chartData = data.map(item => ({
        ...item,
        bulan: formatBulan(item.bulan)
    }));

    const totalStats = {
        total: data.reduce((sum, item) => sum + item.total_produksi, 0),
        selesai: data.reduce((sum, item) => sum + item.selesai, 0),
        diproses: data.reduce((sum, item) => sum + item.diproses, 0)
    };

    const pieData = [
        { name: 'Selesai', value: totalStats.selesai },
        { name: 'Diproses', value: totalStats.diproses }
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Produksi</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalStats.total}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <IconChartBar size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Selesai</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{totalStats.selesai}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <IconFileSpreadsheet size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Diproses</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">{totalStats.diproses}</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <IconRefresh size={24} className="text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Produksi Per Bulan
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bulan" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="selesai" fill="#10b981" name="Selesai" />
                            <Bar dataKey="diproses" fill="#f59e0b" name="Diproses" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Distribusi Status
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Detail Data</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Bulan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Produksi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Selesai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Diproses
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {formatBulan(row.bulan)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {row.total_produksi}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                                        {row.selesai}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                                        {row.diproses}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LaporanKaryawanContent({ data, colors }: { data: any[]; colors: string[] }) {
    const topPerformers = [...data].sort((a, b) => b.total_unit - a.total_unit).slice(0, 5);

    const chartData = topPerformers.map(item => ({
        nama: item.nama_karyawan,
        unit: item.total_unit || 0
    }));

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top 5 Karyawan Berdasarkan Unit Dikerjakan
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nama" type="category" width={150} />
                        <Tooltip />
                        <Bar dataKey="unit" fill="#3b82f6" name="Total Unit" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Detail Karyawan</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Nama Karyawan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Pekerjaan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Unit
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Selesai
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Dikerjakan
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {row.nama_karyawan}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {row.total_pekerjaan || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {row.total_unit || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-green-600 font-medium">
                                        {row.pekerjaan_selesai || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-orange-600 font-medium">
                                        {row.pekerjaan_dikerjakan || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function LaporanUpahContent({ data, colors }: { data: any[]; colors: string[] }) {
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const totalStats = {
        totalUpah: data.reduce((sum, item) => sum + (parseFloat(item.total_upah) || 0), 0),
        dibayar: data.reduce((sum, item) => sum + (parseFloat(item.dibayar) || 0), 0),
        belumDibayar: data.reduce((sum, item) => sum + (parseFloat(item.belum_dibayar) || 0), 0)
    };

    const chartData = data.map(item => ({
        nama: item.nama_karyawan,
        upah: parseFloat(item.total_upah) || 0
    })).slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Upah</p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {formatRupiah(totalStats.totalUpah)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <IconCash size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Sudah Dibayar</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatRupiah(totalStats.dibayar)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <IconCash size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Belum Dibayar</p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                {formatRupiah(totalStats.belumDibayar)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <IconCash size={24} className="text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribusi Upah Per Karyawan (Top 10)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nama" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                        <Bar dataKey="upah" fill="#3b82f6" name="Total Upah" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Detail Upah Karyawan</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Nama Karyawan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Pekerjaan
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Total Unit
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total Upah
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Dibayar
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Belum Dibayar
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((row, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {row.nama_karyawan}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {row.total_pekerjaan || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {row.total_unit || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                                        {formatRupiah(parseFloat(row.total_upah) || 0)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-green-600 text-right font-medium">
                                        {formatRupiah(parseFloat(row.dibayar) || 0)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-orange-600 text-right font-medium">
                                        {formatRupiah(parseFloat(row.belum_dibayar) || 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}