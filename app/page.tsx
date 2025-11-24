"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import {
  IconUserFilled,
  IconClockHour5Filled,
  IconAward,
  IconLeaf,
  IconEye,
  IconSearch,
  IconPackage,
  IconTools,
  IconClockCog,
  IconChecklist,
  IconTruck,
  IconMenu2,
  IconX,
} from "@tabler/icons-react";

export default function ZulfaMesinLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const products = [
    { name: "Almamater", image: "/assets/almet-unj.jpg" },
    { name: "Baju Custom", image: "/assets/baju-custom.jpg" },
    { name: "Kemeja", image: "/assets/kemeja.jpg" },
    { name: "Seragam", image: "/assets/seragam.jpg" },
    { name: "Seragam Pertamina", image: "/assets/seragam-pertamina.jpg" },
  ];

  const processSteps = [
    {
      number: "1",
      title: "Pemilihan Bahan Baku",
      description:
        "Seleksi ketat bahan baku berkualitas tinggi dari supplier terpercaya.",
      icon: IconPackage,
    },
    {
      number: "2",
      title: "Pemotongan & Pembentukan Pola",
      description: "Pemotongan kain presisi dengan mesin modern sesuai desain.",
      icon: IconTools,
    },
    {
      number: "3",
      title: "Proses Penjahitan",
      description:
        "Perakitan kain dengan jahitan rapi serta finishing berkualitas.",
      icon: IconClockCog,
    },
    {
      number: "4",
      title: "Quality Control",
      description:
        "Pemeriksaan kualitas menyeluruh sebelum produk siap didistribusikan.",
      icon: IconChecklist,
    },
    {
      number: "5",
      title: "Pengantaran",
      description: "Proses pengantaran produk kepada konsumen.",
      icon: IconTruck,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Image
                alt="Zulfa Mesin Logo"
                className="w-10 h-10"
                height={40}
                src="/assets/Logo.svg"
                width={40}
              />
              <span className="text-lg sm:text-xl font-bold text-gray-100">
                Zulfa Mesin
              </span>
            </div>

            <div className="hidden md:flex gap-6 lg:gap-8 items-center">
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#beranda"
              >
                Beranda
              </a>
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#tentang"
              >
                Tentang Kami
              </a>
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#visi-misi"
              >
                Visi & Misi
              </a>
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#proses"
              >
                Proses Produksi
              </a>
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#galeri"
              >
                Galeri
              </a>
              <a
                className="text-white hover:text-[#4D918F] transition text-sm lg:text-base"
                href="#kontak"
              >
                Kontak
              </a>
              <Button
                as="a"
                className="text-white hover:text-[#4D918F] transition"
                href="/login"
                radius="md"
                size="sm"
                variant="bordered"
              >
                <IconUserFilled size={18} />
                Login
              </Button>
            </div>

            <button
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-3">
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#beranda"
                onClick={() => setMobileMenuOpen(false)}
              >
                Beranda
              </a>
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#tentang"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tentang Kami
              </a>
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#visi-misi"
                onClick={() => setMobileMenuOpen(false)}
              >
                Visi & Misi
              </a>
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#proses"
                onClick={() => setMobileMenuOpen(false)}
              >
                Proses Produksi
              </a>
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#galeri"
                onClick={() => setMobileMenuOpen(false)}
              >
                Galeri
              </a>
              <a
                className="block text-white hover:text-[#4D918F] transition py-2"
                href="#kontak"
                onClick={() => setMobileMenuOpen(false)}
              >
                Kontak
              </a>
              <Button
                as="a"
                className="text-white w-full mt-2"
                href="/login"
                radius="md"
                size="sm"
                variant="bordered"
              >
                <IconUserFilled size={18} />
                Login
              </Button>
            </div>
          )}
        </div>
      </nav>

      <section
        className="relative py-12 sm:py-16 lg:py-20 px-4 overflow-hidden"
        id="beranda"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12 items-center relative">
          <div className="space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Produsen Garmen Berkualitas Tinggi
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Dengan pengalaman lebih dari 20 tahun, kami menghadirkan produk
              garmen terbaik untuk kebutuhan industri dan konsumen di seluruh
              Indonesia.
            </p>
            <div className="flex gap-3 sm:gap-4 flex-wrap">
              <Button
                className="bg-[#111827] text-white shadow-lg hover:bg-[#1f2937] text-sm sm:text-base"
                radius="none"
                size="lg"
              >
                Lihat Produk Kami
              </Button>
              <Button
                className="text-sm sm:text-base"
                radius="none"
                size="lg"
                variant="bordered"
              >
                Hubungi Kami
              </Button>
            </div>
          </div>
          <div className="relative mt-8 md:mt-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-2xl sm:rounded-3xl transform rotate-6 opacity-20" />
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
              <Image
                priority
                alt="Factory"
                className="w-full h-auto"
                height={400}
                src="/assets/lokasi.jpg"
                width={600}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Tentang Kami */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white" id="tentang">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
              Tentang Kami
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Perusahaan garmen terdepan yang berkomitmen menghadirkan produk
              berkualitas tinggi dengan teknologi modern dan proses produksi
              yang berkelanjutan.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100">
              <CardBody className="text-center p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <IconAward size={28} stroke={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Kualitas Terjamin
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Setiap produk melalui kontrol kualitas ketat untuk memastikan
                  standar internasional.
                </p>
              </CardBody>
            </Card>

            <Card className="border-none bg-gradient-to-br from-green-50 to-green-100">
              <CardBody className="text-center p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <IconLeaf size={28} stroke={2} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Ramah Lingkungan
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Menggunakan bahan dan proses produksi yang berkelanjutan dan
                  ramah lingkungan.
                </p>
              </CardBody>
            </Card>

            <Card className="border-none bg-gradient-to-br from-purple-50 to-purple-100 sm:col-span-2 md:col-span-1">
              <CardBody className="text-center p-6 sm:p-8">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <IconClockHour5Filled size={28} />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  Pengalaman 20+ Tahun
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Dipercaya oleh ribuan klien dengan pengalaman dan keahlian
                  yang teruji.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="py-12 sm:py-16 lg:py-20 px-4" id="visi-misi">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12">
          <Card className="border-none">
            <CardBody className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#111827] rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconEye className="text-white" size={24} stroke={2} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold">Visi</h3>
              </div>
              <p className="text-base sm:text-lg leading-relaxed text-gray-500">
                Menjadi perusahaan garmen terdepan di Indonesia yang dikenal
                karena inovasi, kualitas produk yang unggul, dan komitmen
                terhadap keberlanjutan lingkungan dalam setiap aspek produksi.
              </p>
            </CardBody>
          </Card>

          <Card className="border-none bg-white shadow-xl">
            <CardBody className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#111827] rounded-lg flex items-center justify-center flex-shrink-0">
                  <IconSearch className="text-white" size={24} stroke={2} />
                </div>
                <h3 className="text-2xl sm:text-3xl font-semibold text-black">
                  Misi
                </h3>
              </div>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 mt-1">✓</span>
                  <span className="text-sm sm:text-base text-gray-500">
                    Menghasilkan produk garmen berkualitas tinggi dengan
                    teknologi terdepan
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 mt-1">✓</span>
                  <span className="text-sm sm:text-base text-gray-500">
                    Memberikan pelayanan terbaik kepada seluruh pelanggan
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 mt-1">✓</span>
                  <span className="text-sm sm:text-base text-gray-500">
                    Menerapkan proses produksi yang ramah lingkungan
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gray-500 mt-1">✓</span>
                  <span className="text-sm sm:text-base text-gray-500">
                    Mengembangkan SDM yang kompeten dan profesional
                  </span>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* Proses Produksi */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 bg-white" id="proses">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
              Proses Produksi
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Setiap tahap produksi dilakukan dengan standar kualitas tinggi dan
              teknologi modern untuk menghasilkan garmen terbaik.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {processSteps.map((step, index) => {
              const IconComponent = step.icon;

              return (
                <div key={index} className="relative flex">
                  <Card className="border-2 border-gray-300 bg-white hover:shadow-xl transition-shadow rounded-2xl h-full w-full">
                    <CardBody className="text-center p-6 sm:p-8 relative flex flex-col">
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-7 h-7 sm:w-8 sm:h-8 bg-[#111827] rounded-full flex items-center justify-center">
                        <span className="text-white text-xs sm:text-sm font-bold">
                          {step.number}
                        </span>
                      </div>

                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 mt-2">
                        <IconComponent
                          className="text-[#111827]"
                          size={48}
                          stroke={2}
                        />
                      </div>

                      <h4 className="font-bold mb-2 sm:mb-3 text-sm sm:text-base text-gray-800">
                        {step.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </CardBody>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Galeri Produk */}
      <section className="py-12 sm:py-16 lg:py-20 px-4" id="galeri">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
              Galeri Produk
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600">
              Koleksi produk dari Zulfa Mesin
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {products.map((product, index) => (
              <Card
                key={index}
                className="border-none hover:scale-105 transition-transform"
              >
                <CardBody className="p-0">
                  <div className="relative w-full h-40 sm:h-48">
                    <Image
                      fill
                      alt={product.name}
                      className="object-cover"
                      src={product.image}
                    />
                  </div>
                </CardBody>
                <CardFooter className="flex-col items-start p-3 sm:p-4">
                  <h4 className="font-bold text-sm sm:text-base">
                    {product.name}
                  </h4>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="bg-slate-900 text-gray-300 py-12 sm:py-16 px-4"
        id="kontak"
      >
        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Image
                alt="Zulfa Mesin Logo"
                className="w-10 h-10"
                height={40}
                src="/assets/Logo.svg"
                width={40}
              />
              <span className="text-lg sm:text-xl font-bold text-gray-100">
                Zulfa Mesin
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Perusahaan garmen terdepan dengan komitmen pada kualitas dan
              keberlanjutan.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Perusahaan</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a className="hover:text-white transition" href="#tentang">
                  Tentang Kami
                </a>
              </li>
              <li>
                <a className="hover:text-white transition" href="#visi-misi">
                  Visi & Misi
                </a>
              </li>
              <li>
                <a className="hover:text-white transition" href="#proses">
                  Proses Produksi
                </a>
              </li>
            </ul>
          </div>

          <div className="sm:col-span-2 md:col-span-1">
            <h4 className="font-bold text-white mb-4">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span>📞</span>
                <span>+6285280389006</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>
                  Jl. Babakan, RT.001/RW.011, Majasetra, Kec. Majalaya,
                  Kabupaten Bandung, Jawa Barat 40392
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-700 text-center text-xs sm:text-sm">
          <p>© 2025 CV. RAHMA GLOBAL MANDIRI. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}
