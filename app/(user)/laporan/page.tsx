"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { IconChartBar, IconUsers, IconCash, IconFilter, IconRefresh, IconFileSpreadsheet, IconClock, IconTarget, IconTrendingUp, IconTrendingDown, IconWallet} from '@tabler/icons-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type TabType = 'produksi' | 'karyawan' | 'upah' | 'cashflow';

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
    const [laporanPola, setLaporanPola] = useState<any>(null);
    const [onTimeDelivery, setOnTimeDelivery] = useState<any>(null);
    const [durasiPengerjaan, setDurasiPengerjaan] = useState<any[]>([]);
    const [distribusiJenisPekerjaan, setDistribusiJenisPekerjaan] = useState<any[]>([]);
    const [completionRate, setCompletionRate] = useState<any[]>([]);
    const [tingkatKehadiran, setTingkatKehadiran] = useState<any[]>([]);
    const [workloadBalance, setWorkloadBalance] = useState<any[]>([]);
    const [upahBelumDibayar, setUpahBelumDibayar] = useState<any[]>([]);
    const [perbandinganBulanan, setPerbandinganBulanan] = useState<any>(null);
    const [cashflowData, setCashflowData] = useState<any>(null);
    const [cashflowPeriode, setCashflowPeriode] = useState<'mingguan' | 'bulanan' | 'tahunan'>('mingguan');

    const tabs = [
        { id: 'produksi' as TabType, label: 'Laporan Produksi', icon: IconChartBar },
        { id: 'karyawan' as TabType, label: 'Laporan Karyawan', icon: IconUsers },
        { id: 'upah' as TabType, label: 'Laporan Upah', icon: IconCash },
        { id: 'cashflow' as TabType, label: 'Cashflow', icon: IconTrendingUp }
    ];

    useEffect(() => {
        loadData();
    }, activeTab === 'cashflow' ? [activeTab, cashflowPeriode] : [activeTab, filters]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'produksi') {
                await loadLaporanProduksi();
            } else if (activeTab === 'karyawan') {
                await loadLaporanKaryawan();
            } else if (activeTab === 'upah') {
                await loadLaporanUpah();
            } else if (activeTab === 'cashflow') {
                await loadLaporanCashflow();
            }
        } catch (error: any) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data laporan', {
                description: error?.response?.data?.message || 'Terjadi kesalahan saat memuat data'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadLaporanProduksi = async () => {
        try {
            const params = {
                category: 'produksi',
                tahun: filters.tahun,
                ...(filters.bulan && { bulan: filters.bulan })
            };

            const [
                monthlyRes,
                polaRes,
                onTimeRes,
                durasiRes,
                jenisRes
            ] = await Promise.all([
                axios.get('/api/laporan', { params: { ...params, type: 'monthly' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'pola' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'on-time-delivery' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'durasi-pengerjaan', limit: 10 } }),
                axios.get('/api/laporan', { params: { ...params, type: 'distribusi-jenis-pekerjaan' } })
            ]);

            setLaporanProduksi(monthlyRes.data.data);
            setLaporanPola(polaRes.data.data);
            setOnTimeDelivery(onTimeRes.data.data);
            setDurasiPengerjaan(durasiRes.data.data);
            setDistribusiJenisPekerjaan(jenisRes.data.data);
        } catch (error) {
            throw error;
        }
    };

    const loadLaporanKaryawan = async () => {
        try {
            const params = {
                category: 'karyawan',
                tahun: filters.tahun,
                ...(filters.bulan && { bulan: filters.bulan })
            };

            const [summaryRes, completionRes, kehadiranRes, workloadRes] = await Promise.all([
                axios.get('/api/laporan', { params: { ...params, type: 'summary' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'completion-rate' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'tingkat-kehadiran' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'workload-balance' } })
            ]);

            setLaporanKaryawan(summaryRes.data.data);
            setCompletionRate(completionRes.data.data);
            setTingkatKehadiran(kehadiranRes.data.data);
            setWorkloadBalance(workloadRes.data.data);
        } catch (error) {
            throw error;
        }
    };

    const loadLaporanUpah = async () => {
        try {
            const params = {
                category: 'upah',
                tahun: filters.tahun,
                ...(filters.bulan && { bulan: filters.bulan }),
                ...(filters.status && { status: filters.status })
            };

            const apiRequests = [
                axios.get('/api/laporan', { params: { ...params, type: 'summary' } }),
                axios.get('/api/laporan', { params: { ...params, type: 'belum-dibayar' } })
            ];

            if (filters.bulan) {
                apiRequests.push(
                    axios.get('/api/laporan', {
                        params: {
                            category: 'upah',
                            type: 'perbandingan-bulanan',
                            tahun: filters.tahun,
                            bulan: filters.bulan
                        }
                    })
                );
            }

            const responses = await Promise.all(apiRequests);

            setLaporanUpah(responses[0].data.data);
            setUpahBelumDibayar(responses[1].data.data);

            if (filters.bulan && responses[2]) {
                setPerbandinganBulanan(responses[2].data.data);
            } else {
                setPerbandinganBulanan(null);
            }
        } catch (error) {
            throw error;
        }
    };

    const loadLaporanCashflow = async () => {
        try {
            const params: any = {
                category: 'cashflow',
                periode: cashflowPeriode
            };
    
            if (cashflowPeriode === 'bulanan') {
                params.tahun = new Date().getFullYear();
                params.bulan = new Date().getMonth() + 1;
            } else if (cashflowPeriode === 'tahunan') {
                params.tahun = new Date().getFullYear();
            }
    
            const response = await axios.get('/api/laporan', { params });
            setCashflowData(response.data.data);
        } catch (error) {
            throw error;
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
        toast.success('Filter direset');
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
                            <p className="text-sm text-gray-600 mt-1">Visualisasi data dan analitik produksi</p>
                        </div>
                        {activeTab !== 'cashflow' && (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${showFilter ? 'bg-gray-50' : 'bg-white'
                                    }`}
                            >
                                <IconFilter size={20} />
                                Filter
                            </button>
                            <button
                                onClick={loadData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <IconRefresh size={20} className={loading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                        )}
                    </div>

                    <div className="flex gap-2 border-b border-gray-200 overflow-x-auto whitespace-nowrap scrollbar-hide">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                                        ? "border-teal-600 text-teal-600"
                                        : "border-transparent text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showFilter && activeTab !== 'cashflow' && (
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 py-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

                            {activeTab === 'upah' && (
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
                                        <option value="dikerjakan">Dikerjakan</option>
                                        <option value="selesai">Selesai</option>
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
                            <IconRefresh className="animate-spin mx-auto mb-4 text-blue-600" size={48} />
                            <p className="text-gray-600 font-medium">Memuat data...</p>
                            <p className="text-sm text-gray-500 mt-1">Mohon tunggu sebentar</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {activeTab === 'produksi' && (
                            <LaporanProduksiContent
                                data={laporanProduksi}
                                laporanPola={laporanPola}
                                onTimeDelivery={onTimeDelivery}
                                durasiPengerjaan={durasiPengerjaan}
                                distribusiJenisPekerjaan={distribusiJenisPekerjaan}
                                colors={COLORS}
                            />
                        )}
                        {activeTab === 'karyawan' && (
                            <LaporanKaryawanContent
                                data={laporanKaryawan}
                                completionRate={completionRate}
                                tingkatKehadiran={tingkatKehadiran}
                                workloadBalance={workloadBalance}
                                colors={COLORS}
                            />
                        )}
                        {activeTab === 'upah' && (
                            <LaporanUpahContent
                                data={laporanUpah}
                                upahBelumDibayar={upahBelumDibayar}
                                perbandinganBulanan={perbandinganBulanan}
                                filters={filters}
                                colors={COLORS}
                            />
                        )}
                        {activeTab === 'cashflow' && (
                            <LaporanCashflowContent
                                data={cashflowData}
                                periode={cashflowPeriode}
                                setPeriode={setCashflowPeriode}
                                filters={filters}
                                colors={COLORS}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function LaporanProduksiContent({
    data,
    laporanPola,
    onTimeDelivery,
    durasiPengerjaan,
    distribusiJenisPekerjaan,
    colors
}: any) {
    const formatBulan = (bulanStr: string) => {
        const [year, month] = bulanStr.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    const chartData = data.map((item: any) => ({
        ...item,
        bulan: formatBulan(item.bulan)
    }));

    const totalStats = {
        total: Number(data.reduce((sum: number, item: any) => sum + Number(item.total_produksi || 0), 0)),
        selesai: Number(data.reduce((sum: number, item: any) => sum + Number(item.selesai || 0), 0)),
        diproses: Number(data.reduce((sum: number, item: any) => sum + Number(item.diproses || 0), 0))
    };

    const pieDataPola = laporanPola ? [
        { name: 'Pola Selesai', value: Number(laporanPola.pola_selesai || 0) },
        { name: 'Pola Belum Selesai', value: Number(laporanPola.pola_belum_selesai || 0) }
    ] : [];

    const pieDataOnTime = onTimeDelivery ? [
        { name: 'Tepat Waktu', value: Number(onTimeDelivery.tepat_waktu || 0) },
        { name: 'Terlambat', value: Number(onTimeDelivery.terlambat || 0) },
        { name: 'Diproses', value: Number(onTimeDelivery.sedang_diproses || 0) }
    ] : [];

    const onTimePercentage = onTimeDelivery && (Number(onTimeDelivery.tepat_waktu) + Number(onTimeDelivery.terlambat)) > 0
        ? Math.round((Number(onTimeDelivery.tepat_waktu) / (Number(onTimeDelivery.tepat_waktu) + Number(onTimeDelivery.terlambat))) * 100)
        : 0;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Order</p>
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

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Ketepatan Waktu</p>
                            <p className="text-3xl font-bold text-blue-600 mt-2">{onTimePercentage}%</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <IconTarget size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Order Per Bulan
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
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
                        Distribusi Pola
                    </h3>
                    <div className="relative">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieDataPola}
                                    cx="50%"
                                    cy="45%"
                                    labelLine={false}
                                    label={false}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieDataPola.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#10b981' : '#f59e0b'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm font-medium text-gray-700">
                                    Selesai: {Number(laporanPola?.pola_selesai || 0)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-sm font-medium text-gray-700">
                                    Belum: {Number(laporanPola?.pola_belum_selesai || 0)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <IconClock size={20} className="text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Tingkat Ketepatan Waktu
                    </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={pieDataOnTime}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieDataOnTime.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index === 0 ? '#10b981' : index === 1 ? '#ef4444' : '#f59e0b'}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="lg:col-span-2 flex flex-col justify-center gap-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                <p className="text-sm font-medium text-green-800">Tepat Waktu</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">
                                    {onTimeDelivery?.tepat_waktu || 0}
                                </p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-sm font-medium text-red-800">Terlambat</p>
                                <p className="text-2xl font-bold text-red-600 mt-1">
                                    {onTimeDelivery?.terlambat || 0}
                                </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-800">Diproses</p>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {onTimeDelivery?.sedang_diproses || 0}
                                </p>
                            </div>
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm font-medium text-blue-800">Persentase Ketepatan Waktu</p>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-3">
                                    <div
                                        className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${onTimePercentage}%` }}
                                    />
                                </div>
                                <span className="text-xl font-bold text-blue-600">{onTimePercentage}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <IconClock size={20} className="text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Durasi Rata-rata Pengerjaan per Order
                    </h3>
                </div>
                {durasiPengerjaan.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Tidak ada data produk selesai untuk ditampilkan
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={durasiPengerjaan}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="nama_produk"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis label={{ value: 'Hari', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                formatter={(value: any, name: string) => {
                                    if (name === 'rata_rata_hari') return [`${value} hari`, 'Rata-rata'];
                                    return [value, name];
                                }}
                            />
                            <Bar
                                dataKey="rata_rata_hari"
                                fill="#8b5cf6"
                                name="Rata-rata Hari"
                                label={{ position: 'top', fontSize: 10 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribusi Jenis Pekerjaan
                </h3>
                {distribusiJenisPekerjaan.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Tidak ada data jenis pekerjaan untuk ditampilkan
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={distribusiJenisPekerjaan}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="nama_pekerjaan"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="unit_selesai" fill="#10b981" name="Unit Selesai" />
                            <Bar dataKey="total_target" fill="#9ca3af" name="Total Target" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}

function LaporanKaryawanContent({
    data,
    completionRate,
    tingkatKehadiran,
    workloadBalance,
    colors
}: any) {
    const topPerformers = [...data]
        .sort((a, b) => Number(b.unit_selesai || 0) - Number(a.unit_selesai || 0))
        .slice(0, 5);

    const chartData = topPerformers.map(item => ({
        nama: item.nama_karyawan,
        selesai: Number(item.unit_selesai || 0),
        sisa: Number(item.unit_sisa || 0)
    }));

    const completionRateTop10 = completionRate.slice(0, 10);
    const kehadiranTop10 = tingkatKehadiran.slice(0, 10);
    const workloadTop10 = workloadBalance.slice(0, 10);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Karyawan</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{data.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <IconUsers size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Karyawan Aktif</p>
                            <p className="text-3xl font-bold text-green-600 mt-2">{tingkatKehadiran.length}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <IconUsers size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Pola Selesai</p>
                            <p className="text-3xl font-bold text-orange-600 mt-2">
                                {data.reduce((sum: number, item: any) => sum + Number(item.unit_selesai || 0), 0)}
                            </p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                            <IconChartBar size={24} className="text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top 5 Karyawan Berdasarkan Jumlah Pola Selesai
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="nama" type="category" width={150} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="selesai" fill="#10b981" name="Unit Selesai" stackId="a" />
                        <Bar dataKey="sisa" fill="#f59e0b" name="Unit Sisa" stackId="a" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <IconClock size={20} className="text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Tingkat Kehadiran (Top 10)
                    </h3>
                </div>
                {kehadiranTop10.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Tidak ada data untuk ditampilkan
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={kehadiranTop10}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="nama_karyawan"
                                angle={-45}
                                textAnchor="end"
                                height={100}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis label={{ value: 'Hari', angle: -90, position: 'insideLeft' }} />
                            <Tooltip
                                formatter={(value: any, name: string) => {
                                    if (name === 'hari_aktif') return [`${value} hari`, 'Hari Aktif'];
                                    return [value, name];
                                }}
                            />
                            <Bar
                                dataKey="hari_aktif"
                                fill="#3b82f6"
                                name="Hari Aktif"
                                label={{ position: 'top', fontSize: 10 }}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <IconChartBar size={20} className="text-orange-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Keseimbangan Beban Kerja (Top 10)
                        </h3>
                    </div>
                    {workloadTop10.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Tidak ada data untuk ditampilkan
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={workloadTop10}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="nama_karyawan"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="unit_selesai" fill="#10b981" name="Unit Selesai" stackId="a" />
                                <Bar dataKey="unit_sisa" fill="#f59e0b" name="Unit Sisa" stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-4">
                        <IconTarget size={20} className="text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900">
                            Distribusi Progress Karyawan
                        </h3>
                    </div>
                    {data.length === 0 ? (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                            Tidak ada data untuk ditampilkan
                        </div>
                    ) : (
                        (() => {
                            const progressRanges = {
                                '0-25%': 0,
                                '26-50%': 0,
                                '51-75%': 0,
                                '76-100%': 0
                            };

                            data.forEach((row: any) => {
                                const totalUnit = Number(row.total_unit || 0);
                                const unitSelesai = Number(row.unit_selesai || 0);
                                const progress = totalUnit > 0
                                    ? Math.round((unitSelesai / totalUnit) * 100)
                                    : 0;

                                if (progress >= 0 && progress <= 25) {
                                    progressRanges['0-25%']++;
                                } else if (progress >= 26 && progress <= 50) {
                                    progressRanges['26-50%']++;
                                } else if (progress >= 51 && progress <= 75) {
                                    progressRanges['51-75%']++;
                                } else if (progress >= 76 && progress <= 100) {
                                    progressRanges['76-100%']++;
                                }
                            });

                            const pieData = [
                                { name: '0-25%', value: progressRanges['0-25%'], color: '#ef4444' },
                                { name: '26-50%', value: progressRanges['26-50%'], color: '#f59e0b' },
                                { name: '51-75%', value: progressRanges['51-75%'], color: '#3b82f6' },
                                { name: '76-100%', value: progressRanges['76-100%'], color: '#10b981' }
                            ].filter(item => item.value > 0);

                            return (
                                <div>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}
                                                outerRadius={100}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                                <span className="text-sm font-medium text-red-800">0-25%</span>
                                            </div>
                                            <p className="text-xl font-bold text-red-600">
                                                {progressRanges['0-25%']} karyawan
                                            </p>
                                        </div>

                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                                <span className="text-sm font-medium text-orange-800">26-50%</span>
                                            </div>
                                            <p className="text-xl font-bold text-orange-600">
                                                {progressRanges['26-50%']} karyawan
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-sm font-medium text-blue-800">51-75%</span>
                                            </div>
                                            <p className="text-xl font-bold text-blue-600">
                                                {progressRanges['51-75%']} karyawan
                                            </p>
                                        </div>

                                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                                <span className="text-sm font-medium text-green-800">76-100%</span>
                                            </div>
                                            <p className="text-xl font-bold text-green-600">
                                                {progressRanges['76-100%']} karyawan
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </div>
    );
}

function LaporanUpahContent({
    data,
    upahBelumDibayar,
    perbandinganBulanan,
    filters,
    colors
}: {
    data: any[];
    upahBelumDibayar: any[];
    perbandinganBulanan: any;
    filters: FilterState;
    colors: string[]
}) {
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatPersentase = (persen: number) => {
        const formatted = Math.abs(persen).toFixed(1);
        return persen >= 0 ? `+${formatted}%` : `-${formatted}%`;
    };

    const getBulanNama = (bulan: number) => {
        const namaBulan = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        return namaBulan[bulan - 1];
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

    const chartBelumDibayar = upahBelumDibayar.map(item => ({
        nama: item.nama_karyawan,
        dikerjakan: parseFloat(item.belum_dibayar_dikerjakan) || 0,
        selesai: parseFloat(item.belum_dibayar_selesai) || 0
    }));


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

            {perbandinganBulanan && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm border border-blue-200">
                    <div className="flex items-center gap-2 mb-6">
                        <IconChartBar size={24} className="text-blue-600" />
                        <h3 className="text-xl font-bold text-gray-900">
                            Perbandingan Upah Bulanan
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-blue-600">
                                    {filters.bulan
                                        ? `${getBulanNama(parseInt(filters.bulan))} ${filters.tahun}`
                                        : 'Bulan Ini'
                                    }
                                </h4>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                    Periode Saat Ini
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="border-b border-gray-200 pb-3">
                                    <p className="text-sm text-gray-600 mb-1">Total Upah</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {formatRupiah(perbandinganBulanan.bulan_ini.total_upah)}
                                    </p>
                                    {perbandinganBulanan.perubahan.total_upah_persen !== 0 && (
                                        <div className={`flex items-center gap-1 mt-1 ${perbandinganBulanan.perubahan.total_upah_persen >= 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            <IconTrendingUp
                                                size={16}
                                                className={perbandinganBulanan.perubahan.total_upah_persen >= 0 ? '' : 'rotate-180'}
                                            />
                                            <span className="text-sm font-semibold">
                                                {formatPersentase(perbandinganBulanan.perubahan.total_upah_persen)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Sudah Dibayar</p>
                                        <p className="text-lg font-bold text-green-600">
                                            {formatRupiah(perbandinganBulanan.bulan_ini.dibayar)}
                                        </p>
                                        {perbandinganBulanan.perubahan.dibayar_persen !== 0 && (
                                            <span className={`text-xs font-medium ${perbandinganBulanan.perubahan.dibayar_persen >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {formatPersentase(perbandinganBulanan.perubahan.dibayar_persen)}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Belum Dibayar</p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {formatRupiah(perbandinganBulanan.bulan_ini.belum_dibayar)}
                                        </p>
                                        {perbandinganBulanan.perubahan.belum_dibayar_persen !== 0 && (
                                            <span className={`text-xs font-medium ${perbandinganBulanan.perubahan.belum_dibayar_persen >= 0
                                                ? 'text-orange-600'
                                                : 'text-green-600'
                                                }`}>
                                                {formatPersentase(perbandinganBulanan.perubahan.belum_dibayar_persen)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 mb-1">Jumlah Karyawan Aktif</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xl font-bold text-gray-900">
                                            {perbandinganBulanan.bulan_ini.jumlah_karyawan}
                                        </p>
                                        {perbandinganBulanan.perubahan.karyawan_persen !== 0 && (
                                            <span className={`text-xs font-medium ${perbandinganBulanan.perubahan.karyawan_persen >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {formatPersentase(perbandinganBulanan.perubahan.karyawan_persen)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 shadow-sm opacity-75">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-lg font-semibold text-gray-600">
                                    Bulan Sebelumnya
                                </h4>
                                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                    Bulan Lalu
                                </span>
                            </div>

                            <div className="space-y-4">
                                <div className="border-b border-gray-200 pb-3">
                                    <p className="text-sm text-gray-600 mb-1">Total Upah</p>
                                    <p className="text-2xl font-bold text-gray-700">
                                        {formatRupiah(perbandinganBulanan.bulan_lalu.total_upah)}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Sudah Dibayar</p>
                                        <p className="text-lg font-bold text-gray-700">
                                            {formatRupiah(perbandinganBulanan.bulan_lalu.dibayar)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-600 mb-1">Belum Dibayar</p>
                                        <p className="text-lg font-bold text-gray-700">
                                            {formatRupiah(perbandinganBulanan.bulan_lalu.belum_dibayar)}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-600 mb-1">Jumlah Karyawan Aktif</p>
                                    <p className="text-xl font-bold text-gray-700">
                                        {perbandinganBulanan.bulan_lalu.jumlah_karyawan}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 bg-white rounded-lg p-4 border-l-4 border-blue-500">
                        <p className="text-sm font-medium text-gray-700">
                            💡 <span className="font-semibold">Insight:</span>
                            {perbandinganBulanan.perubahan.total_upah_persen >= 0 ? (
                                <> Total upah bulan ini <span className="text-green-600 font-semibold">naik {formatPersentase(perbandinganBulanan.perubahan.total_upah_persen)}</span> dibanding bulan lalu.</>
                            ) : (
                                <> Total upah bulan ini <span className="text-red-600 font-semibold">turun {formatPersentase(perbandinganBulanan.perubahan.total_upah_persen)}</span> dibanding bulan lalu.</>
                            )}
                            {perbandinganBulanan.bulan_ini.belum_dibayar > perbandinganBulanan.bulan_lalu.belum_dibayar && (
                                <> Perhatian: Upah yang belum dibayar mengalami peningkatan.</>
                            )}
                        </p>
                    </div>
                </div>
            )}


            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Distribusi Upah Per Karyawan (Top 10)
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nama" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value) => formatRupiah(Number(value))} />
                        <Bar dataKey="upah" fill="#3b82f6" name="Total Upah" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                    <IconCash size={20} className="text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                        Detail Upah Belum Dibayar (Top 10)
                    </h3>
                </div>
                {chartBelumDibayar.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-gray-500">
                        Tidak ada upah yang belum dibayar
                    </div>
                ) : (
                    <>
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={chartBelumDibayar}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="nama"
                                    angle={-45}
                                    textAnchor="end"
                                    height={100}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis />
                                <Tooltip
                                    formatter={(value) => formatRupiah(Number(value))}
                                    contentStyle={{
                                        backgroundColor: 'white',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px'
                                    }}
                                />
                                <Legend />
                                <Bar
                                    dataKey="dikerjakan"
                                    fill="#f59e0b"
                                    name="Belum Selesai"
                                    stackId="a"
                                />
                                <Bar
                                    dataKey="selesai"
                                    fill="#ef4444"
                                    name="Selesai Belum Dibayar"
                                    stackId="a"
                                />
                            </BarChart>
                        </ResponsiveContainer>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-800">
                                    Upah Pekerjaan Belum Selesai
                                </p>
                                <p className="text-2xl font-bold text-orange-600 mt-2">
                                    {formatRupiah(
                                        chartBelumDibayar.reduce((sum, item) =>
                                            sum + item.dikerjakan, 0
                                        )
                                    )}
                                </p>
                            </div>

                            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <p className="text-sm font-medium text-red-800">
                                    Upah Selesai Belum Dibayar
                                </p>
                                <p className="text-2xl font-bold text-red-600 mt-2">
                                    {formatRupiah(
                                        chartBelumDibayar.reduce((sum, item) =>
                                            sum + item.selesai, 0
                                        )
                                    )}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="text-sm font-medium text-gray-800">
                                    Total Belum Dibayar
                                </p>
                                <p className="text-2xl font-bold text-gray-900 mt-2">
                                    {formatRupiah(
                                        chartBelumDibayar.reduce((sum, item) =>
                                            sum + item.dikerjakan + item.selesai, 0
                                        )
                                    )}
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function LaporanCashflowContent({
    data,
    periode,
    setPeriode,
    filters,
    colors
}: {
    data: any;
    periode: 'mingguan' | 'bulanan' | 'tahunan';
    setPeriode: (p: 'mingguan' | 'bulanan' | 'tahunan') => void;
    filters: FilterState;
    colors: string[];
}) {
    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    if (!data) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">Memuat data cashflow...</p>
            </div>
        );
    }

    const { summary, data: chartData } = data;

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Periode:</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriode('mingguan')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                periode === 'mingguan'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Mingguan
                        </button>
                        <button
                            onClick={() => setPeriode('bulanan')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                periode === 'bulanan'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Bulanan
                        </button>
                        <button
                            onClick={() => setPeriode('tahunan')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                periode === 'tahunan'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            Tahunan
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
                            <p className="text-2xl font-bold text-green-600 mt-2">
                                {formatRupiah(summary.total_pemasukan)}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <IconTrendingUp size={24} className="text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                            <p className="text-2xl font-bold text-red-600 mt-2">
                                {formatRupiah(summary.total_pengeluaran)}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <IconTrendingDown size={24} className="text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Saldo</p>
                            <p className={`text-2xl font-bold mt-2 ${
                                summary.saldo >= 0 ? 'text-blue-600' : 'text-red-600'
                            }`}>
                                {formatRupiah(summary.saldo)}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <IconWallet size={24} className="text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Mutasi Cashflow
                </h3>
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-96 text-gray-500">
                        Tidak ada data untuk periode ini
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                                dataKey="periode" 
                                angle={periode === 'mingguan' ? -45 : 0}
                                textAnchor={periode === 'mingguan' ? 'end' : 'middle'}
                                height={periode === 'mingguan' ? 80 : 40}
                                tick={{ fontSize: 11 }}
                            />
                            <YAxis />
                            <Tooltip 
                                formatter={(value) => formatRupiah(Number(value))}
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="pemasukan" fill="#10b981" name="Pemasukan" />
                            <Bar dataKey="pengeluaran" fill="#ef4444" name="Pengeluaran" />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className={`p-4 rounded-lg border-l-4 ${
                summary.saldo >= 0 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'bg-red-50 border-red-500'
            }`}>
                <p className="text-sm font-medium text-gray-700">
                    💡 <span className="font-semibold">Insight:</span>
                    {summary.saldo >= 0 ? (
                        <> Cashflow periode ini <span className="text-blue-600 font-semibold">positif</span> dengan saldo {formatRupiah(summary.saldo)}.</>
                    ) : (
                        <> Cashflow periode ini <span className="text-red-600 font-semibold">negatif</span> dengan defisit {formatRupiah(Math.abs(summary.saldo))}.</>
                    )}
                    {' '}Rasio pengeluaran terhadap pemasukan: {summary.total_pemasukan > 0 
                        ? `${((summary.total_pengeluaran / summary.total_pemasukan) * 100).toFixed(1)}%`
                        : 'N/A'
                    }
                </p>
            </div>
        </div>
    );
}