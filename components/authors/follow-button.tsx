"use client";

import { useState } from "react";
import { BellPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function FollowButton({ authorId, initialFollowing, disabled }: { authorId: string; initialFollowing: boolean; disabled?: boolean }) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    if (disabled) {
      router.push("/");
      return;
    }

    setLoading(true);
    const method = following ? "DELETE" : "POST";
    const res = await fetch("/api/follow", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId }),
    });

    if (res.ok) {
      setFollowing(!following);
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <Button variant={following ? "default" : "outline"} className={following ? "bg-emerald-600 text-zinc-950 hover:bg-emerald-500" : "border-zinc-700"} onClick={toggle} disabled={loading}>
      <BellPlus className="mr-2 size-4" /> {following ? "Following" : "Follow"}
    </Button>
  );
}
