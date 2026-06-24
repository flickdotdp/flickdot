import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-start pr-8 pl-24 md:pr-16 md:pl-32 z-40 pointer-events-none">
      {/* Left Aligned Logo */}
      <Link href="/home" className="pointer-events-auto">
        <Image src="/flickdot-logo.svg" alt="Flickdot Logo" width={180} height={45} className="object-contain" priority />
      </Link>
    </nav>
  );
}
