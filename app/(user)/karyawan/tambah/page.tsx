"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2, IconAlertTriangle, IconPlus } from "@tabler/icons-react";
import { no } from "zod/v4/locales";

interface FormErrors {
  namaKaryawan?: string;
  jenisKelamin?: string;
  noTelp?: string;
  email?: string;
  alamat?: string;
}

export default function TambahKaryawanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [namaKaryawan, setNamaKaryawan] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState("");
  const [noTelp, setNoTelp] = useState("");
  const [email, setEmail] = useState("");
  const [alamat, setAlamat] = useState("");

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validasi Nama Karyawan
    if (!namaKaryawan.trim()) {
      newErrors.namaKaryawan = "Nama karyawan harus diisi";
    } else if (namaKaryawan.trim().length < 3) {
      newErrors.namaKaryawan = "Nama karyawan minimal 3 huruf";
    } else if (!/^[a-zA-Z\s]+$/.test(namaKaryawan.trim())) {
      newErrors.namaKaryawan = "Nama karyawan hanya boleh berisi huruf";
    }

    // Validasi Jenis Kelamin
    if (!jenisKelamin) {
      newErrors.jenisKelamin = "Jenis kelamin harus dipilih";
    }

    // Validasi Nomor Telepon
    if (noTelp.trim() !== "") {
      if (!/^[0-9]+$/.test(noTelp)) {
        newErrors.noTelp = "Nomor telepon hanya boleh berisi angka";
      } else if (noTelp.length < 10) {
        newErrors.noTelp = "Nomor telepon minimal 10 digit";
      }
    }

    // Validasi Email
    if (email.trim() !== "") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = "Format email tidak valid";
      } else if (!/(gmail\.com|yahoo\.com|outlook\.com|hotmail\.com|[\w.-]+\.\w{2,})$/.test(email)) {
        newErrors.email = "Email harus mengandung domain valid seperti @gmail.com";
      }
    }

    // Validasi Alamat
    if (alamat.trim() !== "") {
      if (alamat.trim().split(/\s+/).length < 5) {
        newErrors.alamat = "Alamat harus minimal 5 kata";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      const newErrors = { ...errors };

      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
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
          jenis_kelamin: jenisKelamin,
          no_telp: noTelp || null,
          email: email || null,
          alamat: alamat || null,
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
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Informasi Karyawan
            </h3>
            <p className="text-sm text-red-600">
              * Wajib diisi
            </p>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="namaKaryawan"
              >
                Nama Karyawan <span className="text-red-500">*</span>
              </label>
              <input
                className={`w-full px-4 py-3 border ${errors.namaKaryawan ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                id="namaKaryawan"
                placeholder="Masukkan nama karyawan"
                type="text"
                value={namaKaryawan}
                onChange={(e) => {
                  setNamaKaryawan(e.target.value);
                  clearError("namaKaryawan");
                }}
              />
              {errors.namaKaryawan && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.namaKaryawan}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="jenisKelamin"
              >
                Jenis Kelamin <span className="text-red-500">*</span>
              </label>
              <select
                className={`w-full px-4 py-3 border ${errors.jenisKelamin ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none text-sm`}
                id="jenisKelamin"
                value={jenisKelamin}
                onChange={(e) => {
                  setJenisKelamin(e.target.value);
                  clearError("jenisKelamin");
                }}
              >
                <option value="">Pilih Jenis Kelamin</option>
                <option value="perempuan">Perempuan</option>
                <option value="laki-laki">Laki-Laki</option>
              </select>
              {errors.jenisKelamin && (
                <p className="text-red-500 text-sm mt-1">{errors.jenisKelamin}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="noTelp"
              >
                Nomor Telepon
              </label>
              <input
                className={`w-full px-4 py-3 border border-gray-300
                  rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                id="noTelp"
                placeholder="Masukkan nomor telepon karyawan"
                type="text"
                value={noTelp}
                onChange={(e) => {
                  setNoTelp(e.target.value);
                  clearError("noTelp");
                }}
              />
              {errors.noTelp && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.noTelp}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className={`w-full px-4 py-3 border border-gray-300
                  rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                id="email"
                placeholder="Masukkan email karyawan"
                type="text"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-2"
                htmlFor="alamat"
              >
                Alamat
              </label>
              <input
                className={`w-full px-4 py-3 border border-gray-300
                  rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                id="alamat"
                placeholder="Masukkan alamat karyawan"
                type="text"
                value={alamat}
                onChange={(e) => {
                  setAlamat(e.target.value);
                  clearError("alamat");
                }}
              />
              {errors.alamat && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.alamat}
                </p>
              )}
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
