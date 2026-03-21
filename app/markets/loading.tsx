import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full bg-zinc-800" />)}</div>;
}
