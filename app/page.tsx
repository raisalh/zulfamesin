import React from 'react';
import { Button } from "@heroui/button";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { IconUserFilled, IconClockHour5Filled, IconAward, IconLeaf, IconEye, IconSearch, IconPackage, IconTools, IconClockCog, IconChecklist, IconTruck} from '@tabler/icons-react';

export default function ZulfaMesinLanding() {
  const products = [
    { name: "Almamater", image: "/assets/almet-unj.jpg"},
    { name: "Baju Custom", image: "/assets/baju-custom.jpg"},
    { name: "Kemeja", image: "/assets/kemeja.jpg"},
    { name: "Seragam", image: "/assets/seragam.jpg"},
    { name: "Seragam Pertamina", image: "/assets/seragam-pertamina.jpg"},
  ];

  const processSteps = [
    {
      number: "1",
      title: "Pemilihan Bahan Baku",
      description: "Seleksi ketat bahan baku berkualitas tinggi dari supplier terpercaya."
    },
    {
      number: "2",
      title: "Pemotongan & Pembentukan Pola",
      description: "Pemotongan kain presisi dengan mesin modern sesuai desain."
    },
    {
      number: "3",
      title: "Proses Penjahitan",
      description: "Perakitan kain dengan jahitan rapi serta finishing berkualitas."
    },
    {
      number: "4",
      title: "Quality Control",
      description: "Pemeriksaan kualitas menyeluruh sebelum produk siap didistribusikan."
    },
    {
      number: "5",
      title: "Pengantaran",
      description: "Proses pengantaran produk kepada konsumen."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-900 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <img 
                src="/assets/Logo.svg" 
                alt="Zulfa Mesin Logo" 
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-100">
                Zulfa Mesin
              </span>
            </div>
            <div className="hidden md:flex gap-8 items-center">
              <a href="#beranda" className="text-white hover:text-[#4D918F] transition">Beranda</a>
              <a href="#tentang" className="text-white hover:text-[#4D918F] transition">Tentang Kami</a>
              <a href="#visi-misi" className="text-white hover:text-[#4D918F] transition">Visi & Misi</a>
              <a href="#proses" className="text-white hover:text-[#4D918F] transition">Proses Produksi</a>
              <a href="#galeri" className="text-white hover:text-[#4D918F] transition">Galeri</a>
              <a href="#kontak" className="text-white hover:text-[#4D918F] transition">Kontak</a>
              <Button as="a" href="/login" variant="bordered" radius="md" size="md" className='text-white hover:text-[#4D918F] transition'>
                <IconUserFilled />
                Login
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="beranda" className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">
              Produsen Garmen{" "}
                Berkualitas Tinggi
            </h1>
            <p className="text-xl text-gray-600">
              Dengan pengalaman lebih dari 20 tahun, kami menghadirkan produk tekstil terbaik untuk kebutuhan industri dan konsumen di seluruh Indonesia.
            </p>
            <div className="flex gap-4 flex-wrap">
            <Button size="lg" radius="none" className="bg-[#111827] text-white shadow-lg hover:bg-[#1f2937]">
                Lihat Produk Kami
              </Button>
              <Button variant="bordered" size="lg" radius="none">
                Hubungi Kami
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-3xl transform rotate-6 opacity-20"></div>
            <img 
              src="/assets/lokasi.jpg" 
              alt="Factory"
              className="relative rounded-3xl shadow-2xl w-full"
            />
          </div>
        </div>
      </section>

      {/* Tentang Kami */}
      <section id="tentang" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Tentang Kami</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Perusahaan tekstil terdepan yang berkomitmen menghadirkan produk berkualitas tinggi dengan teknologi modern dan proses produksi yang berkelanjutan.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-none bg-gradient-to-br from-blue-50 to-blue-100">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconAward stroke={2} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Kualitas Terjamin</h3>
                <p className="text-gray-600">
                  Setiap produk melalui kontrol kualitas ketat untuk memastikan standar internasional.
                </p>
              </CardBody>
            </Card>

            <Card className="border-none bg-gradient-to-br from-green-50 to-green-100">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconLeaf stroke={2} />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ramah Lingkungan</h3>
                <p className="text-gray-600">
                  Menggunakan bahan dan proses produksi yang berkelanjutan dan ramah lingkungan.
                </p>
              </CardBody>
            </Card>

            <Card className="border-none bg-gradient-to-br from-purple-50 to-purple-100">
              <CardBody className="text-center p-8">
                <div className="w-16 h-16 bg-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconClockHour5Filled />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pengalaman 20+ Tahun</h3>
                <p className="text-gray-600">
                  Dipercaya oleh ribuan klien dengan pengalaman dan keahlian yang teruji.
                </p>
              </CardBody>
            </Card>
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section id="visi-misi" className="py-20 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        <Card className="border-none">
          <CardBody className="p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center">
                <IconEye stroke={2} className="text-white" />
              </div>
              <h3 className="text-3xl font-semibold">Visi</h3>
            </div>
            <p className="text-lg leading-relaxed text-gray-500">
              Menjadi perusahaan garmen terdepan di Indonesia yang dikenal karena inovasi, kualitas produk yang unggul, dan komitmen terhadap keberlanjutan lingkungan dalam setiap aspek produksi.
            </p>
          </CardBody>
        </Card>

        <Card className="border-none bg-white shadow-xl">
          <CardBody className="p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#111827] rounded-lg flex items-center justify-center">
                <IconSearch stroke={2} className="text-white" />
              </div>
              <h3 className="text-3xl font-semibold text-black">Misi</h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-gray-500 mt-1">✓</span>
                <span className='text-gray-500'>Menghasilkan produk tekstil berkualitas tinggi dengan teknologi terdepan</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-500 mt-1">✓</span>
                <span className='text-gray-500'>Memberikan pelayanan terbaik kepada seluruh pelanggan</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-500 mt-1">✓</span>
                <span className='text-gray-500'>Menerapkan proses produksi yang ramah lingkungan</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-gray-500 mt-1">✓</span>
                <span className='text-gray-500'>Mengembangkan SDM yang kompeten dan profesional</span>
              </li>
            </ul>
          </CardBody>
        </Card>
      </div>
      </section>

      <section id="proses" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Proses Produksi</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Setiap tahap produksi dilakukan dengan standar kualitas tinggi dan teknologi modern untuk menghasilkan garmen terbaik.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {processSteps.map((step, index) => (
              <div key={index} className="relative flex">
                <Card className="border-2 border-gray-300 bg-white hover:shadow-xl transition-shadow rounded-2xl h-full w-full">
                  <CardBody className="text-center p-8 relative flex flex-col">
                    <div className="absolute top-4 right-4 w-8 h-8 bg-[#111827] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{step.number}</span>
                    </div>
                    
                    <div className="w-20 h-20 flex items-center justify-center mx-auto mb-6 mt-2">
                      <svg className="w-16 h-16 text-[#111827]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        {index === 0 && (
                          <IconPackage stroke={2} />
                        )}
                        {index === 1 && (
                          <IconTools stroke={2} />
                        )}
                        {index === 2 && (
                          <IconClockCog stroke={2} />
                        )}
                        {index === 3 && (
                          <IconChecklist stroke={2} />
                        )}
                        {index === 4 && (
                          <IconTruck stroke={2} />
                        )}
                      </svg>
                    </div>
                    
                    <h4 className="font-bold mb-3 text-base text-gray-800">{step.title}</h4>
                    <p className="text-sm text-gray-600 leading-relaxed">{step.description}</p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Galeri Produk */}
      <section id="galeri" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Galeri Produk</h2>
            <p className="text-xl text-gray-600">Koleksi produk dari Zulfa Mesin</p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {products.map((product, index) => (
              <Card key={index} className="border-none hover:scale-105 transition-transform">
                <CardBody className="p-0">
                  <img 
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                </CardBody>
                <CardFooter className="flex-col items-start">
                  <h4 className="font-bold">{product.name}</h4>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="bg-slate-900 text-gray-300 py-16 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="/assets/Logo.svg" 
                alt="Zulfa Mesin Logo" 
                className="w-10 h-10"
              />
              <span className="text-xl font-bold text-gray-100">
                Zulfa Mesin
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Perusahaan tekstil terdepan dengan komitmen pada kualitas dan keberlanjutan.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Perusahaan</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#tentang" className="hover:text-white transition">Tentang Kami</a></li>
              <li><a href="#visi-misi" className="hover:text-white transition">Visi & Misi</a></li>
              <li><a href="#proses" className="hover:text-white transition">Proses Produksi</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Kontak</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span>📞</span>
                <span>+6285280389006</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>Jl. Babakan, RT.001/RW.011, Majasetra, Kec. Majalaya, Kabupaten Bandung, Jawa Barat 40392</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-700 text-center text-sm">
          <p>© 2025 CV. RAHMA GLOBAL MANDIRI. Seluruh hak cipta dilindungi.</p>
        </div>
      </footer>
    </div>
  );
}