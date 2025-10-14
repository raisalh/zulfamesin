"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  IconInfoCircle,
  IconAlertTriangle,
  IconLoader2,
} from "@tabler/icons-react";

interface PolaGulungan {
  gulungan: number;
  pola: string;
}

export default function EditProdukPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [status, setStatus] = useState("");
  const [namaProduk, setNamaProduk] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [warna, setWarna] = useState("");
  const [deadline, setDeadline] = useState("");
  const [jumlahGulungan, setJumlahGulungan] = useState(1);
  const [polaGulungan, setPolaGulungan] = useState<PolaGulungan[]>([
    { gulungan: 1, pola: "" },
  ]);

  useEffect(() => {
    fetchProdukData();
  }, [id]);

  const fetchProdukData = async () => {
    try {
      const response = await fetch(`/api/production/${id}`);
      const result = await response.json();

      if (result.success) {
        const data = result.data;

        setNamaProduk(data.nama_produk);
        setWarna(data.warna);
        setUkuran(data.ukuran);
        setStatus(data.status || "diproses");
        setJumlahGulungan(data.gulungan || 1);

        if (data.deadline) {
          const date = new Date(data.deadline);
          const formattedDate = date.toISOString().split("T")[0];

          setDeadline(formattedDate);
        }

        const jumlahPola = data.jumlah_pola || 0;
        const gulungan = data.gulungan || 1;
        const polaPerGulungan = Math.ceil(jumlahPola / gulungan);

        const newPola = Array.from({ length: gulungan }, (_, i) => ({
          gulungan: i + 1,
          pola: String(polaPerGulungan),
        }));

        setPolaGulungan(newPola);
      } else {
        alert("Gagal mengambil data produk");
        router.push("/produksi");
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      alert("Terjadi kesalahan saat mengambil data");
      router.push("/produksi");
    } finally {
      setLoadingData(false);
    }
  };

  const handleJumlahGulunganChange = (value: number) => {
    if (value < 1) return;

    setJumlahGulungan(value);

    const newPola = Array.from({ length: value }, (_, i) => ({
      gulungan: i + 1,
      pola: polaGulungan[i]?.pola || "",
    }));

    setPolaGulungan(newPola);
  };

  const handlePolaChange = (index: number, value: string) => {
    const newPola = [...polaGulungan];

    newPola[index].pola = value;
    setPolaGulungan(newPola);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namaProduk) {
      alert("Nama produk harus diisi");

      return;
    }

    if (!warna) {
      alert("Warna harus diisi");

      return;
    }

    if (!ukuran) {
      alert("Ukuran harus diisi");

      return;
    }

    const hasZeroPola = polaGulungan.some((item) => {
      const pola = parseInt(item.pola) || 0;

      return pola === 0;
    });

    if (hasZeroPola) {
      alert("Jumlah pola tidak boleh 0! Harap isi semua pola gulungan.");

      return;
    }

    setLoading(true);

    try {
      const totalPola = polaGulungan.reduce((sum, item) => {
        const pola = parseInt(item.pola) || 0;

        return sum + pola;
      }, 0);

      const response = await fetch(`/api/production/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_produk: namaProduk,
          warna: warna || null,
          ukuran: ukuran || null,
          gulungan: jumlahGulungan,
          jumlah_pola: totalPola,
          deadline: deadline || null,
          status: status || "diproses",
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Produk berhasil diupdate!");
        router.push("/produksi");
      } else {
        alert("Gagal mengupdate produk: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat mengupdate produk");
    } finally {
      setLoading(false);
    }
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

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <IconLoader2 className="animate-spin w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600">Memuat data produk...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Produk</h1>
        <p className="text-sm text-gray-600 mt-1">
          Edit detail produk dan pola gulungan
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Status</h3>
            <p className="text-xs text-gray-500 mb-4">Status Produksi</p>
            <select
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="diproses">Diproses</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Informasi Produk
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="nama_produk"
                >
                  Nama Produk
                </label>
                <input
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                  id="nama_produk"
                  placeholder="Masukkan nama produk"
                  type="text"
                  value={namaProduk}
                  onChange={(e) => setNamaProduk(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="ukuran"
                >
                  Ukuran
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                  id="ukuran"
                  placeholder="Masukkan ukuran produk"
                  type="text"
                  value={ukuran}
                  onChange={(e) => setUkuran(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="warna"
                >
                  Warna
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                  id="warna"
                  placeholder="Masukkan warna produk"
                  type="text"
                  value={warna}
                  onChange={(e) => setWarna(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="deadline"
                >
                  Deadline
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                  id="deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="jumlah_gulungan"
                >
                  Jumlah Gulungan
                </label>
                <input
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                  id="jumlah_gulungan"
                  min="1"
                  type="number"
                  value={jumlahGulungan}
                  onChange={(e) =>
                    handleJumlahGulunganChange(parseInt(e.target.value))
                  }
                />
                <p className="text-xs text-gray-500 mt-1">Minimal 1 gulungan</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Pola Gulungan
            </h3>
            <div className="space-y-4 mb-4">
              {polaGulungan.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-semibold mt-6">
                    {item.gulungan}
                  </div>
                  <div className="flex-1">
                    <label
                      className="block text-sm font-medium text-gray-700 mb-2"
                      htmlFor={`pola-gulungan-${index}`}
                    >
                      Gulungan {item.gulungan}
                    </label>
                    <input
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none"
                      id={`pola-gulungan-${index}`}
                      min="1"
                      placeholder={`Masukkan pola untuk gulungan ${item.gulungan}`}
                      type="number"
                      value={item.pola}
                      onChange={(e) => handlePolaChange(index, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <IconInfoCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Tips:</span> Jumlah input pola
                menyesuaikan dengan jumlah gulungan di atas.
              </p>
            </div>
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
                  <IconLoader2 className="animate-spin w-4 h-4" />
                  Menyimpan...
                </>
              ) : (
                <>Simpan Perubahan</>
              )}
            </button>
          </div>
        </form>
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
