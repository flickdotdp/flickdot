import { Navbar } from "@/components/layout/Navbar";

export default function StorePage() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-8 mt-12">Store</h1>
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-4">Rent or Buy the Latest Releases</h2>
        <p className="text-gray-400 max-w-md mx-auto">Build your permanent library or rent the newest premium movies and exclusive content.</p>
      </div>
    </div>
  );
}
