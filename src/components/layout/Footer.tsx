import Link from "next/link";
import { MessageCircle, Globe, Share2, Camera } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full bg-black border-t border-fast-surface py-12 pr-8 pl-24 md:pr-16 md:pl-32 mt-16">
      <div className="w-full flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-fast-red font-black text-2xl tracking-widest">
            FLICKDOT
          </span>
        </div>

        {/* Socials & Nav */}
        <div className="flex items-center gap-8 flex-wrap justify-center text-xs text-gray-500 font-bold uppercase tracking-widest">
          <div className="flex items-center gap-4 text-gray-400">
            <span>Social Network</span>
            <MessageCircle className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Globe className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Camera className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
            <Share2 className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Catalog films</Link>
            <Link href="#" className="hover:text-white transition-colors text-fast-red">Watch films</Link>
            <Link href="#" className="hover:text-white transition-colors">News</Link>
          </div>
        </div>

        {/* Contact & Copyright */}
        <div className="flex flex-col items-center md:items-end text-[10px] text-gray-500 gap-1 uppercase tracking-widest">
          <span>Email: filmsflickdot@gmail.com</span>
          <span>© All rights reserved 2019</span>
        </div>

      </div>
    </footer>
  );
}
