"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconDotsVertical,
  IconEdit,
  IconEye,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { addToast } from "@heroui/react"; 

interface Karyawan {
  id_karyawan: number;
  nama_karyawan: string;
  jenis_kelamin: "perempuan" | "laki-laki" | null;
  no_telp: string | null;
  email: string | null;
  alamat: string | null;
  jenis_upah: "pola" | "harian" | null;
}

export default function KaryawanPage() {
  const router = useRouter();
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
      const res = await fetch(`/api/employee`);
      const data = await res.json();

      if (data.success) {
        setKaryawanList(data.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      addToast({
        title: "Gagal Memuat Data",
        description: "Terjadi kesalahan saat mengambil data karyawan",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) return;

    try {
      const res = await fetch(`/api/employee/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        addToast({
          title: "Berhasil Dihapus",
          description: "Karyawan berhasil dihapus dari sistem",
          color: "success",
        });
        fetchData();
      } else {
        addToast({
          title: "Tidak Dapat Menghapus Karyawan",
          description: data.message || "Gagal menghapus karyawan",
          color: "danger",
        });

        if (data.unpaid_count) {
          setTimeout(() => {
            addToast({
              title: "Informasi",
              description: `Karyawan memiliki ${data.unpaid_count} upah yang belum dibayar`,
              color: "warning",
            });
          }, 500);
        }

        if (data.active_task_count) {
          setTimeout(() => {
            addToast({
              title: "Informasi",
              description: `Karyawan masih memiliki ${data.active_task_count} pekerjaan yang aktif`,
              color: "warning",
            });
          }, 1000);
        }
      }
    } catch (error) {
      console.error("Error deleting:", error);
      addToast({
        title: "Terjadi Kesalahan",
        description: "Gagal menghapus karyawan. Silakan coba lagi",
        color: "danger",
      });
    }
    setOpenDropdown(null);
  };

  const toggleDropdown = (id: number) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-base md:text-lg font-semibold">Data Karyawan</h2>
          <button
            className="bg-teal-500 hover:bg-teal-600 text-white px-3 md:px-4 py-2 rounded-lg flex items-center gap-2 text-sm md:text-base w-full sm:w-auto justify-center"
            onClick={() => router.push("/karyawan/tambah")}
          >
            <IconPlus size={18} />
            Tambah Karyawan
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Aksi
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nama Karyawan
                  </th>
                  <th className="px-3 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Jenis Kelamin
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Jenis Upah
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Nomor Telepon
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Email
                  </th>
                  <th className="px-3 md:px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Alamat
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {karyawanList.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-center text-gray-500"
                      colSpan={7}
                    >
                      Tidak ada karyawan
                    </td>
                  </tr>
                ) : (
                  karyawanList.map((karyawan) => (
                    <tr key={karyawan.id_karyawan} className="hover:bg-gray-50">
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                        <div
                          ref={
                            openDropdown === karyawan.id_karyawan
                              ? dropdownRef
                              : null
                          }
                          className="relative"
                        >
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Menu"
                            onClick={() => toggleDropdown(karyawan.id_karyawan)}
                          >
                            <IconDotsVertical size={20} />
                          </button>

                          {openDropdown === karyawan.id_karyawan && (
                            <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 rounded-t-lg"
                                onClick={() => {
                                  router.push(
                                    `/karyawan/${karyawan.id_karyawan}/edit`,
                                  );
                                  setOpenDropdown(null);
                                }}
                              >
                                <IconEdit size={16} />
                                Edit Karyawan
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  router.push(
                                    `/karyawan/${karyawan.id_karyawan}/upah`,
                                  );
                                  setOpenDropdown(null);
                                }}
                              >
                                <IconEye size={16} />
                                Lihat Detail Upah
                              </button>
                              <button
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-b-lg"
                                onClick={() =>
                                  handleDelete(karyawan.id_karyawan)
                                }
                              >
                                <IconTrash size={16} />
                                Hapus Karyawan
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {karyawan.nama_karyawan}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-gray-900">
                        {karyawan.jenis_kelamin
                          ? karyawan.jenis_kelamin === "perempuan"
                            ? "Perempuan"
                            : "Laki-Laki"
                          : "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-gray-900">
                        {karyawan.jenis_upah
                          ? karyawan.jenis_upah === "pola"
                            ? "Upah per Pola"
                            : "Upah per Hari"
                          : "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-gray-900">
                        {karyawan.no_telp || "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-gray-900">
                        {karyawan.email || "-"}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-xs md:text-sm text-center text-gray-900">
                        {karyawan.alamat || "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}