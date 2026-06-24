"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Home } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-20 hover:w-64 bg-transparent hover:bg-black/95 transition-all duration-300 flex flex-col items-start py-6 px-6 z-50 pointer-events-auto group overflow-hidden border-r border-transparent hover:border-white/10">
      


      {/* Nav Icons */}
      <div className="flex flex-col gap-8 text-gray-400 w-full">
        <Link href="/search" className="transition-colors hover:text-white flex items-center gap-6 w-full">
          <Search className="h-6 w-6 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">Search</span>
        </Link>
        <Link href="/home" className="text-white transition-colors hover:text-white flex items-center gap-6 w-full">
          <Home className="h-6 w-6 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">Home</span>
        </Link>

      </div>

    </div>
  );
}
