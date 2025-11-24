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
import { signOut } from "next-auth/react";

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
  const [isExpanded, setIsExpanded] = useState<null | boolean>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const pagesWithSidebar = ["/dashboard", "/produksi", "/karyawan", "/laporan"];
  const showSidebar = pagesWithSidebar.some((page) => pathname === page);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-expanded");
    if (saved !== null) {
      setIsExpanded(saved === "true");
    } else {
      setIsExpanded(true);
    }
  }, []);

  useEffect(() => {
    if (isExpanded !== null) {
      localStorage.setItem("sidebar-expanded", String(isExpanded));
    }
  }, [isExpanded]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const data = await response.json();
        if (data.user) setUser(data.user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const menuItems = [
    { title: "Beranda", href: "/dashboard", icon: IconHome },
    { title: "Produksi", href: "/produksi", icon: IconShirt },
    { title: "Karyawan", href: "/karyawan", icon: IconUsersGroup },
    { title: "Laporan", href: "/laporan", icon: IconChartPie2 },
  ];

  const currentPage = menuItems.find((item) => item.href === pathname);
  const pageTitle = currentPage?.title || "Dashboard";

  if (!showSidebar) return <>{children}</>;
  if (isExpanded === null) return null;

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {isMobileMenuOpen && (
        <button
          aria-label="Close mobile menu"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`
          bg-slate-800 text-white flex flex-col h-full z-50
          transition-all duration-300
          fixed top-0 left-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          lg:relative lg:translate-x-0
          ${isExpanded ? "lg:w-64" : "lg:w-20"}
        `}
      >
        <div className="p-6">
          <div className={`flex items-center gap-3 ${!isExpanded ? "lg:justify-center" : ""}`}>
            <Image
              alt="Zulfa Mesin Logo"
              height={40}
              width={40}
              src="/assets/Logo.svg"
              className="flex-shrink-0 object-contain"
            />
            <div className="hidden lg:block overflow-hidden">
              {isExpanded && (
                <>
                  <h1 className="text-lg font-bold whitespace-nowrap">Zulfa Mesin</h1>
                  <p className="text-xs text-slate-400 whitespace-nowrap">Produksi Garmen</p>
                </>
              )}
            </div>

            <div className="lg:hidden overflow-hidden">
              <h1 className="text-lg font-bold whitespace-nowrap">Zulfa Mesin</h1>
              <p className="text-xs text-slate-400 whitespace-nowrap">Produksi Garmen</p>
            </div>
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
                href={item.href}
                isIconOnly={!isExpanded}
                className={`
                  w-full
                  ${isExpanded ? "h-12 justify-start gap-x-3" : "h-12"} 
                  text-base font-medium
                  transition-all duration-200
                  ${isActive
                    ? "bg-teal-600 text-black hover:bg-teal-700"
                    : "bg-transparent text-slate-300 hover:bg-slate-700"
                  }
                `}
                startContent={isExpanded ? <Icon size={20} /> : undefined}
              >
                {isExpanded ? (
                  <span className="hidden lg:inline">{item.title}</span>
                ) : (
                  <Icon size={20} />
                )}
              </Button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          {isExpanded ? (
            <div className="hidden lg:flex items-center gap-3 mb-3">
              <IconUserCircle size={35} className="flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Memuat..."}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ""}</p>
              </div>
              <Button
                isIconOnly
                className="bg-transparent text-slate-300 hover:bg-slate-700"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout size={20} />
              </Button>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center gap-2">
              <Button
                isIconOnly
                className="bg-transparent text-slate-300 hover:bg-slate-700"
              >
                <IconUserCircle size={24} />
              </Button>
              <Button
                isIconOnly
                className="bg-transparent text-slate-300 hover:bg-slate-700"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                <IconLogout size={20} />
              </Button>
            </div>
          )}

          <div className="flex lg:hidden items-center justify-between mt-2">
            <span className="text-sm">{user?.name}</span>
            <Button
              isIconOnly
              className="bg-transparent text-slate-300 hover:bg-slate-700"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <IconLogout size={20} />
            </Button>
          </div>
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
          <h2 className="text-lg lg:text-xl font-bold text-gray-800">{pageTitle}</h2>
        </div>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}