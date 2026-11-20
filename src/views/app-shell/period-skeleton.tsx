import { Skeleton } from "@/shared/ui/skeleton";

export function PeriodSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-8 w-28 justify-self-center" />
    </div>
  );
}
