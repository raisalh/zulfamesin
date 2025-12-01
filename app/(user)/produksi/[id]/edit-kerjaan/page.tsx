"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    IconPlus,
    IconTrash,
    IconCheck,
    IconAlertTriangle,
    IconSearch,
    IconX,
    IconAlertCircle,
    IconUserX,
} from "@tabler/icons-react";
import axios from "axios";
import {
    Input,
    Button,
    Chip,
    Card,
    CardBody,
    Tooltip,
    addToast,
} from "@heroui/react";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
    jenis_kelamin: "perempuan" | "laki-laki" | null;
    deleted_at: Date | null;
}

interface Assignment {
    id_pekerjaan_karyawan?: number;
    id_karyawan: number;
    nama_karyawan: string;
    target_unit: number;
    unit_dikerjakan: number;
    is_deleted: boolean;
}

interface PekerjaanItem {
    id: string;
    id_jenis_pekerjaan?: number;
    nama_pekerjaan: string;
    upah_per_unit: string;
    tipe: "sistem" | "manual";
    assignments: Assignment[];
}

interface FormErrors {
    nama_pekerjaan?: string;
    upah_per_unit?: string;
    assignments?: string;
}

interface ProdukInfo {
    nama_produk: string;
    total_gulungan: number;
    total_pola: number;
}

export default function EditWorkAssignmentPage() {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [pekerjaanList, setPekerjaanList] = useState<PekerjaanItem[]>([]);
    const [produkInfo, setProdukInfo] = useState<ProdukInfo | null>(null);

    const router = useRouter();
    const params = useParams();
    const id = params.id as string;

    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: FormErrors }>({});
    const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>(
        {}
    );

    useEffect(() => {
        if (id) {
            fetchExistingData();
        }
    }, [id]);

    const fetchExistingData = async () => {
        setLoadingData(true);
        try {
            const karyawanResponse = await axios.get(
                "/api/employee?includeDeleted=true"
            );
            if (karyawanResponse.data.success) {
                setKaryawanList(karyawanResponse.data.data);
            }

            const produksiResponse = await axios.get(`/api/production/${id}`);
            if (produksiResponse.data.success && produksiResponse.data.data) {
                const data = produksiResponse.data.data;
                setProdukInfo({
                    nama_produk: data.nama_produk,
                    total_gulungan: data.gulungan || 0,
                    total_pola: data.jumlah_pola || 0,
                });
            }

            const pekerjaanResponse = await axios.get(`/api/work-assignment/${id}`);
            if (pekerjaanResponse.data.success) {
                const existingData = pekerjaanResponse.data.data.pekerjaan_list;

                const transformedPekerjaan = existingData.map((pekerjaan: any) => {
                    const assignments = pekerjaan.karyawan.map((k: any) => ({
                        id_pekerjaan_karyawan: k.id_pekerjaan_karyawan,
                        id_karyawan: k.id_karyawan,
                        nama_karyawan: k.nama_karyawan,
                        target_unit: k.target_unit,
                        unit_dikerjakan: k.unit_dikerjakan,
                        is_deleted: k.is_karyawan_deleted || false,
                    }));

                    return {
                        id: Date.now().toString() + Math.random(),
                        id_jenis_pekerjaan: pekerjaan.id_jenis_pekerjaan,
                        nama_pekerjaan: pekerjaan.nama_pekerjaan,
                        upah_per_unit: pekerjaan.upah_per_unit.toString(),
                        tipe: pekerjaan.tipe,
                        assignments: assignments,
                    };
                });

                setPekerjaanList(transformedPekerjaan);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            addToast({
                title: "Gagal Memuat Data",
                description: "Terjadi kesalahan saat mengambil data",
                color: "danger",
            });
        } finally {
            setLoadingData(false);
        }
    };

    const calculateTotalTarget = (): number => {
        let total = 0;
        pekerjaanList.forEach((pekerjaan) => {
            pekerjaan.assignments.forEach((assignment) => {
                total += assignment.target_unit;
            });
        });
        return total;
    };

    const getTotalAssigned = (): number => {
        return calculateTotalTarget();
    };

    const getDistributionStatus = () => {
        if (!produkInfo) return null;

        const totalAssigned = getTotalAssigned();
        const diff = produkInfo.total_pola - totalAssigned;

        if (diff === 0) {
            return {
                status: "valid",
                message: "Sesuai Target",
                color: "success" as const,
                diff: 0,
            };
        } else if (diff > 0) {
            return {
                status: "kurang",
                message: `Kurang ${diff} pola`,
                color: "warning" as const,
                diff,
            };
        } else {
            return {
                status: "lebih",
                message: `Berlebih ${Math.abs(diff)} pola`,
                color: "danger" as const,
                diff,
            };
        }
    };

    const isSubmitDisabled = (): boolean => {
        if (loading) return true;

        const distributionStatus = getDistributionStatus();
        if (distributionStatus && distributionStatus.status !== "valid") {
            return true;
        }

        return false;
    };

    const handleAddPekerjaan = () => {
        setPekerjaanList([
            ...pekerjaanList,
            {
                id: Date.now().toString(),
                nama_pekerjaan: "",
                upah_per_unit: "",
                tipe: "manual",
                assignments: [],
            },
        ]);
    };

    const handleRemovePekerjaan = (id: string) => {
        const pekerjaan = pekerjaanList.find((p) => p.id === id);

        const hasProgress = pekerjaan?.assignments.some(
            (a) => a.unit_dikerjakan > 0
        );

        if (hasProgress) {
            addToast({
                title: "Tidak Dapat Menghapus",
                description:
                    "Tidak dapat menghapus pekerjaan yang sudah memiliki progress",
                color: "danger",
            });
            return;
        }

        if (pekerjaanList.length === 1) {
            addToast({
                title: "Peringatan",
                description: "Minimal harus ada 1 pekerjaan",
                color: "warning",
            });
            return;
        }

        setPekerjaanList(pekerjaanList.filter((p) => p.id !== id));

        const newErrors = { ...errors };
        delete newErrors[id];
        setErrors(newErrors);
    };

    const handlePekerjaanChange = (id: string, field: string, value: any) => {
        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === id) {
                    return { ...p, [field]: value };
                }
                return p;
            })
        );
    };

    const handleAddAssignment = (pekerjaanId: string, karyawanId: number) => {
        const karyawan = karyawanList.find((k) => k.id_karyawan === karyawanId);
        if (!karyawan) return;

        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    const exists = p.assignments.some(
                        (a) => a.id_karyawan === karyawanId
                    );
                    if (exists) {
                        addToast({
                            title: "Karyawan Sudah Ada",
                            description: `${karyawan.nama_karyawan} sudah ada dalam daftar`,
                            color: "warning",
                        });
                        return p;
                    }

                    return {
                        ...p,
                        assignments: [
                            ...p.assignments,
                            {
                                id_karyawan: karyawanId,
                                nama_karyawan: karyawan.nama_karyawan,
                                target_unit: 0,
                                unit_dikerjakan: 0,
                                is_deleted: karyawan.deleted_at !== null,
                            },
                        ],
                    };
                }
                return p;
            })
        );
    };

    const handleRemoveAssignment = (pekerjaanId: string, karyawanId: number) => {
        const pekerjaan = pekerjaanList.find((p) => p.id === pekerjaanId);
        const assignment = pekerjaan?.assignments.find(
            (a) => a.id_karyawan === karyawanId
        );

        if (assignment && assignment.unit_dikerjakan > 0) {
            addToast({
                title: "Tidak Dapat Menghapus",
                description:
                    "Tidak dapat menghapus karyawan yang sudah memiliki progress",
                color: "danger",
            });
            return;
        }

        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    return {
                        ...p,
                        assignments: p.assignments.filter(
                            (a) => a.id_karyawan !== karyawanId
                        ),
                    };
                }
                return p;
            })
        );
    };

    const handleTargetChange = (
        pekerjaanId: string,
        karyawanId: number,
        value: string
    ) => {
        const numValue = value === "" ? 0 : parseInt(value.replace(/\D/g, "")) || 0;

        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    const newAssignments = p.assignments.map((a) => {
                        if (a.id_karyawan === karyawanId) {
                            return { ...a, target_unit: numValue };
                        }
                        return a;
                    });
                    return { ...p, assignments: newAssignments };
                }
                return p;
            })
        );
    };

    const getFilteredKaryawan = (pekerjaanId: string) => {
        const query = searchQueries[pekerjaanId]?.toLowerCase() || "";
        const pekerjaan = pekerjaanList.find((p) => p.id === pekerjaanId);
        const assignedIds = pekerjaan?.assignments.map((a) => a.id_karyawan) || [];

        let filtered = karyawanList.filter(
            (k) =>
                !assignedIds.includes(k.id_karyawan) &&
                k.nama_karyawan.toLowerCase().includes(query)
        );

        return filtered;
    };

    const validateForm = (): boolean => {
        let hasError = false;

        if (produkInfo) {
            const totalAssigned = getTotalAssigned();
            const distributionStatus = getDistributionStatus();

            if (distributionStatus && distributionStatus.status !== "valid") {
                console.log("❌ Distribution error:", distributionStatus.message);
                addToast({
                    title: "Total Target Tidak Sesuai",
                    description: `Total target semua karyawan harus sama dengan ${produkInfo.total_pola} pola. Saat ini ${totalAssigned} pola (${distributionStatus.message})`,
                    color: "danger",
                });
                hasError = true;
            }
        }

        pekerjaanList.forEach((p) => {
            console.log("Validating pekerjaan:", p.nama_pekerjaan);

            if (!p.nama_pekerjaan.trim()) {
                console.log("❌ Nama pekerjaan kosong");
                addToast({
                    title: "Nama Pekerjaan Kosong",
                    description: "Semua pekerjaan harus memiliki nama",
                    color: "danger",
                });
                hasError = true;
            }

            if (!p.upah_per_unit.trim()) {
                console.log("❌ Upah kosong");
                addToast({
                    title: "Upah Belum Diisi",
                    description: `Upah per pola untuk "${p.nama_pekerjaan || "pekerjaan ini"}" harus diisi`,
                    color: "danger",
                });
                hasError = true;
            } else if (!/^[0-9]+(\.[0-9]+)?$/.test(p.upah_per_unit)) {
                console.log("❌ Format upah salah:", p.upah_per_unit);
                addToast({
                    title: "Format Upah Salah",
                    description: "Upah per pola hanya boleh berisi angka",
                    color: "danger",
                });
                hasError = true;
            } else if (parseFloat(p.upah_per_unit) <= 0) {
                console.log("❌ Upah <= 0");
                addToast({
                    title: "Upah Tidak Valid",
                    description: "Upah per pola harus lebih dari 0",
                    color: "danger",
                });
                hasError = true;
            }

            if (p.assignments.length === 0) {
                console.log("❌ Tidak ada karyawan");
                addToast({
                    title: "Karyawan Belum Dipilih",
                    description: `Pekerjaan "${p.nama_pekerjaan}" harus memiliki minimal 1 karyawan`,
                    color: "danger",
                });
                hasError = true;
            }

            p.assignments.forEach((a) => {
                console.log(`Validating assignment: ${a.nama_karyawan}, target: ${a.target_unit}, done: ${a.unit_dikerjakan}`);

                if (a.target_unit <= 0) {
                    console.log(`❌ Target ${a.nama_karyawan} = 0`);
                    addToast({
                        title: "Target Belum Diisi",
                        description: `Target untuk ${a.nama_karyawan} harus lebih dari 0`,
                        color: "danger",
                    });
                    hasError = true;
                }

                if (a.target_unit < a.unit_dikerjakan) {
                    console.log(`❌ Target < progress untuk ${a.nama_karyawan}`);
                    addToast({
                        title: "Target Tidak Valid",
                        description: `Target untuk ${a.nama_karyawan} tidak boleh lebih dari progress (${a.unit_dikerjakan} pola). Minimum target harus ${a.unit_dikerjakan} pola`,
                        color: "danger",
                    });
                    hasError = true;
                }
            });
        });

        setErrors({});
        console.log("Validation complete. hasError:", hasError);
        return !hasError;
    };

    const handleSubmit = async () => {
        console.log("Submit clicked");
        console.log("Validation result:", validateForm());
        console.log("Current pekerjaanList:", pekerjaanList);
        console.log("Distribution status:", getDistributionStatus());

        if (!validateForm()) {
            console.log("Validation failed");
            return;
        }

        setLoading(true);

        const payload = {
            id_produk: id,
            pekerjaan_list: pekerjaanList.map((p) => ({
                id_jenis_pekerjaan: p.id_jenis_pekerjaan,
                nama_pekerjaan: p.nama_pekerjaan,
                upah_per_unit: parseFloat(p.upah_per_unit),
                tipe: p.tipe,
                assignments: p.assignments.map((a) => ({
                    id_pekerjaan_karyawan: a.id_pekerjaan_karyawan,
                    id_karyawan: a.id_karyawan,
                    target_unit: a.target_unit,
                    unit_dikerjakan: a.unit_dikerjakan,
                })),
            })),
        };

        try {
            const response = await axios.put("/api/work-assignment/edit", payload);

            if (response.data.success) {
                addToast({
                    title: "Berhasil!",
                    description: "Pekerjaan berhasil diperbarui",
                    color: "success",
                });
                setTimeout(() => {
                    router.push(`/produksi/${id}/lihat-progress`);
                }, 1000);
            } else {
                addToast({
                    title: "Gagal Menyimpan",
                    description:
                        response.data.message || "Terjadi kesalahan saat menyimpan",
                    color: "danger",
                });
            }
        } catch (error) {
            console.error("Error submitting:", error);
            if (axios.isAxiosError(error)) {
                const message =
                    error.response?.data?.message || "Terjadi kesalahan saat menyimpan";
                addToast({
                    title: "Gagal Menyimpan",
                    description: message,
                    color: "danger",
                });
            } else {
                addToast({
                    title: "Error",
                    description: "Terjadi kesalahan saat menyimpan pekerjaan",
                    color: "danger",
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const distributionStatus = getDistributionStatus();

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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Edit Pekerjaan Karyawan
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Edit pekerjaan dengan memperhatikan progress yang sudah dikerjakan
                        </p>
                    </div>
                </div>

                {produkInfo && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                            Informasi Produk
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Nama Produk</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {produkInfo.nama_produk}
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600 mb-1">Total Gulungan</div>
                                <div className="text-lg font-semibold text-gray-900">
                                    {produkInfo.total_gulungan} gulungan
                                </div>
                            </div>
                            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <div className="text-sm text-blue-600 mb-1">
                                    Total Pola Target
                                </div>
                                <div className="text-2xl font-bold text-blue-900">
                                    {produkInfo.total_pola} pola
                                </div>
                            </div>
                        </div>

                        {distributionStatus && (
                            <div
                                className="mt-4 flex items-center justify-between p-4 rounded-lg border-2"
                                style={{
                                    borderColor:
                                        distributionStatus.status === "valid"
                                            ? "#10b981"
                                            : distributionStatus.status === "kurang"
                                                ? "#f59e0b"
                                                : "#ef4444",
                                    backgroundColor:
                                        distributionStatus.status === "valid"
                                            ? "#f0fdf4"
                                            : distributionStatus.status === "kurang"
                                                ? "#fffbeb"
                                                : "#fef2f2",
                                }}
                            >
                                <div>
                                    <div
                                        className="text-sm font-medium"
                                        style={{
                                            color:
                                                distributionStatus.status === "valid"
                                                    ? "#059669"
                                                    : distributionStatus.status === "kurang"
                                                        ? "#d97706"
                                                        : "#dc2626",
                                        }}
                                    >
                                        Total Target Saat Ini: {getTotalAssigned()} pola
                                    </div>
                                    <div
                                        className="text-xs mt-1"
                                        style={{
                                            color:
                                                distributionStatus.status === "valid"
                                                    ? "#047857"
                                                    : distributionStatus.status === "kurang"
                                                        ? "#b45309"
                                                        : "#b91c1c",
                                        }}
                                    >
                                        {distributionStatus.status === "valid"
                                            ? "✓ Total target sudah sesuai dengan total pola produk"
                                            : `${distributionStatus.message} dari target ${produkInfo.total_pola} pola`}
                                    </div>
                                </div>
                                <Chip color={distributionStatus.color} variant="flat" size="lg">
                                    {distributionStatus.message}
                                </Chip>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
                    <IconAlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Perhatian:</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li>
                                Total target semua karyawan harus sama dengan{" "}
                                {produkInfo?.total_pola || 0} pola
                            </li>
                            <li>
                                Target baru tidak boleh lebih kecil dari progress yang sudah
                                dikerjakan
                            </li>
                            <li>
                                Pekerjaan dan karyawan yang sudah ada progress tidak dapat
                                dihapus
                            </li>
                            <li>Karyawan yang tidak aktif tetap bisa diedit targetnya</li>
                        </ul>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Daftar Pekerjaan
                        </h2>
                        <Button
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                            onPress={handleAddPekerjaan}
                        >
                            <IconPlus size={18} />
                            Tambah Pekerjaan Baru
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {pekerjaanList.map((pekerjaan) => {
                            const filteredKaryawan = getFilteredKaryawan(pekerjaan.id);
                            const hasProgress = pekerjaan.assignments.some(
                                (a) => a.unit_dikerjakan > 0
                            );
                            const totalTargetPekerjaan = pekerjaan.assignments.reduce(
                                (sum, a) => sum + a.target_unit,
                                0
                            );

                            return (
                                <Card key={pekerjaan.id} className="border border-gray-200">
                                    <CardBody className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Input
                                                label="Nama Pekerjaan"
                                                placeholder="Contoh: Pasang Kancing"
                                                value={pekerjaan.nama_pekerjaan}
                                                onChange={(e) =>
                                                    handlePekerjaanChange(
                                                        pekerjaan.id,
                                                        "nama_pekerjaan",
                                                        e.target.value
                                                    )
                                                }
                                                isInvalid={!!errors[pekerjaan.id]?.nama_pekerjaan}
                                                errorMessage={errors[pekerjaan.id]?.nama_pekerjaan}
                                            />

                                            <Input
                                                type="text"
                                                label="Upah per Pola (Rp)"
                                                placeholder="Contoh: 2000"
                                                value={
                                                    pekerjaan.upah_per_unit
                                                        ? parseInt(pekerjaan.upah_per_unit).toString()
                                                        : ""
                                                }
                                                onChange={(e) =>
                                                    handlePekerjaanChange(
                                                        pekerjaan.id,
                                                        "upah_per_unit",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>

                                        {pekerjaan.assignments.length > 0 && (
                                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-gray-600">
                                                        Total Target Pekerjaan Ini:
                                                    </span>
                                                    <span className="font-semibold text-gray-900">
                                                        {totalTargetPekerjaan} pola
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Karyawan Terpilih
                                            </label>

                                            {pekerjaan.assignments.length === 0 ? (
                                                <p className="text-sm text-gray-500 italic">
                                                    Belum ada karyawan terpilih
                                                </p>
                                            ) : (
                                                <div className="space-y-3">
                                                    {pekerjaan.assignments.map((assignment) => (
                                                        <div
                                                            key={assignment.id_karyawan}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border ${assignment.is_deleted
                                                                    ? "bg-red-50 border-red-200"
                                                                    : "bg-gray-50 border-gray-200"
                                                                }`}
                                                        >
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-medium text-gray-900">
                                                                        {assignment.nama_karyawan}
                                                                    </span>
                                                                    {assignment.is_deleted && (
                                                                        <Tooltip content="Karyawan tidak aktif">
                                                                            <Chip
                                                                                size="sm"
                                                                                color="danger"
                                                                                variant="flat"
                                                                                startContent={<IconUserX size={14} />}
                                                                            >
                                                                                Tidak Aktif
                                                                            </Chip>
                                                                        </Tooltip>
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-gray-600">
                                                                    Progress: {assignment.unit_dikerjakan} /{" "}
                                                                    {assignment.target_unit} pola
                                                                    {assignment.unit_dikerjakan > 0 && (
                                                                        <span className="text-blue-600 ml-2">
                                                                            (
                                                                            {Math.round(
                                                                                (assignment.unit_dikerjakan /
                                                                                    assignment.target_unit) *
                                                                                100
                                                                            )}
                                                                            %)
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <Input
                                                                type="text"
                                                                size="sm"
                                                                placeholder="Target"
                                                                value={String(assignment.target_unit)}
                                                                onChange={(e) =>
                                                                    handleTargetChange(
                                                                        pekerjaan.id,
                                                                        assignment.id_karyawan,
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-32"
                                                            />

                                                            <Button
                                                                isIconOnly
                                                                size="sm"
                                                                color="danger"
                                                                variant="light"
                                                                onPress={() =>
                                                                    handleRemoveAssignment(
                                                                        pekerjaan.id,
                                                                        assignment.id_karyawan
                                                                    )
                                                                }
                                                                isDisabled={assignment.unit_dikerjakan > 0}
                                                            >
                                                                <IconTrash size={18} />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {errors[pekerjaan.id]?.assignments && (
                                                <p className="text-sm text-danger mt-2">
                                                    {errors[pekerjaan.id]?.assignments}
                                                </p>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="text-sm font-medium text-gray-700 mb-2 block">
                                                Tambah Karyawan
                                            </label>

                                            <Input
                                                placeholder="Cari nama karyawan..."
                                                startContent={<IconSearch size={18} />}
                                                value={searchQueries[pekerjaan.id] || ""}
                                                onChange={(e) =>
                                                    setSearchQueries({
                                                        ...searchQueries,
                                                        [pekerjaan.id]: e.target.value,
                                                    })
                                                }
                                                endContent={
                                                    searchQueries[pekerjaan.id] && (
                                                        <button
                                                            onClick={() =>
                                                                setSearchQueries({
                                                                    ...searchQueries,
                                                                    [pekerjaan.id]: "",
                                                                })
                                                            }
                                                        >
                                                            <IconX size={18} className="text-gray-400" />
                                                        </button>
                                                    )
                                                }
                                                className="mb-3"
                                            />

                                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                                {filteredKaryawan.length > 0 ? (
                                                    filteredKaryawan.map((karyawan) => (
                                                        <Button
                                                            key={karyawan.id_karyawan}
                                                            size="sm"
                                                            variant="bordered"
                                                            className={`${karyawan.deleted_at
                                                                    ? "border-red-300 text-red-700"
                                                                    : "border-gray-300 text-gray-700 hover:border-teal-600"
                                                                }`}
                                                            onPress={() =>
                                                                handleAddAssignment(
                                                                    pekerjaan.id,
                                                                    karyawan.id_karyawan
                                                                )
                                                            }
                                                            startContent={
                                                                karyawan.deleted_at ? (
                                                                    <IconUserX size={14} />
                                                                ) : null
                                                            }
                                                        >
                                                            {karyawan.nama_karyawan}
                                                        </Button>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-gray-500">
                                                        Tidak ada karyawan tersedia
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {pekerjaanList.length > 1 && (
                                            <Button
                                                color="danger"
                                                variant="light"
                                                startContent={<IconTrash size={18} />}
                                                onPress={() => handleRemovePekerjaan(pekerjaan.id)}
                                                isDisabled={hasProgress}
                                                className="mt-4"
                                            >
                                                {hasProgress
                                                    ? "Tidak dapat menghapus (ada progress)"
                                                    : "Hapus Pekerjaan"}
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => setShowCancelModal(true)}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled()}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg ${isSubmitDisabled()
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-teal-600 hover:bg-teal-700"
                            } text-white`}
                    >
                        <IconCheck size={18} />
                        {loading ? "Menyimpan..." : "Simpan Perubahan"}
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
                            Anda yakin ingin membatalkan perubahan?
                        </p>
                        <p className="text-gray-500 text-sm mb-8">
                            Perubahan yang Anda buat akan hilang!
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                className="px-8 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 min-w-[120px]"
                                onClick={() => setShowCancelModal(false)}
                            >
                                Kembali
                            </button>
                            <button
                                className="px-8 py-3 bg-[#8EC3B3] rounded-full text-gray-900 font-semibold hover:bg-[#7AB9A8] min-w-[120px]"
                                onClick={() => router.push(`/produksi/${id}/lihat-progress`)}
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
