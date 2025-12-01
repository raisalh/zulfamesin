"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  IconInfoCircle,
  IconAlertTriangle,
  IconLoader2,
  IconSearch,
  IconCheck,
} from "@tabler/icons-react";
import { parse } from "path";

interface PolaGulungan {
  gulungan: string;
  pola: string;
}

interface FormErrors {
  tanggalMulai?: string;
  estimasiSelesai?: string;
  tanggalSelesai?: string;
  namaProduk?: string;
  ukuran?: string;
  warna?: string;
  jumlahGulungan?: string;
  polaGulungan?: { [key: number]: string };
}

interface ProdukSuggestion {
  id_produk: number;
  nama_produk: string;
  warna: string;
  ukuran: string;
  nomor_gulungan: number | null;
}

export default function TambahProdukPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<ProdukSuggestion[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [tanggalMulai, setTanggalMulai] = useState("");
  const [estimasiSelesai, setEstimasiSelesai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [namaProduk, setNamaProduk] = useState("");
  const [ukuran, setUkuran] = useState("");
  const [warna, setWarna] = useState("");
  const [jumlahGulungan, setJumlahGulungan] = useState<string>("1");
  const [polaGulungan, setPolaGulungan] = useState<PolaGulungan[]>([
    { gulungan: "1", pola: "" },
  ]);

  useEffect(() => {
    if (namaProduk.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchProduk(namaProduk);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [namaProduk]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchProduk = async (query: string) => {
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/production?search=${encodeURIComponent(query)}`
      );
      const result = await response.json();

      if (result.success) {
        setSuggestions(result.data);
        setShowSuggestions(result.data.length > 0);
      }
    } catch (error) {
      console.error("Error searching produk:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: ProdukSuggestion) => {
    setNamaProduk(suggestion.nama_produk);
    setWarna(suggestion.warna);
    setUkuran(suggestion.ukuran);

    if (suggestion.nomor_gulungan && suggestion.nomor_gulungan > 0) {
      handleJumlahGulunganChange(suggestion.nomor_gulungan);
    }

    setShowSuggestions(false);
    setSelectedIndex(-1);

    const newErrors = { ...errors };
    delete newErrors.namaProduk;
    delete newErrors.warna;
    delete newErrors.ukuran;
    delete newErrors.jumlahGulungan;
    setErrors(newErrors);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const onlyLetters = /^[A-Za-z\s]+$/;

    if (!namaProduk.trim()) {
      newErrors.namaProduk = "Nama produk harus diisi";
    } else if (namaProduk.trim().length < 2) {
      newErrors.namaProduk = "Nama produk minimal 2 karakter";
    } else if (!onlyLetters.test(namaProduk.trim())) {
      newErrors.namaProduk = "Nama produk tidak boleh mengandung angka atau simbol";
    }

    if (!warna.trim()) {
      newErrors.warna = "Warna harus diisi";
    } else if (warna.trim().length < 2) {
      newErrors.warna = "Warna minimal 2 karakter";
    } else if (!onlyLetters.test(warna.trim())) {
      newErrors.warna = "Warna tidak boleh mengandung angka atau simbol";
    }

    if (!ukuran.trim()) {
      newErrors.ukuran = "Ukuran harus diisi";
    }

    if (jumlahGulungan.trim() === "") {
      newErrors.jumlahGulungan = "Jumlah gulungan harus diisi";
    } else if (parseInt(jumlahGulungan) < 1) {
      newErrors.jumlahGulungan = "Jumlah gulungan minimal 1";
    }

    if (tanggalMulai == ""){
      newErrors.tanggalMulai = "Tanggal mulai harus diisi";
    } 

    if (estimasiSelesai == ""){
      newErrors.estimasiSelesai = "Tanggal selesai harus diisi";
    }

    if (tanggalMulai && estimasiSelesai) {
      const mulai = new Date(tanggalMulai);
      const estimasi = new Date(estimasiSelesai);

      if (estimasi < mulai) {
        newErrors.estimasiSelesai =
          "Estimasi selesai tidak boleh lebih awal dari tanggal mulai";
      }
    }

    if (tanggalMulai && tanggalSelesai) {
      const mulai = new Date(tanggalMulai);
      const selesai = new Date(tanggalSelesai);

      if (selesai < mulai) {
        newErrors.tanggalSelesai =
          "Tanggal selesai tidak boleh lebih awal dari tanggal mulai";
      }
    }

    const polaErrors: { [key: number]: string } = {};

    polaGulungan.forEach((item, index) => {
      const pola = parseInt(item.pola) || 0;

      if (pola === 0 || item.pola === "") {
        polaErrors[index] = "Jumlah pola harus diisi dan tidak boleh 0";
      }
    });

    if (Object.keys(polaErrors).length > 0) {
      newErrors.polaGulungan = polaErrors;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleJumlahGulunganChange = (value: number) => {
    if (value < 1) return;

    setJumlahGulungan(value.toString());

    const newPola = Array.from({ length: value }, (_, i) => ({
      gulungan: (i + 1).toString(),
      pola: polaGulungan[i]?.pola || "",
    }));

    setPolaGulungan(newPola);

    if (errors.polaGulungan) {
      const newErrors = { ...errors };

      delete newErrors.polaGulungan;
      setErrors(newErrors);
    }
  };

  const handlePolaChange = (index: number, value: string) => {
    const newPola = [...polaGulungan];

    newPola[index].pola = value;
    setPolaGulungan(newPola);

    if (errors.polaGulungan && errors.polaGulungan[index]) {
      const newErrors = { ...errors };

      if (newErrors.polaGulungan) {
        delete newErrors.polaGulungan[index];
        if (Object.keys(newErrors.polaGulungan).length === 0) {
          delete newErrors.polaGulungan;
        }
      }
      setErrors(newErrors);
    }
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
      const status = tanggalSelesai ? "selesai" : "diproses";

      const response = await fetch("/api/production", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nama_produk: namaProduk,
          warna: warna,
          ukuran: ukuran,
          gulungan: jumlahGulungan,
          deadline: estimasiSelesai || null,
          status: status,
          tanggal_mulai: tanggalMulai || null,
          tanggal_selesai: tanggalSelesai || null,
          gulungan_data: polaGulungan,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("Produk berhasil ditambahkan!");
        router.push("/produksi");
      } else {
        alert("Gagal menambahkan produk: " + result.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Terjadi kesalahan saat menambahkan produk");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tambah Produk Baru
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Masukkan detail produk dan pola gulungan
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Informasi Awal Pengerjaan
            </h3>

            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="tanggal_mulai"
                >
                  Tanggal Mulai Pengerjaan
                </label>
                <input
                  className={`w-full px-4 py-3 border ${errors.tanggalMulai ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                  id="tanggal_mulai"
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => {
                    setTanggalMulai(e.target.value);
                    clearError("tanggalMulai");
                  }}
                />
                {errors.tanggalMulai && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.tanggalMulai}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="estimasi_selesai"
                >
                  Estimasi Selesai Pengerjaan
                </label>
                <input
                  className={`w-full px-4 py-3 border ${errors.estimasiSelesai
                    ? "border-red-500"
                    : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                  id="estimasi_selesai"
                  type="date"
                  value={estimasiSelesai}
                  onChange={(e) => {
                    setEstimasiSelesai(e.target.value);
                    clearError("estimasiSelesai");
                  }}
                />
                {errors.estimasiSelesai && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.estimasiSelesai}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Informasi Produk
            </h3>

            <div className="space-y-4">
              <div className="relative">
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="nama_produk"
                >
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    className={`w-full px-4 py-3 pr-10 border ${errors.namaProduk ? "border-red-500" : "border-gray-300"
                      } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                    id="nama_produk"
                    placeholder="Ketik nama produk (min. 2 karakter untuk pencarian)"
                    type="text"
                    value={namaProduk}
                    onChange={(e) => {
                      setNamaProduk(e.target.value);
                      clearError("namaProduk");
                    }}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (suggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    autoComplete="off"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {searchLoading ? (
                      <IconLoader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : (
                      <IconSearch className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {errors.namaProduk && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.namaProduk}
                  </p>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div className="p-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                      <p className="text-xs text-gray-600 font-medium">
                        Pilih dari data yang ada (akan auto-fill form):
                      </p>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.id_produk}
                        className={`px-4 py-3 cursor-pointer transition-colors ${index === selectedIndex
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : "hover:bg-gray-50 border-l-4 border-transparent"
                          }`}
                        onClick={() => handleSelectSuggestion(suggestion)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {suggestion.nama_produk}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">Warna:</span>{" "}
                                {suggestion.warna}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-600">
                                <span className="font-medium">Ukuran:</span>{" "}
                                {suggestion.ukuran}
                              </span>
                              {suggestion.nomor_gulungan && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-600">
                                    <span className="font-medium">Gulungan:</span>{" "}
                                    {suggestion.nomor_gulungan}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {index === selectedIndex && (
                            <IconCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Ketik minimal 2 karakter untuk mencari produk yang sudah ada. Data akan auto-fill.
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="ukuran"
                >
                  Ukuran <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 border ${errors.ukuran ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                  id="ukuran"
                  placeholder="Masukkan ukuran produk"
                  type="text"
                  value={ukuran}
                  onChange={(e) => {
                    setUkuran(e.target.value);
                    clearError("ukuran");
                  }}
                />
                {errors.ukuran && (
                  <p className="text-red-500 text-sm mt-1">{errors.ukuran}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="warna"
                >
                  Warna <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 border ${errors.warna ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                  id="warna"
                  placeholder="Masukkan warna produk"
                  type="text"
                  value={warna}
                  onChange={(e) => {
                    setWarna(e.target.value);
                    clearError("warna");
                  }}
                />
                {errors.warna && (
                  <p className="text-red-500 text-sm mt-1">{errors.warna}</p>
                )}
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  htmlFor="jumlah_gulungan"
                >
                  Jumlah Gulungan <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full px-4 py-3 border ${errors.jumlahGulungan ? "border-red-500" : "border-gray-300"
                    } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                  id="jumlah_gulungan"
                  type="text"
                  value={jumlahGulungan}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (/^\d*$/.test(val)) {
                      setJumlahGulungan(val);
                
                      const num = parseInt(val || "0");
                      if (num > 0) handleJumlahGulunganChange(num);
                    }

                    clearError("jumlahGulungan");
                  }}

                />
                {errors.jumlahGulungan && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.jumlahGulungan}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">Minimal 1 gulungan. Auto-fill dari data produk sebelumnya.</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Pola Gulungan <span className="text-red-500">*</span>
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
                      className={`w-full px-4 py-3 border ${errors.polaGulungan && errors.polaGulungan[index]
                        ? "border-red-500"
                        : "border-gray-300"
                        } rounded-lg focus:ring-2 focus:ring-[#001F3F] focus:border-transparent outline-none`}
                      id={`pola-gulungan-${index}`}
                      placeholder={`Masukkan pola untuk gulungan ${item.gulungan}`}
                      type="text"
                      value={item.pola}
                      onChange={(e) => {
                        const val = e.target.value;
                    
                        if (/^\d*$/.test(val)) {   
                          handlePolaChange(index, val);
                        }
                      }}
                    />
                    {errors.polaGulungan && errors.polaGulungan[index] && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.polaGulungan[index]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
              <IconInfoCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
                <>+ Tambah Produk</>
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
              Anda yakin ingin membatalkan proses menambah produk?
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