import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

type DataTablePaginationProps = {
  page: number;
  rangeStart: number;
  rangeEnd: number;
  hasPrev: boolean;
  hasNext: boolean;
  isLoading?: boolean;
  onPrev: () => void;
  onNext: () => void;
  className?: string;
};

export function DataTablePagination({
  page,
  rangeStart,
  rangeEnd,
  hasPrev,
  hasNext,
  isLoading,
  onPrev,
  onNext,
  className,
}: DataTablePaginationProps) {
  if (rangeEnd === 0 && !isLoading) return null;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 ${className ?? ""}`}
    >
      <p className="text-sm text-muted-foreground">
        {isLoading ? (
          "Loading…"
        ) : rangeEnd > 0 ? (
          <>
            Showing <span className="font-medium text-foreground">{rangeStart}–{rangeEnd}</span>
          </>
        ) : (
          "No results"
        )}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!hasPrev || isLoading}
          onClick={onPrev}
        >
          <ChevronLeft className="size-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground px-1 tabular-nums">Page {page}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={!hasNext || isLoading}
          onClick={onNext}
        >
          Next
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
