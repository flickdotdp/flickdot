"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-fast-black font-sans text-fast-text">
      <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-fast-red">
          FASTTV
        </h1>
        <p className="mb-8 max-w-2xl text-lg text-fast-text-secondary">
          Welcome to the future of streaming. The premium OTT platform designed for global audiences.
        </p>
        <div className="flex gap-4">
          <Button size="lg" onClick={() => router.push("/home")}>Start Watching</Button>
          <Button variant="outline" size="lg">View Plans</Button>
        </div>
      </main>
    </div>
  );
}

