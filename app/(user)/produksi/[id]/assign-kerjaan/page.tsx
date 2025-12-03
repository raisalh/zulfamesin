"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { IconPlus, IconTrash, IconCheck, IconAlertTriangle, IconSearch, IconX } from "@tabler/icons-react";
import axios from "axios";
import {
    Input,
    Button,
    RadioGroup,
    Radio,
    Chip,
    Card,
    CardBody,
    addToast
} from "@heroui/react";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
    jenis_kelamin: "perempuan" | "laki-laki" | null;
    jenis_upah: "pola" | "harian" | null;
}

interface ManualAssignment {
    id_karyawan: number;
    unit: number;
}

interface PekerjaanItem {
    id: string;
    nama_pekerjaan: string;
    upah_per_unit: string;
    assignment_type: "sistem" | "manual";
    upah_harian: string;
    karyawan_ids: number[];
    manual_assignments: ManualAssignment[];
}

interface FormErrors {
    nama_pekerjaan?: string;
    upah_per_unit?: string;
    karyawan_ids?: string;
    manual_assignments?: string;
    upah_harian?: string;
    upah?: string;
}

export default function WorkAssignmentPage() {
    const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
    const [pekerjaanList, setPekerjaanList] = useState<PekerjaanItem[]>([
        {
            id: Date.now().toString(),
            nama_pekerjaan: "",
            upah_per_unit: "",
            assignment_type: "sistem",
            upah_harian: "",
            karyawan_ids: [],
            manual_assignments: [],
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
    const [searchQueries, setSearchQueries] = useState<{ [key: string]: string }>(
        {}
    );

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoadingData(true);
        try {
            const karyawanResponse = await axios.get("/api/employee");
            if (karyawanResponse.data.success) {
                setKaryawanList(karyawanResponse.data.data);
            }

            const gulunganResponse = await axios.get(`/api/production/${id}`);
            if (gulunganResponse.data.success && gulunganResponse.data.data) {
                const totalPolaValue = gulunganResponse.data.data.jumlah_pola || 0;
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
                assignment_type: "sistem",
                upah_harian: "",
                karyawan_ids: [],
                manual_assignments: [],
            },
        ]);
    };

    const handleRemovePekerjaan = (id: string) => {
        if (pekerjaanList.length === 1) {
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
                    if (field === "assignment_type" && value === "manual") {
                        const manualAssignments = p.karyawan_ids.map((kid) => ({
                            id_karyawan: kid,
                            unit: 0,
                        }));
                        return { ...p, [field]: value, manual_assignments: manualAssignments };
                    }
                    return { ...p, [field]: value };
                }
                return p;
            })
        );

        if (errors[id]?.[field as keyof FormErrors]) {
            setErrors({
                ...errors,
                [id]: {
                    ...errors[id],
                    [field]: undefined,
                },
            });
        }
    };

    const handleKaryawanToggle = (pekerjaanId: string, karyawanId: number) => {
        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    const isSelected = p.karyawan_ids.includes(karyawanId);
                    const newKaryawanIds = isSelected
                        ? p.karyawan_ids.filter((id) => id !== karyawanId)
                        : [...p.karyawan_ids, karyawanId];

                    if (p.assignment_type === "manual") {
                        const newManualAssignments = isSelected
                            ? p.manual_assignments.filter(
                                (ma) => ma.id_karyawan !== karyawanId
                            )
                            : [...p.manual_assignments, { id_karyawan: karyawanId, unit: 0 }];

                        return {
                            ...p,
                            karyawan_ids: newKaryawanIds,
                            manual_assignments: newManualAssignments,
                        };
                    }

                    return {
                        ...p,
                        karyawan_ids: newKaryawanIds,
                    };
                }
                return p;
            })
        );

        if (errors[pekerjaanId]?.karyawan_ids) {
            setErrors({
                ...errors,
                [pekerjaanId]: {
                    ...errors[pekerjaanId],
                    karyawan_ids: undefined,
                },
            });
        }
    };

    const handleManualUnitChange = (
        pekerjaanId: string,
        karyawanId: number,
        value: string
    ) => {
        const numValue = value === '' ? 0 : parseInt(value.replace(/\D/g, '')) || 0;

        setPekerjaanList(
            pekerjaanList.map((p) => {
                if (p.id === pekerjaanId) {
                    const newManualAssignments = p.manual_assignments.map((ma) =>
                        ma.id_karyawan === karyawanId
                            ? { ...ma, unit: numValue }
                            : ma
                    );
                    return { ...p, manual_assignments: newManualAssignments };
                }
                return p;
            })
        );

        if (errors[pekerjaanId]?.manual_assignments) {
            setErrors({
                ...errors,
                [pekerjaanId]: {
                    ...errors[pekerjaanId],
                    manual_assignments: undefined,
                },
            });
        }
    };

    const calculateUnitDistribution = (karyawanIds: number[]) => {
        const totalKaryawan = karyawanIds.length;
        if (totalKaryawan === 0) return [];

        const baseUnit = Math.floor(totalPola / totalKaryawan);
        const remainder = totalPola % totalKaryawan;

        return karyawanIds.map((id, index) => {
            const karyawan = karyawanList.find((k) => k.id_karyawan === id);
            return {
                id_karyawan: id,
                nama_karyawan: karyawan?.nama_karyawan || "-",
                unit: index === totalKaryawan - 1 ? baseUnit + remainder : baseUnit,
            };
        });
    };

    const getManualDistributionStatus = (pekerjaan: PekerjaanItem) => {
        const totalAssigned = pekerjaan.manual_assignments.reduce(
            (sum, ma) => sum + (ma.unit || 0),
            0
        );
        const diff = totalPola - totalAssigned;
        if (diff === 0) return { status: "valid", message: "Sesuai", color: "success" };
        if (diff > 0) return { status: "kurang", message: `Kurang ${diff} pola`, color: "warning" };
        return { status: "lebih", message: `Berlebih ${Math.abs(diff)} pola`, color: "danger" };
    };

    const getFilteredKaryawan = (pekerjaanId: string) => {
        const query = searchQueries[pekerjaanId]?.toLowerCase() || "";
        if (!query) return karyawanList;

        return karyawanList.filter((k) =>
            k.nama_karyawan.toLowerCase().includes(query)
        );
    };

    const getKaryawanByJenisUpah = (pekerjaanId: string, jenisUpah: "pola" | "harian") => {
        const filteredList = getFilteredKaryawan(pekerjaanId);
        return filteredList.filter((k) => k.jenis_upah === jenisUpah);
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

                const karyawanPolaCount = p.karyawan_ids.filter(kid => {
                    const karyawan = karyawanList.find(k => k.id_karyawan === kid);
                    return karyawan?.jenis_upah === "pola";
                }).length;

                if (karyawanPolaCount > 0) {
                    return sum + (upah * totalPola);
                }
            }
            return sum;
        }, 0);

        return { totalPekerjaan, totalUnit, totalUpah };
    };

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: FormErrors } = {};
        let hasError = false;

        pekerjaanList.forEach((p) => {
            const fieldErrors: FormErrors = {};

            if (!p.nama_pekerjaan.trim()) {
                fieldErrors.nama_pekerjaan = "Nama pekerjaan harus diisi";
                hasError = true;
            }

            const hasAtLeastOneUpah =
                (p.upah_per_unit && p.upah_per_unit.trim() !== "") ||
                (p.upah_harian && p.upah_harian.trim() !== "");

            if (!hasAtLeastOneUpah) {
                fieldErrors.upah = "Isi salah satu: Upah per Pola atau Upah Harian";
                hasError = true;
            }

            if (p.upah_per_unit && p.upah_per_unit.trim() !== "") {
                if (!/^[0-9]+$/.test(p.upah_per_unit)) {
                    fieldErrors.upah_per_unit = "Upah per pola harus angka";
                    hasError = true;
                } else if (parseFloat(p.upah_per_unit) <= 0) {
                    fieldErrors.upah_per_unit = "Upah per pola harus lebih dari 0";
                    hasError = true;
                }
            }

            if (p.upah_harian && p.upah_harian.trim() !== "") {
                if (!/^[0-9]+$/.test(p.upah_harian)) {
                    fieldErrors.upah_harian = "Upah harian harus angka";
                    hasError = true;
                } else if (parseFloat(p.upah_harian) <= 0) {
                    fieldErrors.upah_harian = "Upah harian harus lebih dari 0";
                    hasError = true;
                }
            }

            if (p.karyawan_ids.length === 0) {
                fieldErrors.karyawan_ids = "Pilih minimal 1 karyawan";
                hasError = true;
            }

            if (p.assignment_type === "manual") {
                const totalAssigned = p.manual_assignments.reduce(
                    (sum, ma) => sum + (ma.unit || 0),
                    0
                );
                const hasInvalidUnit = p.manual_assignments.some((ma) => !ma.unit || ma.unit <= 0);

                if (hasInvalidUnit) {
                    fieldErrors.manual_assignments = "Semua karyawan harus memiliki pola lebih dari 0";
                    hasError = true;
                } else {
                    const status = getManualDistributionStatus(p);
                    if (status.status !== "valid") {
                        const diff = totalPola - totalAssigned;
                        fieldErrors.manual_assignments = `Total pola harus ${totalPola}`;
                        hasError = true;
                    }
                }
            }

            const karyawanPola = p.karyawan_ids.filter(kid => {
                const karyawan = karyawanList.find(k => k.id_karyawan === kid);
                return karyawan?.jenis_upah === "pola";
            });

            const karyawanHarian = p.karyawan_ids.filter(kid => {
                const karyawan = karyawanList.find(k => k.id_karyawan === kid);
                return karyawan?.jenis_upah === "harian";
            });

            if (karyawanPola.length > 0 && (!p.upah_per_unit || p.upah_per_unit.trim() === "")) {
                fieldErrors.upah_per_unit = "Upah per pola wajib diisi karena ada karyawan dengan sistem upah pola";
                hasError = true;
            }

            if (karyawanHarian.length > 0 && (!p.upah_harian || p.upah_harian.trim() === "")) {
                fieldErrors.upah_harian = "Upah harian wajib diisi karena ada karyawan dengan sistem upah harian";
                hasError = true;
            }

            if (Object.keys(fieldErrors).length > 0) {
                newErrors[p.id] = fieldErrors;
            }
        });

        setErrors(newErrors);
        return !hasError;
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
            return;
        }

        const validPekerjaan = pekerjaanList.filter(
            (p) =>
                p.nama_pekerjaan.trim() !== "" &&
                (p.upah_per_unit || p.upah_harian) &&
                p.karyawan_ids.length > 0
        );

        if (validPekerjaan.length === 0) {
            addToast({
                title: "Minimal harus ada 1",
                description: `Harap lengkapi minimal 1 pekerjaan dengan nama, upah, dan karyawan`,
                color: "danger",
            });
            return;
        }

        setLoading(true);

        const payload = {
            id_produk: id,
            pekerjaan_list: validPekerjaan.map((p) => {
                if (p.assignment_type === "manual") {
                    return {
                        nama_pekerjaan: p.nama_pekerjaan,
                        upah_per_unit:
                            typeof p.upah_per_unit === "string"
                                ? parseFloat(p.upah_per_unit)
                                : p.upah_per_unit,
                        upah_harian:
                            typeof p.upah_harian === "string"
                                ? parseFloat(p.upah_harian)
                                : p.upah_harian,
                        tipe: "manual",
                        karyawan_assignments: p.manual_assignments.map((ma) => ({
                            id_karyawan: ma.id_karyawan,
                            target_unit: ma.unit,
                        })),
                    };
                } else {
                    return {
                        nama_pekerjaan: p.nama_pekerjaan,
                        upah_per_unit:
                            typeof p.upah_per_unit === "string"
                                ? parseFloat(p.upah_per_unit)
                                : p.upah_per_unit,
                        upah_harian:
                            typeof p.upah_harian === "string"
                                ? parseFloat(p.upah_harian)
                                : p.upah_harian,
                        tipe: 'sistem',
                        karyawan_ids: p.karyawan_ids,
                    };
                }
            }),
        };

        try {
            const response = await axios.post("/api/work-assignment", payload);

            if (response.data.success) {
                alert("Pekerjaan berhasil disimpan");
                router.push("/produksi");
            } else {
                addToast({
                    title: "Gagal menyimpan pekerjaan",
                    description: `Gagal menyimpan pekerjaan: ${response.data.message || ''}`,
                    color: "danger",
                });
            }
        } catch (error) {
            console.error("Error submitting:", error);
            if (axios.isAxiosError(error)) {
                addToast({
                    title: "Gagal menyimpan pekerjaan",
                    description: `Terjadi kesalahan saat menyimpan pekerjaan`,
                    color: "danger",
                });
            } else {
                addToast({
                    title: "Gagal menyimpan pekerjaan",
                    description: `Terjadi kesalahan saat menyimpan pekerjaan`,
                    color: "danger",
                });
            }
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Pengaturan Pekerjaan Karyawan
                    </h1>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800">
                            Daftar Pekerjaan
                        </h2>
                        <Button
                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                            onPress={handleAddPekerjaan}
                        >
                            <IconPlus size={18} />
                            Tambah Pekerjaan
                        </Button>
                    </div>

                    <div className="space-y-6">
                        {pekerjaanList.map((pekerjaan, index) => {
                            const filteredKaryawan = getFilteredKaryawan(pekerjaan.id);
                            const distributionStatus =
                                pekerjaan.assignment_type === "manual"
                                    ? getManualDistributionStatus(pekerjaan)
                                    : null;

                            return (
                                <Card key={pekerjaan.id} className="border border-gray-200">
                                    <CardBody className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-4">
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
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                            <Input
                                                type="text"
                                                label="Upah per Pola (Rp)"
                                                placeholder="Contoh: 2000"
                                                value={String(pekerjaan.upah_per_unit)}
                                                onChange={(e) =>
                                                    handlePekerjaanChange(
                                                        pekerjaan.id,
                                                        "upah_per_unit",
                                                        e.target.value
                                                    )
                                                }
                                                isInvalid={!!errors[pekerjaan.id]?.upah_per_unit}
                                                errorMessage={errors[pekerjaan.id]?.upah_per_unit}
                                            />

                                            <Input
                                                type="text"
                                                label="Upah per Hari (Rp)"
                                                placeholder="Contoh: 5000"
                                                value={String(pekerjaan.upah_harian)}
                                                onChange={(e) =>
                                                    handlePekerjaanChange(
                                                        pekerjaan.id,
                                                        "upah_harian",
                                                        e.target.value
                                                    )
                                                }
                                                isInvalid={!!errors[pekerjaan.id]?.upah_harian}
                                                errorMessage={errors[pekerjaan.id]?.upah_harian}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <RadioGroup
                                                label="Metode Pembagian Pola"
                                                orientation="horizontal"
                                                value={pekerjaan.assignment_type}
                                                onValueChange={(value) =>
                                                    handlePekerjaanChange(pekerjaan.id, "assignment_type", value)
                                                }
                                            >
                                                <Radio
                                                    value="sistem"
                                                    classNames={{
                                                        base: "focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none",
                                                        wrapper:
                                                            "border-gray-400 group-data-[selected=true]:border-gray-400",
                                                        control:
                                                            "group-data-[selected=true]:bg-teal-600 group-data-[selected=true]:border-teal-600",
                                                    }}
                                                >
                                                    Otomatis oleh Sistem
                                                </Radio>

                                                <Radio
                                                    value="manual"
                                                    classNames={{
                                                        base: "focus:outline-none focus:ring-0 data-[focus-visible=true]:outline-none",
                                                        wrapper:
                                                            "border-gray-400 group-data-[selected=true]:border-gray-400",
                                                        control:
                                                            "group-data-[selected=true]:bg-teal-600 group-data-[selected=true]:border-teal-600",
                                                    }}
                                                >
                                                    Input Manual
                                                </Radio>
                                            </RadioGroup>
                                        </div>

                                        <div>

                                            <div className="mb-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <label className="text-sm font-medium text-gray-700">
                                                        Pilih Karyawan
                                                    </label>
                                                    {pekerjaan.karyawan_ids.length > 0 && (
                                                        <Chip size="sm" className="bg-teal-600 text-white border border-teal-600" variant="flat">
                                                            {pekerjaan.karyawan_ids.length} dipilih
                                                        </Chip>
                                                    )}
                                                </div>

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

                                                <div className="mb-4">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                                                        Karyawan Upah Per Pola
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 mb-2 border border-gray-200 rounded-lg p-3">
                                                        {getKaryawanByJenisUpah(pekerjaan.id, "pola").length > 0 ? (
                                                            getKaryawanByJenisUpah(pekerjaan.id, "pola").map((karyawan) => {
                                                                const isSelected = pekerjaan.karyawan_ids.includes(
                                                                    karyawan.id_karyawan
                                                                );
                                                                return (
                                                                    <Button
                                                                        key={karyawan.id_karyawan}
                                                                        variant={isSelected ? "solid" : "bordered"}
                                                                        size="sm"
                                                                        className={
                                                                            isSelected
                                                                                ? "bg-teal-600 text-white border-teal-600"
                                                                                : "bg-white text-gray-700 border-gray-300 hover:border-teal-600"
                                                                        }
                                                                        onPress={() =>
                                                                            handleKaryawanToggle(pekerjaan.id, karyawan.id_karyawan)
                                                                        }
                                                                    >
                                                                        {karyawan.nama_karyawan}
                                                                    </Button>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-sm text-gray-500">
                                                                Tidak ada karyawan dengan upah per pola
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mb-2">
                                                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
                                                        Karyawan Upah Harian
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 mb-2 border border-gray-200 rounded-lg p-3">
                                                        {getKaryawanByJenisUpah(pekerjaan.id, "harian").length > 0 ? (
                                                            getKaryawanByJenisUpah(pekerjaan.id, "harian").map((karyawan) => {
                                                                const isSelected = pekerjaan.karyawan_ids.includes(
                                                                    karyawan.id_karyawan
                                                                );
                                                                return (
                                                                    <Button
                                                                        key={karyawan.id_karyawan}
                                                                        variant={isSelected ? "solid" : "bordered"}
                                                                        size="sm"
                                                                        className={
                                                                            isSelected
                                                                                ? "bg-teal-600 text-white border-teal-600"
                                                                                : "bg-white text-gray-700 border-gray-300 hover:border-teal-600"
                                                                        }
                                                                        onPress={() =>
                                                                            handleKaryawanToggle(pekerjaan.id, karyawan.id_karyawan)
                                                                        }
                                                                    >
                                                                        {karyawan.nama_karyawan}
                                                                    </Button>
                                                                );
                                                            })
                                                        ) : (
                                                            <p className="text-sm text-gray-500">
                                                                Tidak ada karyawan dengan upah harian
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {errors[pekerjaan.id]?.karyawan_ids && (
                                                    <p className="text-sm text-danger mt-1">
                                                        {errors[pekerjaan.id]?.karyawan_ids}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {pekerjaan.assignment_type === "manual" &&
                                            pekerjaan.karyawan_ids.length > 0 && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <label className="text-sm font-medium text-gray-700">
                                                            Pembagian Pola Manual
                                                        </label>
                                                        {distributionStatus && (
                                                            <Chip
                                                                color={
                                                                    distributionStatus.color as
                                                                    | "success"
                                                                    | "warning"
                                                                    | "danger"
                                                                }
                                                                variant="flat"
                                                            >
                                                                {distributionStatus.message}
                                                            </Chip>
                                                        )}
                                                    </div>

                                                    <div className="space-y-2 mb-4">
                                                        {pekerjaan.manual_assignments.map((ma) => {
                                                            const karyawan = karyawanList.find(
                                                                (k) => k.id_karyawan === ma.id_karyawan
                                                            );
                                                            return (
                                                                <div
                                                                    key={ma.id_karyawan}
                                                                    className="flex items-center gap-3"
                                                                >
                                                                    <span className="text-sm text-gray-700 flex-1">
                                                                        {karyawan?.nama_karyawan}
                                                                    </span>
                                                                    <Input
                                                                        type="text"
                                                                        size="sm"
                                                                        placeholder="Pola"
                                                                        value={String(ma.unit)}
                                                                        onChange={(e) =>
                                                                            handleManualUnitChange(
                                                                                pekerjaan.id,
                                                                                ma.id_karyawan,
                                                                                e.target.value
                                                                            )
                                                                        }
                                                                        className="w-32"
                                                                        min={0}
                                                                    />
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {pekerjaan.upah_per_unit && (
                                                        <div className="bg-gray-50 rounded-lg p-4">
                                                            <div className="flex justify-between items-center text-sm">
                                                                <span className="text-gray-600">
                                                                    Karyawan Terpilih:{" "}
                                                                    <strong>
                                                                        {pekerjaan.karyawan_ids.length} karyawan
                                                                    </strong>
                                                                </span>
                                                                <span className="text-gray-600">
                                                                    Total Upah per Pola:{" "}
                                                                    <strong>
                                                                        Rp{" "}
                                                                        {(
                                                                            (typeof pekerjaan.upah_per_unit === "string"
                                                                                ? parseFloat(pekerjaan.upah_per_unit)
                                                                                : pekerjaan.upah_per_unit) *
                                                                            pekerjaan.manual_assignments.reduce(
                                                                                (sum, ma) => sum + ma.unit,
                                                                                0
                                                                            )
                                                                        ).toLocaleString("id-ID")}
                                                                    </strong>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {errors[pekerjaan.id]?.manual_assignments && (
                                                        <p className="text-sm text-danger mt-2">
                                                            {errors[pekerjaan.id]?.manual_assignments}
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                        {pekerjaan.assignment_type === "sistem" &&
                                            pekerjaan.karyawan_ids.length > 0 &&
                                            pekerjaan.upah_per_unit && (
                                                <div className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex justify-between items-center text-sm mb-2">
                                                        <span className="text-gray-600">
                                                            Karyawan Terpilih:{" "}
                                                            <strong>
                                                                {pekerjaan.karyawan_ids.length} karyawan
                                                            </strong>
                                                        </span>
                                                        <span className="text-gray-600">
                                                            Pola per Pekerja:{" "}
                                                            <strong>
                                                                {(() => {
                                                                    const total = totalPola;
                                                                    const k = pekerjaan.karyawan_ids.length;
                                                                    const base = Math.floor(total / k);
                                                                    const remainder = total % k;

                                                                    return remainder === 0
                                                                        ? `${base} pola`
                                                                        : `${base}-${base + remainder} pola`;
                                                                })()}
                                                            </strong>
                                                        </span>
                                                        <span className="text-gray-600">
                                                            Total Upah per Pola:{" "}
                                                            <strong>
                                                                Rp{" "}
                                                                {(
                                                                    (typeof pekerjaan.upah_per_unit === "string"
                                                                        ? parseFloat(pekerjaan.upah_per_unit)
                                                                        : pekerjaan.upah_per_unit) * totalPola
                                                                ).toLocaleString("id-ID")}
                                                            </strong>
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                        {pekerjaanList.length > 1 && (
                                            <Button
                                                color="danger"
                                                variant="light"
                                                startContent={<IconTrash size={18} />}
                                                onPress={() => handleRemovePekerjaan(pekerjaan.id)}
                                                className="mt-4"
                                            >
                                                Hapus Pekerjaan
                                            </Button>
                                        )}
                                    </CardBody>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">
                        Kesimpulan
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                {stats.totalPekerjaan}
                            </div>
                            <div className="text-sm text-gray-600">Total Pekerjaan</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                {stats.totalUnit}
                            </div>
                            <div className="text-sm text-gray-600">Total Pola</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                            <div className="text-3xl font-bold text-gray-900 mb-1">
                                Rp {stats.totalUpah.toLocaleString("id-ID")}
                            </div>
                            <div className="text-sm text-gray-600">Total Upah per Pola</div>
                        </div>
                    </div>

                    {pekerjaanList.map((pekerjaan) => {
                        if (
                            !pekerjaan.nama_pekerjaan.trim() ||
                            pekerjaan.karyawan_ids.length === 0
                        )
                            return null;

                        const distribution =
                            pekerjaan.assignment_type === "sistem"
                                ? calculateUnitDistribution(pekerjaan.karyawan_ids)
                                : pekerjaan.manual_assignments.map((ma) => {
                                    const karyawan = karyawanList.find(
                                        (k) => k.id_karyawan === ma.id_karyawan
                                    );
                                    return {
                                        id_karyawan: ma.id_karyawan,
                                        nama_karyawan: karyawan?.nama_karyawan || "-",
                                        unit: ma.unit,
                                    };
                                });

                        return (
                            <div key={pekerjaan.id} className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-3">
                                    {pekerjaan.nama_pekerjaan}
                                </h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                                    NO
                                                </th>
                                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">
                                                    NAMA KARYAWAN
                                                </th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                                                    TOTAL POLA
                                                </th>
                                                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">
                                                    TOTAL UPAH
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {distribution.map((item, idx) => {
                                                const karyawan = karyawanList.find(
                                                    (k) => k.id_karyawan === item.id_karyawan
                                                );
                                                const isUpahPola = karyawan?.jenis_upah === "pola";
                                                const totalUpah = isUpahPola
                                                    ? item.unit * (typeof pekerjaan.upah_per_unit === "string"
                                                        ? parseFloat(pekerjaan.upah_per_unit)
                                                        : pekerjaan.upah_per_unit)
                                                    : 0;

                                                return (
                                                    <tr key={item.id_karyawan}>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {idx + 1}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            {item.nama_karyawan}
                                                            <Chip
                                                                size="sm"
                                                                className={`ml-2 ${isUpahPola ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}
                                                                variant="flat"
                                                            >
                                                                {isUpahPola ? 'Per Pola' : 'Harian'}
                                                            </Chip>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                                            {item.unit}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 text-right">
                                                            {isUpahPola
                                                                ? `Rp ${totalUpah.toLocaleString("id-ID")}`
                                                                : "-"
                                                            }
                                                        </td>
                                                    </tr>
                                                );
                                            })}
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