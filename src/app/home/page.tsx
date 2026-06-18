import { Button } from "@/components/ui/button";
import { Play, Info, ListVideo, Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { VideoRow } from "@/components/home/VideoRow";
import { CatalogSection } from "@/components/home/CatalogSection";
import { SoonOnSite } from "@/components/home/SoonOnSite";
import { SubscribeBanner } from "@/components/home/SubscribeBanner";
import { LatestNews } from "@/components/home/LatestNews";
import { Footer } from "@/components/layout/Footer";

// Normal Video IDs scraped from @flickdotstudio
const heroVideoId = "L7aRxqziN8w"; 
const flickdotVideos = [
  "Uz4Qa37LEKk", "GX1vz0T-dIE", "j20LIzXytJ4", "OBAeyeYSjFQ", "LtOwx_tqJsw", "AvqXCOoCbhw", "XUoYZ5NtKvU", "DgTIKX1CX_g", "WvWD5SugQko", "sL3Pn-Ej5dY", "M2G2soaLPu8", "865eMrWxhTw", "29-CXj5peNM", "m3OvTVPoLUk", "pM_fZtqlks8", "6mBtt8anFh4", "gbb8irtXXv0", "YDtMNjmKjZ4", "0PMFiY3zf9c", "qqX6WUxLMzo", "vad_E5qZXlU", "OIJz6WIvwiw", "tOMUUTf4Rks", "Gc0f6a8ZHQo", "JoFS0bvIXlU", "bAG9roUmlUs", "IGpCJpjIPOs", "Bt46ajXQN-w", "es6ahdjbKxU", "Fz-vuHgHOxM", "fQYnv5PDi78", "Jee5zxUbQr0", "kTmj696cmiM", "yCJIE74w79E", "BY6PAUWj0uY", "dPycSyX7xww", "QUIZSF2BOI0", "wmkuxE1KcAU", "4ZUKk8ZHQWQ", "KErd9s_Cr1I", "BT7IZee-aD8", "JQ621T_PN0s", "L7aRxqziN8w", "xGL5xy_YFyw", "U07SsCE6ZJA", "MR72FmMVffk", "C-a0jpFHizc", "ESJcH-bSONQ"
];

// YouTube Shorts IDs
const flickdotShorts = [
  "1pwbabgcVkQ", "NxzjEwBlzeM", "3MGKaDs-0wA", "ucTLig0Fb5E", "xUFLPav7rPw", "CkcC9Ze-vUY", "xfGuxJCEd5k", "vZNHPac5hJY", "ImgQFaZ-Dqc", "hWdyQ5wfpn4", "DmhcU7tzQ_Q", "5yRXHMHCqb8"
];

const categories = [
  { 
    title: "Flick Originals", 
    videos: ["AvqXCOoCbhw", "L7aRxqziN8w", "j20LIzXytJ4", "Uz4Qa37LEKk"] 
  },
  { 
    title: "Awareness videos", 
    videos: ["WvWD5SugQko", "865eMrWxhTw", "qqX6WUxLMzo", "vad_E5qZXlU", "OIJz6WIvwiw", "tOMUUTf4Rks", "Gc0f6a8ZHQo"] 
  },
  { 
    title: "Flick Short Film", 
    videos: ["U07SsCE6ZJA", "Fz-vuHgHOxM", "fQYnv5PDi78", "Jee5zxUbQr0", "yCJIE74w79E", "BY6PAUWj0uY", "dPycSyX7xww"] 
  },
  { 
    title: "Music videos", 
    videos: ["29-CXj5peNM", "6mBtt8anFh4", "YDtMNjmKjZ4", "0PMFiY3zf9c", "QUIZSF2BOI0"] 
  },
  { 
    title: "Flick Cover Videos", 
    videos: ["OBAeyeYSjFQ", "XUoYZ5NtKvU", "sL3Pn-Ej5dY", "M2G2soaLPu8", "m3OvTVPoLUk", "pM_fZtqlks8", "gbb8irtXXv0"] 
  },
  { 
    title: "Flick Dance Cover", 
    videos: ["kTmj696cmiM", "4ZUKk8ZHQWQ", "KErd9s_Cr1I", "BT7IZee-aD8"] 
  },
  { 
    title: "Ulladakkam", 
    videos: ["vZNHPac5hJY", "GX1vz0T-dIE", "DgTIKX1CX_g", "JoFS0bvIXlU", "bAG9roUmlUs", "Bt46ajXQN-w", "es6ahdjbKxU"] 
  },
  { 
    title: "Cinemayiloode", 
    videos: ["LtOwx_tqJsw", "es6ahdjbKxU", "bAG9roUmlUs"] 
  },
];

const playlists = [
  { title: "Best of Flickdot", id: "PL_1", coverVideo: flickdotVideos[0], count: 12 },
  { title: "Cinematic Showcases", id: "PL_2", coverVideo: flickdotVideos[3], count: 8 },
  { title: "Behind the Scenes", id: "PL_3", coverVideo: flickdotVideos[7], count: 5 },
  { title: "Short Film Collection", id: "PL_4", coverVideo: flickdotVideos[10], count: 15 },
];

export default function HomeDashboard() {
  return (
    <div className="flex min-h-screen flex-col bg-fast-black text-fast-text pb-16 overflow-x-hidden">
      <Navbar />
      {/* Hero Banner (Netflix Style) */}
      <div className="relative min-h-[90vh] w-full bg-fast-black flex flex-col md:flex-row overflow-hidden pt-24 pr-8 pl-24 md:pr-16 md:pl-32">
        {/* Full Width Background Video */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <iframe 
            src={`https://www.youtube.com/embed/${heroVideoId}?autoplay=1&mute=1&loop=1&playlist=${heroVideoId}&playsinline=1&enablejsapi=1`}
            className="absolute inset-0 w-full h-[150%] -top-[25%] opacity-70 scale-125"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          {/* Netflix-style Gradients */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent pointer-events-none" />
          <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none" />
        </div>

        {/* Left Content (Netflix Style) */}
        <div className="w-full md:w-[50%] flex flex-col justify-center z-20 pt-24 pb-32 relative">
          
          {/* F Series Badge */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1 text-[#E50914] font-bold tracking-[0.2em] text-xs">
              <span className="text-2xl leading-none">F</span>
              <span>SERIES</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-8xl font-black text-white mb-4 drop-shadow-2xl uppercase tracking-tight">
            GLOBAL<br/>DOMINANCE
          </h1>

          {/* Top 10 Badge */}
          <div className="flex items-center gap-2 mb-4 drop-shadow-md">
             <div className="bg-[#E50914] text-white font-bold text-[10px] w-6 h-6 rounded-sm shadow-md flex flex-col items-center justify-center leading-none border border-white/20">
                <span className="text-[6px] tracking-tighter">TOP</span>
                <span>10</span>
             </div>
             <span className="text-white font-bold text-xl drop-shadow-md">#1 in TV Shows Today</span>
          </div>
          
          <p className="max-w-xl text-lg text-white font-medium leading-normal mb-8 drop-shadow-xl line-clamp-3">
            An exclusive look into the most breathtaking cinematic achievements of the year. Uncover the truth behind the curtain in this thrilling documentary series.
          </p>

          {/* Action Buttons */}
          <div className="flex gap-4 items-center">
            <Link href={`/watch/${heroVideoId}`}>
              <Button className="bg-white hover:bg-white/80 text-black font-bold text-lg px-8 py-6 rounded-md transition-all shadow-xl">
                <Play className="h-6 w-6 mr-2 fill-black" /> Play
              </Button>
            </Link>
            
            <Button variant="outline" className="bg-gray-500/60 hover:bg-gray-500/40 text-white font-bold text-lg px-8 py-6 rounded-md border-transparent transition-all backdrop-blur-md shadow-xl">
              <Info className="h-6 w-6 mr-2" /> More Info
            </Button>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="flex flex-col gap-12 -mt-32 relative z-30 px-8 pl-24 md:px-16 md:pl-32 mb-24">
        
        {/* First 2 Categories */}
        {categories.slice(0, 2).map((category, catIndex) => (
          <VideoRow key={category.title} title={category.title} catIndex={catIndex}>
            {category.videos.map((videoId, i) => (
              <Link href={`/watch/${videoId}`} key={`${videoId}-${i}`}>
                <div className="group relative h-36 min-w-[250px] md:h-44 md:min-w-[310px] flex-none snap-start rounded-md bg-fast-surface overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg border border-white/5">
                  <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="Video thumbnail" fill className="object-cover" unoptimized />
                  <div className="absolute top-2 left-2 flex items-center justify-center">
                    <div className="h-6 w-4 bg-fast-red flex items-center justify-center text-white font-black text-xs">F</div>
                  </div>
                  {(i === 0 || i === 3) && (
                    <div className="absolute top-0 right-0 bg-fast-red text-white text-[10px] font-black leading-none p-1 flex flex-col items-center justify-center shadow-md">
                      <span>TOP</span><span>10</span>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-fast-red text-white text-[10px] font-bold px-2 py-0.5 rounded-sm shadow-md whitespace-nowrap">
                      {i % 2 === 0 ? "Ajout récent" : "Nouvelle saison"}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="icon" className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 text-white hover:bg-white hover:text-black hover:scale-110 transition-all">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </VideoRow>
        ))}

        {/* Featured Video In-Between */}
        <div className="w-full relative h-64 md:h-96 rounded-2xl overflow-hidden shadow-2xl my-4 border border-white/10 group cursor-pointer">
          <Image src={`https://i.ytimg.com/vi/L7aRxqziN8w/maxresdefault.jpg`} alt="Featured Content" fill className="object-cover group-hover:scale-105 transition-transform duration-700" unoptimized />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute left-8 md:left-16 top-1/2 -translate-y-1/2 flex flex-col items-start z-10 w-full md:w-1/2">
             <span className="text-fast-red font-bold text-xs tracking-widest uppercase mb-2">Featured Premiere</span>
             <h2 className="text-4xl md:text-5xl font-black text-white mb-4 uppercase leading-none drop-shadow-xl">Global<br/>Dominance</h2>
             <p className="text-gray-300 text-sm mb-6 drop-shadow-md line-clamp-2">An exclusive look into the most breathtaking cinematic achievements of the year.</p>
             <Link href={`/watch/L7aRxqziN8w`}>
               <Button className="bg-white text-black hover:bg-gray-200 rounded-sm font-bold px-8 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                 <Play className="h-4 w-4 mr-2 fill-current" /> Play Now
               </Button>
             </Link>
          </div>
        </div>

        {/* Vertical Content Section (Shorts) */}
        <VideoRow title="Flick Vibes">
          {flickdotShorts.map((videoId, i) => (
            <Link href={`/watch/${videoId}`} key={`short-${videoId}-${i}`}>
              <div className="group relative w-40 md:w-48 aspect-[9/16] flex-none snap-start rounded-xl bg-fast-surface overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg border border-white/5">
                <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="Short thumbnail" fill className="object-cover" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="h-10 w-10 rounded-full bg-fast-red/90 backdrop-blur-sm flex items-center justify-center text-white border border-white/20 shadow-[0_0_15px_rgba(255,0,77,0.5)]">
                    <Play className="h-5 w-5 fill-current ml-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </VideoRow>

        {/* Remaining Categories */}
        {categories.slice(2).map((category, catIndex) => (
          <VideoRow key={category.title} title={category.title}>
            {category.videos.map((videoId, i) => (
              <Link href={`/watch/${videoId}`} key={`rem-${videoId}-${i}`}>
                <div className="group relative h-36 min-w-[250px] md:h-44 md:min-w-[310px] flex-none snap-start rounded-md bg-fast-surface overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg border border-white/5">
                  <Image src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="Video thumbnail" fill className="object-cover" unoptimized />
                  <div className="absolute top-2 left-2 flex items-center justify-center">
                    <div className="h-6 w-4 bg-fast-red flex items-center justify-center text-white font-black text-xs">F</div>
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button size="icon" className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 text-white hover:bg-white hover:text-black hover:scale-110 transition-all">
                      <Play className="h-6 w-6 fill-current ml-1" />
                    </Button>
                  </div>
                </div>
              </Link>
            ))}
          </VideoRow>
        ))}

        {/* Playlists Section */}
        <VideoRow title="Featured Playlists">
          {playlists.map((playlist, i) => (
            <Link href={`/playlist/${playlist.id}`} key={`pl-${playlist.id}-${i}`}>
              <div className="group relative h-48 min-w-[280px] md:h-56 md:min-w-[350px] flex-none snap-start rounded-xl bg-fast-surface overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-20 cursor-pointer shadow-lg border border-white/5">
                <Image src={`https://i.ytimg.com/vi/${playlist.coverVideo}/hqdefault.jpg`} alt={playlist.title} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors duration-300" />
                
                {/* Playlist Info Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                  <div className="bg-black/60 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 mb-3 border border-white/20">
                     <Play className="h-4 w-4 text-white" />
                     <span className="text-white text-xs font-bold tracking-widest uppercase">{playlist.count} Videos</span>
                  </div>
                  <h3 className="text-white font-black text-xl text-center uppercase tracking-wide drop-shadow-md">{playlist.title}</h3>
                </div>
              </div>
            </Link>
          ))}
        </VideoRow>

      </div>

      {/* Advanced Footer Sections */}
      <CatalogSection videos={flickdotVideos.slice(15, 25)} />
      <SoonOnSite mainVideo={flickdotVideos[1]} sideVideos={[flickdotVideos[27], flickdotVideos[28]]} />
      <SubscribeBanner bgVideoId={flickdotVideos[29]} />
      <LatestNews videos={[flickdotVideos[35], flickdotVideos[36], flickdotVideos[37], flickdotVideos[38], flickdotVideos[39]]} />
      <Footer />
    </div>
  );
}
