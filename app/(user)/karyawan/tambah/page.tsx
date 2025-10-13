"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconAlertTriangle, IconPlus } from "@tabler/icons-react";

export default function TambahKaryawanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [namaKaryawan, setNamaKaryawan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaKaryawan) {
      alert("Nama karyawan harus diisi");

      return;
    }

    if (!jenisKelamin) {
      alert("Jenis kelamin harus dipilih");

      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/employee", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_karyawan: namaKaryawan,
          jenis_kelamin: jenisKelamin || null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Karyawan berhasil ditambahkan!");
        router.push("/karyawan");
      } else {
        alert("Gagal menambahkan karyawan: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat menambahkan karyawan");
    } finally {
      setLoading(false);
    }
  };

  const handleBatal = () => setShowCancelModal(true);
  const confirmBatal = () => router.push("/karyawan");
  const cancelBatal = () => setShowCancelModal(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tambah Karyawan Baru
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Masukkan informasi karyawan
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            <h3 className="text-sm font-bold text-gray-900 mb-5">
              Informasi Karyawan
            </h3>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="namaKaryawan"
              >
                Nama Karyawan
              </label>
              <input
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                id="namaKaryawan"
                placeholder="Masukkan nama karyawan"
                type="text"
                value={namaKaryawan}
                onChange={(e) => setNamaKaryawan(e.target.value)}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="jenisKelamin"
              >
                Jenis Kelamin
              </label>
              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                id="jenisKelamin"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value)}
              >
                <option value="">
                  Pilih Jenis Kelamin yang Sesuai Untuk Karyawan Ini
                </option>
                <option value="perempuan">Perempuan</option>
                <option value="laki-laki">Laki-Laki</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                disabled={loading}
                type="button"
                onClick={handleBatal}
              >
                Batal
              </button>

              <button
                className="px-6 py-2.5 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                disabled={loading}
                type="submit"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="animate-spin" size={18} />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <IconPlus size={18} />
                    Tambah Karyawan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
            <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <IconAlertTriangle className="text-gray-700" size={40} />
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              PERINGATAN
            </h3>
            <p className="text-gray-600 mb-2">
              Anda yakin ingin membatalkan proses menambah karyawan?
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Data yang Anda masukkan akan hilang!
            </p>

            <div className="flex gap-3 justify-center">
              <button
                className="px-8 py-3 border-2 border-gray-300 rounded-full text-gray-700 font-semibold hover:bg-gray-50 transition-colors min-w-[120px]"
                onClick={cancelBatal}
              >
                Kembali
              </button>
              <button
                className="px-8 py-3 bg-yellow-400 rounded-full text-gray-900 font-semibold hover:bg-yellow-500 transition-colors min-w-[120px]"
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
