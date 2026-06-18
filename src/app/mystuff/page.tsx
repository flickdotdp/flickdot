import { Navbar } from "@/components/layout/Navbar";

export default function MyStuffPage() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
      <Navbar />
      <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-12 mt-12">My Stuff</h1>
      
      <div className="flex flex-col gap-12">
        <section>
          <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
          <div className="text-gray-500 bg-white/5 rounded-lg p-12 text-center border border-white/10">
            You don't have any in-progress videos.
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">My Watchlist</h2>
          <div className="text-gray-500 bg-white/5 rounded-lg p-12 text-center border border-white/10">
            Your watchlist is empty. Explore and add content to watch later!
          </div>
        </section>
      </div>
    </div>
  );
}
