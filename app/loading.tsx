import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-64 bg-zinc-800" />
      <Skeleton className="h-24 w-full bg-zinc-800" />
      <Skeleton className="h-24 w-full bg-zinc-800" />
      <Skeleton className="h-24 w-full bg-zinc-800" />
    </div>
  );
}
