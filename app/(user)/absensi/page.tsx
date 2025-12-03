"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import { addToast, Button, Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Chip, Divider, Spinner } from "@heroui/react";
import { IconChevronLeft, IconChevronRight, IconCalendar, IconUser, IconBriefcase, IconUsers, IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";
import type { AbsensiData } from "@/types/absensi";

const BULAN_INDONESIA = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
];

const HARI_MINGGU = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function AbsensiPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [absensiData, setAbsensiData] = useState<AbsensiData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchAbsensiData();
    }, [currentDate]);

    const fetchAbsensiData = async () => {
        try {
            setLoading(true);
            const month = currentDate.getMonth() + 1;
            const year = currentDate.getFullYear();

            const response = await axios.get(
                `/api/absensi?month=${month}&year=${year}`
            );

            if (response.data.success) {
                setAbsensiData(response.data.data);
            } else {
                addToast({
                    title: "Gagal Memuat Data",
                    description: response.data.message || "Gagal mengambil data absensi",
                    icon: <IconAlertCircle className="h-5 w-5" />,
                });
            }
        } catch (error) {
            console.error("Error fetching absensi:", error);
            if (axios.isAxiosError(error)) {
                addToast({
                    title: "Error",
                    description: error.response?.data?.message || "Gagal mengambil data absensi",
                    icon: <IconAlertCircle className="h-5 w-5" />,
                });
            } else {
                addToast({
                    title: "Error",
                    description: "Terjadi kesalahan saat mengambil data",
                    icon: <IconAlertCircle className="h-5 w-5" />,
                });
            }
        } finally {
            setLoading(false);
        }
    };

    const navigateMonth = (direction: "prev" | "next") => {
        const newDate = new Date(currentDate);
        if (direction === "prev") {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToCurrentMonth = () => {
        setCurrentDate(new Date());
    };

    const handleDateClick = (dateString: string) => {
        setSelectedDate(dateString);
        setIsModalOpen(true);
    };

    const getCalendarDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const days: Date[] = [];
        const currentDay = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            days.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }

        return days;
    };

    const formatDate = (date: Date): string => {
        return date.toISOString().split("T")[0];
    };

    const isCurrentMonth = (date: Date): boolean => {
        return date.getMonth() === currentDate.getMonth();
    };

    const isToday = (date: Date): boolean => {
        const today = new Date();
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        );
    };

    const getAttendanceCount = (date: Date): number => {
        if (!absensiData) return 0;
        const dateString = formatDate(date);
        return absensiData.summary[dateString] || 0;
    };

    const selectedDateDetails = selectedDate
        ? absensiData?.details[selectedDate] || []
        : [];

    const calendarDays = getCalendarDays();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Spinner size="lg" color="primary" />
                    <p className="mt-4 text-gray-600">Memuat data absensi...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
            <div className="max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.back()}
                                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    <IconArrowLeft size={24} />
                                </button>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                    Absensi Karyawan
                                </h1>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                                Monitoring kehadiran berdasarkan progress pekerjaan
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onClick={() => navigateMonth("prev")}
                                >
                                    <IconChevronLeft className="h-5 w-5" />
                                </Button>

                                <div className="px-3 text-center min-w-[140px]">
                                    <div className="font-semibold text-gray-900">
                                        {BULAN_INDONESIA[currentDate.getMonth()]}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {currentDate.getFullYear()}
                                    </div>
                                </div>

                                <Button
                                    isIconOnly
                                    size="sm"
                                    variant="light"
                                    onClick={() => navigateMonth("next")}
                                >
                                    <IconChevronRight className="h-5 w-5" />
                                </Button>
                            </div>

                            <Button
                                color="primary"
                                variant="flat"
                                size="sm"
                                startContent={<IconCalendar className="h-4 w-4" />}
                                onClick={goToCurrentMonth}
                            >
                                Bulan Ini
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardBody className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-blue-100 p-3 rounded-lg">
                                    <IconUsers className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Karyawan Aktif</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {absensiData?.total_karyawan || 0}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <IconCalendar className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Hari Kerja</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Object.keys(absensiData?.summary || {}).length}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="bg-purple-100 p-3 rounded-lg">
                                    <IconBriefcase className="h-6 w-6 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Kehadiran</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {Object.values(absensiData?.summary || {}).reduce(
                                            (a, b) => a + b,
                                            0
                                        )}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <Card>
                    <CardBody className="p-4 sm:p-6">
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {HARI_MINGGU.map((hari) => (
                                <div
                                    key={hari}
                                    className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2"
                                >
                                    {hari}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                            {calendarDays.map((date, index) => {
                                const dateString = formatDate(date);
                                const attendanceCount = getAttendanceCount(date);
                                const isCurrentMonthDate = isCurrentMonth(date);
                                const isTodayDate = isToday(date);
                                const hasAttendance = attendanceCount > 0;

                                return (
                                    <button
                                        key={index}
                                        onClick={() =>
                                            hasAttendance && handleDateClick(dateString)
                                        }
                                        disabled={!hasAttendance}
                                        className={`relative aspect-square rounded-lg border-2 p-1 sm:p-2 transition-all text-[10px] sm:text-sm 
                                            ${!isCurrentMonthDate
                                                ? "bg-gray-50 text-gray-400 border-gray-200"
                                                : isTodayDate
                                                    ? "bg-blue-50 border-blue-500"
                                                    : "bg-white border-gray-200"
                                            }
                                            ${hasAttendance
                                                ? "hover:border-green-400 hover:shadow-md cursor-pointer"
                                                : "cursor-not-allowed"
                                            }
                    `}
                                    >
                                        <div className="flex flex-col h-full justify-between">
                                            <span
                                                className={`text-[10px] sm:text-sm font-medium
                                                ${isTodayDate ? "text-blue-600" : ""}
                                                `}
                                            >
                                                {date.getDate()}
                                            </span>


                                            {hasAttendance && (
                                                <div className="mt-1">
                                                    <div className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 font-semibold">
                                                        {attendanceCount}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border-2 border-blue-500 bg-blue-50" />
                                <span className="text-gray-600">Hari Ini</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-green-500" />
                                <span className="text-gray-600">Ada Kehadiran</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border-2 border-gray-200 bg-gray-50" />
                                <span className="text-gray-600">Bulan Lain</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    size="2xl"
                    scrollBehavior="inside"
                    className="max-w-full sm:max-w-2xl"
                >
                    <ModalContent>
                        {(onClose) => (
                            <>
                                <ModalHeader className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <IconCalendar className="h-5 w-5 text-blue-600" />
                                        <span>Detail Kehadiran</span>
                                    </div>
                                    {selectedDate && (
                                        <p className="text-sm font-normal text-gray-600">
                                            {new Date(selectedDate).toLocaleDateString("id-ID", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                        </p>
                                    )}
                                </ModalHeader>

                                <ModalBody>
                                    {selectedDateDetails.length === 0 ? (
                                        <div className="text-center py-8 text-gray-500">
                                            <IconUsers className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                            <p>Tidak ada data kehadiran</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="bg-blue-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-600">
                                                    Total Karyawan Hadir:{" "}
                                                    <span className="font-bold text-blue-600">
                                                        {selectedDateDetails.length} orang
                                                    </span>
                                                </p>
                                            </div>

                                            {selectedDateDetails.map((karyawan) => (
                                                <Card key={karyawan.id_karyawan} className="border">
                                                    <CardBody className="p-4">
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="flex flex-wrap items-center gap-3">
                                                                <div className="bg-blue-100 p-2 rounded-lg">
                                                                    <IconUser className="h-5 w-5 text-blue-600" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900">
                                                                        {karyawan.nama_karyawan}
                                                                    </h4>
                                                                    <p className="text-xs text-gray-600">
                                                                        {karyawan.jenis_kelamin === "perempuan"
                                                                            ? "Perempuan"
                                                                            : "Laki-laki"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <Chip size="sm" color="success" variant="flat">
                                                                {karyawan.pekerjaan.length} Pekerjaan
                                                            </Chip>
                                                        </div>

                                                        <Divider className="my-3" />

                                                        <div className="space-y-2">
                                                            <p className="text-xs font-semibold text-gray-600 uppercase">
                                                                Pekerjaan yang Dilakukan:
                                                            </p>
                                                            {karyawan.pekerjaan.map((pekerjaan, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="bg-gray-50 rounded-lg p-3"
                                                                >
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <span className="font-medium text-gray-900 text-sm">
                                                                                    {pekerjaan.nama_produk}
                                                                                </span>
                                                                                <Chip
                                                                                    size="sm"
                                                                                    variant="flat"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {pekerjaan.warna}
                                                                                </Chip>
                                                                            </div>
                                                                            <p className="text-xs text-gray-600">
                                                                                {pekerjaan.nama_pekerjaan}
                                                                            </p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-sm font-semibold text-green-600">
                                                                                {pekerjaan.total_unit} unit
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {pekerjaan.jumlah_progress}x update
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </CardBody>
                                                </Card>
                                            ))}
                                        </div>
                                    )}
                                </ModalBody>

                                <ModalFooter>
                                    <Button color="primary" onPress={onClose}>
                                        Tutup
                                    </Button>
                                </ModalFooter>
                            </>
                        )}
                    </ModalContent>
                </Modal>
            </div>
        </div>
    );
}