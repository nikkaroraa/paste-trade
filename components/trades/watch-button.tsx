"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function WatchButton({ tradeId, initialWatched, disabled }: { tradeId: string; initialWatched: boolean; disabled?: boolean }) {
  const [watched, setWatched] = useState(initialWatched);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (disabled) {
      router.push("/");
      return;
    }

    setLoading(true);
    const method = watched ? "DELETE" : "POST";
    const res = await fetch("/api/watchlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradeId }),
    });

    if (res.ok) {
      setWatched(!watched);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Button variant={watched ? "default" : "outline"} className={watched ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500" : "border-zinc-700"} onClick={toggle} disabled={loading}>
      <Bookmark className="mr-2 size-4" /> {watched ? "Watching" : "Watch"}
    </Button>
  );
}
