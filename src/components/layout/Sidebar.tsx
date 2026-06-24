"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Home, ShoppingBag, Tv, Tag, UserSquare2 } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/") {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 h-screen w-20 hover:w-64 bg-transparent hover:bg-black/95 transition-all duration-300 flex flex-col items-start py-6 px-6 z-50 pointer-events-auto group overflow-hidden border-r border-transparent hover:border-white/10">
      
      {/* Top Profile/Avatar */}
      <div className="mb-10 w-full flex items-center gap-4 cursor-pointer">
        <div className="w-8 h-8 shrink-0 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center overflow-hidden hover:border-white transition-colors">
           <div className="w-full h-full bg-fast-red/50"></div>
        </div>
        <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold text-white whitespace-nowrap">My Profile</span>
      </div>

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
        <Link href="/store" className="transition-colors hover:text-white flex items-center gap-6 w-full">
          <ShoppingBag className="h-6 w-6 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">Store</span>
        </Link>
        <Link href="/live" className="transition-colors hover:text-white flex items-center gap-6 w-full">
          <Tv className="h-6 w-6 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">Live TV</span>
        </Link>
        <Link href="/free" className="transition-colors hover:text-white flex items-center gap-6 w-full relative">
          <div className="relative shrink-0">
             <Tag className="h-6 w-6" />
          </div>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">Free</span>
        </Link>
        <Link href="/mystuff" className="transition-colors hover:text-white flex items-center gap-6 w-full">
          <UserSquare2 className="h-6 w-6 shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-bold whitespace-nowrap text-lg tracking-wide">My Stuff</span>
        </Link>
      </div>

    </div>
  );
}
