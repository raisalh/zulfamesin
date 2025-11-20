"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { IconArrowLeft, IconUser, IconDownload } from "@tabler/icons-react";
import { toast } from "sonner";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Karyawan {
    id_karyawan: number;
    nama_karyawan: string;
}

interface Produk {
    id_produk: number;
    nama_produk: string;
    warna: string;
    ukuran: string;
    status: "selesai" | "diproses" | null;
}

interface PekerjaanDetail {
    id_pekerjaan_karyawan: number;
    nama_pekerjaan: string;
    unit_dikerjakan: number;
    upah_per_unit: number;
    target_unit: number | null;
}

interface Ringkasan {
    total_kategori: number;
    total_unit: number;
    total_upah: number;
}

export default function DetailInformasiUpahKaryawan() {
    const params = useParams();
    const router = useRouter();
    const [karyawan, setKaryawan] = useState<Karyawan | null>(null);
    const [produk, setProduk] = useState<Produk | null>(null);
    const [pekerjaanList, setPekerjaanList] = useState<PekerjaanDetail[]>([]);
    const [ringkasan, setRingkasan] = useState<Ringkasan | null>(null);
    const [statusPembayaran, setStatusPembayaran] = useState<string>("belum");
    const [loading, setLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        fetchData();
    }, [params.id, params.id_produk]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `/api/employee/${params.id}/works/${params.id_produk}`
            );

            if (response.data.success) {
                setKaryawan(response.data.data.karyawan);
                setProduk(response.data.data.produk);
                setPekerjaanList(response.data.data.pekerjaan_list);
                setRingkasan(response.data.data.ringkasan);
                setStatusPembayaran(response.data.data.status_pembayaran);
            } else {
                toast.error("Gagal memuat data", {
                    description: response.data.message || "Terjadi kesalahan saat mengambil data"
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Gagal memuat data", {
                description: "Terjadi kesalahan saat mengambil data karyawan"
            });
        } finally {
            setLoading(false);
        }
    };

    const formatRupiah = (amount: number): string => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleExport = async () => {
        if (!karyawan || !produk || pekerjaanList.length === 0) {
            toast.error("Data tidak lengkap", {
                description: "Tidak dapat mengekspor PDF karena data belum tersedia"
            });
            return;
        }

        try {
            setIsExporting(true);
            toast.info("Membuat PDF...", {
                description: "Mohon tunggu sebentar"
            });

            const doc = new jsPDF();
            
            doc.setFont("helvetica");
            
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("LAPORAN UPAH KARYAWAN", 105, 20, { align: "center" });
            
            doc.setLineWidth(0.5);
            doc.line(20, 25, 190, 25);
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "normal");
            
            let yPos = 35;
            doc.setFont("helvetica", "bold");
            doc.text("Nama Karyawan:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(karyawan.nama_karyawan, 65, yPos);
            
            yPos += 7;
            doc.setFont("helvetica", "bold");
            doc.text("Nama Produk:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(produk.nama_produk, 65, yPos);
            
            yPos += 7;
            doc.setFont("helvetica", "bold");
            doc.text("Warna:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(produk.warna, 65, yPos);
            
            yPos += 7;
            doc.setFont("helvetica", "bold");
            doc.text("Ukuran:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(produk.ukuran, 65, yPos);
            
            yPos += 7;
            doc.setFont("helvetica", "bold");
            doc.text("Status Pembayaran:", 20, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(statusPembayaran === "dibayar" ? "Sudah Dibayar" : "Belum Dibayar", 65, yPos);
            
            const tableData = pekerjaanList.map((pekerjaan, index) => [
                (index + 1).toString(),
                pekerjaan.nama_pekerjaan,
                pekerjaan.unit_dikerjakan.toString(),
                formatRupiah(pekerjaan.upah_per_unit),
                formatRupiah(pekerjaan.unit_dikerjakan * pekerjaan.upah_per_unit)
            ]);
            
            autoTable(doc, {
                startY: yPos + 10,
                head: [["No", "Nama Pekerjaan", "Unit Dikerjakan", "Upah per Unit", "Total Upah"]],
                body: tableData,
                theme: "grid",
                headStyles: {
                    fillColor: [22, 160, 133],
                    textColor: 255,
                    fontStyle: "bold",
                    halign: "center",
                    lineWidth: 0.3,             
                    lineColor: [255, 255, 255],
                },
                columnStyles: {
                    0: { halign: "center", cellWidth: 15 },
                    1: { halign: "left", cellWidth: 60 },
                    2: { halign: "center", cellWidth: 30 },
                    3: { halign: "right", cellWidth: 35 },
                    4: { halign: "right", cellWidth: 40 }
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 5
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                }
            });
            
            const finalY = (doc as any).lastAutoTable.finalY || yPos + 60;
            
            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");
            
            const summaryY = finalY + 15;
            doc.text("RINGKASAN", 20, summaryY);
            
            doc.setFont("helvetica", "normal");
            doc.text("Total Pekerjaan:", 20, summaryY + 8);
            doc.text(`${ringkasan?.total_kategori || 0} Kategori`, 140, summaryY + 8, { align: "right" });
            
            doc.text("Total Unit Dikerjakan:", 20, summaryY + 15);
            doc.text(`${ringkasan?.total_unit || 0} Unit`, 140, summaryY + 15, { align: "right" });
            
            doc.setLineWidth(0.3);
            doc.line(20, summaryY + 20, 140, summaryY + 20);
            
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("TOTAL UPAH:", 20, summaryY + 27);
            doc.text(formatRupiah(ringkasan?.total_upah || 0), 140, summaryY + 27, { align: "right" });
            
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.text(
                `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                })}`,
                105,
                pageHeight - 15,
                { align: "center" }
            );
            
            const fileName = `${karyawan.nama_karyawan.replace(/\s+/g, "_")}-${produk.nama_produk.replace(/\s+/g, "_")}.pdf`;
            
            doc.save(fileName);
            
            toast.success("PDF berhasil diunduh", {
                description: `File ${fileName} telah tersimpan`
            });
        } catch (error) {
            console.error("Error exporting PDF:", error);
            toast.error("Gagal membuat PDF", {
                description: "Terjadi kesalahan saat membuat dokumen PDF"
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (produk?.status !== "selesai") {
            toast.warning("Tidak dapat mengubah status", {
                description: "Pembayaran hanya bisa diubah jika produk sudah selesai"
            });
            return;
        }

        try {
            const response = await axios.put(
                `/api/employee/${params.id}/works/${params.id_produk}`,
                { status_pembayaran: newStatus }
            );

            if (response.data.success) {
                setStatusPembayaran(newStatus);
                toast.success("Status berhasil diubah", {
                    description: `Status pembayaran telah diubah menjadi ${newStatus === "dibayar" ? "Sudah Dibayar" : "Belum Dibayar"}`
                });
            } else {
                toast.error("Gagal mengubah status", {
                    description: response.data.message || "Terjadi kesalahan"
                });
            }
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Gagal mengubah status", {
                description: "Terjadi kesalahan saat mengubah status pembayaran"
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        );
    }

    if (!karyawan || !produk) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600">Data tidak ditemukan</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-3 md:p-6">
            <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            aria-label="Kembali"
                        >
                            <IconArrowLeft size={20} />
                        </button>

                        <h1 className="text-xl font-semibold text-gray-800">
                            Detail Informasi Upah Karyawan
                        </h1>
                    </div>

                    <button
                        onClick={handleExport}
                        disabled={isExporting}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                            isExporting
                                ? "bg-gray-400 cursor-not-allowed"
                                : "bg-gray-900 hover:bg-gray-800 text-white"
                        }`}
                    >
                        <IconDownload size={18} />
                        {isExporting ? "Mengekspor..." : "Export"}
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <IconUser size={24} className="text-gray-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {karyawan.nama_karyawan}
                            </h2>
                            <p className="text-sm text-gray-600">
                                Produk: {produk.nama_produk} ({produk.ukuran}) - {produk.warna}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Rincian Pekerjaan & Upah
                            </h3>

                            <div className="space-y-4">
                                {pekerjaanList.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8">
                                        Tidak ada data pekerjaan
                                    </p>
                                ) : (
                                    pekerjaanList.map((pekerjaan) => (
                                        <div
                                            key={pekerjaan.id_pekerjaan_karyawan}
                                            className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4 pb-4 border-b last:border-b-0"
                                        >
                                            <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                                                <IconUser size={20} className="text-gray-600" />
                                            </div>

                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">
                                                    {pekerjaan.nama_pekerjaan}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {pekerjaan.unit_dikerjakan} buah × {formatRupiah(pekerjaan.upah_per_unit)}
                                                </p>
                                            </div>

                                            <div className="text-left md:text-right">
                                                <p className="font-semibold text-gray-900">
                                                    {formatRupiah(pekerjaan.unit_dikerjakan * pekerjaan.upah_per_unit)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Ringkasan Upah
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Pekerjaan</span>
                                    <span className="font-semibold text-gray-900">
                                        {ringkasan?.total_kategori || 0} Kategori
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total Unit Dikerjakan</span>
                                    <span className="font-semibold text-gray-900">
                                        {ringkasan?.total_unit || 0} Unit
                                    </span>
                                </div>
                                <div className="pt-3 border-t">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-semibold text-gray-900">
                                            Total Upah
                                        </span>
                                        <span className="text-xl font-bold text-gray-900">
                                            {formatRupiah(ringkasan?.total_upah || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                                Status Pembayaran
                            </h3>

                            <select
                                value={statusPembayaran}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                disabled={produk?.status !== "selesai"}
                                className={`w-full px-3 py-2 md:px-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                                    produk?.status !== "selesai"
                                        ? "bg-gray-100 cursor-not-allowed text-gray-500"
                                        : "bg-white"
                                }`}
                            >
                                <option value="dibayar">Dibayar</option>
                                <option value="belum">Belum</option>
                            </select>

                            {produk?.status !== "selesai" && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <span>⚠️</span>
                                    <span>Status pembayaran hanya dapat diubah setelah produk selesai</span>
                                </p>
                            )}

                            {statusPembayaran === "dibayar" && (
                                <div className="mt-3">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                        ✓ Sudah Dibayar
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}