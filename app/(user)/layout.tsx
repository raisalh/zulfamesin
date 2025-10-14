"use client";

import { Button } from "@heroui/button";
import {
  IconHome,
  IconShirt,
  IconUsersGroup,
  IconUserCircle,
  IconChartPie2,
  IconLogout,
  IconMenu2,
} from "@tabler/icons-react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";

interface User {
  id_user: number;
  name: string;
  email: string;
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pagesWithSidebar = ["/dashboard", "/produksi", "/karyawan", "/laporan"];

  const showSidebar = pagesWithSidebar.some((page) => pathname === page);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const menuItems = [
    {
      title: "Beranda",
      href: "/dashboard",
      icon: IconHome,
    },
    {
      title: "Produksi",
      href: "/produksi",
      icon: IconShirt,
    },
    {
      title: "Karyawan",
      href: "/karyawan",
      icon: IconUsersGroup,
    },
    {
      title: "Laporan",
      href: "/laporan",
      icon: IconChartPie2,
    },
  ];

  const currentPage = menuItems.find((item) => item.href === pathname);
  const pageTitle = currentPage?.title || "Dashboard";

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <button
        aria-label="Close mobile menu"
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        type="button"
        onClick={() => setIsMobileMenuOpen(false)}
      />

      <aside
        className={`${
          isExpanded ? "w-64" : "w-20"
        } bg-slate-800 text-white flex flex-col transition-all duration-300 
                fixed lg:relative h-full z-50
                ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                lg:transition-all`}
      >
        <div className="p-6">
          <div
            className={`flex items-center gap-3 ${!isExpanded && "justify-center"}`}
          >
            <Image
              alt="Zulfa Mesin Logo"
              className="flex-shrink-0 object-contain"
              height={40}
              src="/assets/Logo.svg"
              width={40}
            />
            {isExpanded && (
              <div className="overflow-hidden">
                <h1 className="text-lg font-bold whitespace-nowrap">
                  Zulfa Mesin
                </h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">
                  Produksi Garmen
                </p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Button
                key={item.href}
                as="a"
                className={`w-full ${
                  isExpanded ? "justify-start" : "justify-center"
                } gap-3 h-12 text-base font-medium ${
                  isActive
                    ? "bg-teal-600 text-black hover:bg-teal-700"
                    : "bg-transparent text-slate-300 hover:bg-slate-700"
                }`}
                href={item.href}
                isIconOnly={!isExpanded}
                startContent={<Icon size={20} />}
              >
                {isExpanded && item.title}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {isExpanded ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                <IconUserCircle size={35} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name || "Loading..."}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.email || ""}
                </p>
              </div>
              <Button
                isIconOnly
                as="a"
                className="bg-transparent text-slate-300 hover:bg-slate-700"
                href="/logout"
                startContent={<IconLogout size={20} />}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Button
                isIconOnly
                as="a"
                className="bg-transparent text-slate-300 hover:bg-slate-700"
                href="/profile"
              >
                <IconUserCircle size={24} />
              </Button>
              <Button
                isIconOnly
                as="a"
                className="bg-transparent text-slate-300 hover:bg-slate-700"
                href="/logout"
                startContent={<IconLogout size={20} />}
              />
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 overflow-auto w-full lg:w-auto">
        <div className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4">
          <Button
            isIconOnly
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setIsMobileMenuOpen(!isMobileMenuOpen);
              } else {
                setIsExpanded(!isExpanded);
              }
            }}
          >
            <IconMenu2 size={20} />
          </Button>
          <h2 className="text-lg lg:text-xl font-bold text-gray-800">
            {pageTitle}
          </h2>
        </div>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
