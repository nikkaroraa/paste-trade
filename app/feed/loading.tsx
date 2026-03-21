import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full bg-zinc-800" />)}</div>;
}
