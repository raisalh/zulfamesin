"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconClock,
  IconCircleCheck,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconEye,
  IconTrash,
} from "@tabler/icons-react";

interface Produksi {
  id_produk: number;
  nama_produk: string;
  warna: string;
  ukuran: string;
  gulungan: number;
  jumlah_pola: number;
  progress: number | null;
  deadline: string | null;
  status: "diproses" | "selesai" | null;
}

interface Stats {
  total: number;
  sedang_diproses: number;
  sudah_selesai: number;
}

export default function ProduksiPage() {
  const router = useRouter();
  const [produksiList, setProduksiList] = useState<Produksi[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    sedang_diproses: 0,
    sudah_selesai: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const produksiRes = await fetch(
        `/api/production?page=${currentPage}&limit=10`,
      );
      const produksiData = await produksiRes.json();

      if (produksiData.success) {
        setProduksiList(produksiData.data);
        setTotalPages(produksiData.totalPages);
      }

      const statsRes = await fetch("/api/production/stats");
      const statsData = await statsRes.json();

      if (statsData.success) {
        setStats(statsData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDeadlineText = (deadline: string | null) => {
    if (!deadline) return "0 Hari";

    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return `${diffDays} Hari`;
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const res = await fetch(`/api/production/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        alert("Produk berhasil dihapus");
        fetchData();
      } else {
        alert("Gagal menghapus produk");
      }
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Terjadi kesalahan");
    }
    setOpenDropdown(null);
  };

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm mb-1">
              Total Produk
            </p>
            <p className="text-2xl md:text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-gray-100 rounded-full p-3 md:p-4">
            <IconUsers className="text-gray-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm mb-1">
              Sedang Diproses
            </p>
            <p className="text-2xl md:text-3xl font-bold">
              {stats.sedang_diproses}
            </p>
          </div>
          <div className="bg-gray-100 rounded-full p-3 md:p-4">
            <IconClock className="text-gray-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs md:text-sm mb-1">
              Sudah Selesai
            </p>
            <p className="text-2xl md:text-3xl font-bold">
              {stats.sudah_selesai}
            </p>
          </div>
          <div className="bg-gray-100 rounded-full p-3 md:p-4">
            <IconCircleCheck className="text-gray-600" size={32} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base md:text-lg font-semibold">Data Produk</h2>
          <button
            className="bg-teal-500 hover:bg-teal-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
            onClick={() => router.push("/produksi/tambah")}
          >
            <IconPlus size={18} /> Tambah Produk
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Aksi
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Nama Produk
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Warna
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Ukuran
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Gulungan
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Jumlah Pola
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Progress
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Deadline
                    </th>
                    <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {produksiList.length === 0 ? (
                    <tr>
                      <td
                        className="px-6 py-8 text-center text-gray-500"
                        colSpan={9}
                      >
                        Tidak ada produk
                      </td>
                    </tr>
                  ) : (
                    produksiList.map((produk) => (
                      <tr key={produk.id_produk} className="hover:bg-gray-50">
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <div
                            ref={
                              openDropdown === produk.id_produk
                                ? dropdownRef
                                : null
                            }
                            className="relative"
                          >
                            <button
                              className="text-gray-600 hover:text-gray-900 p-1"
                              title="Menu"
                              onClick={() => toggleDropdown(produk.id_produk)}
                            >
                              <IconDotsVertical size={20} />
                            </button>

                            {openDropdown === produk.id_produk && (
                              <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                                  onClick={() => {
                                    router.push(
                                      `/produksi/${produk.id_produk}/edit`,
                                    );
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <IconEdit size={16} /> Edit Produksi
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                  onClick={() => {
                                    router.push(
                                      `/produksi/${produk.id_produk}/tambah-pekerjaan`,
                                    );
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <IconPlus size={16} /> Tambah Pekerjaan
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-b-lg"
                                  onClick={() => {
                                    router.push(
                                      `/produksi/${produk.id_produk}/progress`,
                                    );
                                    setOpenDropdown(null);
                                  }}
                                >
                                  <IconEye size={16} /> Lihat Progress
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                  onClick={() => handleDelete(produk.id_produk)}
                                >
                                  <IconTrash size={16} />
                                  Hapus Produk
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.nama_produk}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.warna}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.ukuran}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.gulungan}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.jumlah_pola}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.progress || 0}%
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                          {produk.deadline === null ? "-" : getDeadlineText(produk.deadline)}
                        </td>
                        <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                          <span
                            className={`px-2 md:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              produk.status === "selesai"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {produk.status === "selesai"
                              ? "Selesai"
                              : "Diproses"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs md:text-sm text-gray-700 text-center sm:text-left">
                {stats.total > 0 &&
                  `Menampilkan 1-10 dari ${stats.total} produk`}
              </div>
              <div className="flex gap-1 md:gap-2 flex-wrap justify-center">
                <button
                  className="px-2 md:px-3 py-1 border rounded text-xs md:text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === 1 || stats.total === 0}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Sebelumnya
                </button>
                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    className={`px-2 md:px-3 py-1 border rounded text-xs md:text-sm ${
                      currentPage === idx + 1
                        ? "bg-teal-500 text-white"
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => setCurrentPage(idx + 1)}
                  >
                    {idx + 1}
                  </button>
                ))}
                <button
                  className="px-2 md:px-3 py-1 border rounded text-xs md:text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={currentPage === totalPages || stats.total === 0}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
