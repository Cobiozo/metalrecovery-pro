import type { ProcessCompareResult } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatMass } from "@/lib/format";
import { TrendingUp, AlertTriangle, ArrowRight, Clock } from "lucide-react";

type ProfitabilityRating = "very_profitable" | "profitable" | "marginal" | "not_profitable";

const RATING_CONFIG: Record<
  ProfitabilityRating,
  { label: string; bg: string; text: string; border: string }
> = {
  very_profitable: {
    label: "Bardzo opłacalne",
    bg: "bg-success/10",
    text: "text-success",
    border: "border-success/30",
  },
  profitable: {
    label: "Opłacalne",
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/30",
  },
  marginal: {
    label: "Marginalnie",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/30",
  },
  not_profitable: {
    label: "Nieopłacalne",
    bg: "bg-destructive/10",
    text: "text-destructive",
    border: "border-destructive/30",
  },
};

interface ProcessCompareTableProps {
  data: ProcessCompareResult[];
  onSelectProcess: (processId: string) => void;
  isSelecting?: boolean;
  selectedProcessId?: string;
}

export function ProcessCompareTable({
  data,
  onSelectProcess,
  isSelecting,
  selectedProcessId,
}: ProcessCompareTableProps) {
  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground text-sm">
        Brak danych do wyświetlenia.
      </div>
    );
  }

  const best = data[0];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Wszystkie procesy obliczone przy domyślnych parametrach (optymalna temperatura, standardowe
        stężenia). Kliknij wiersz aby zobaczyć pełne wyniki dla wybranego procesu.
      </p>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent bg-muted/30">
              <TableHead className="w-8 text-center">#</TableHead>
              <TableHead>Proces</TableHead>
              <TableHead className="text-right">Zysk netto</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Przychód</TableHead>
              <TableHead className="text-right hidden md:table-cell">Koszt</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Au</TableHead>
              <TableHead className="text-right hidden lg:table-cell">Ag</TableHead>
              <TableHead className="text-right hidden md:table-cell">Czas</TableHead>
              <TableHead className="text-center">Ocena</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, idx) => {
              const rating = row.profitabilityRating as ProfitabilityRating;
              const cfg = RATING_CONFIG[rating] ?? RATING_CONFIG.not_profitable;
              const isTop = idx === 0;
              const isCurrent = row.processId === selectedProcessId;

              return (
                <TableRow
                  key={row.processId}
                  className={`border-border cursor-pointer transition-colors ${
                    isCurrent
                      ? "bg-primary/5 border-l-2 border-l-primary"
                      : isTop
                        ? "bg-success/5 hover:bg-success/10"
                        : "hover:bg-muted/30"
                  }`}
                  onClick={() => onSelectProcess(row.processId)}
                >
                  <TableCell className="text-center font-bold text-muted-foreground text-sm">
                    {isTop ? (
                      <TrendingUp className="h-4 w-4 text-success mx-auto" />
                    ) : (
                      idx + 1
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="font-medium leading-tight">{row.processName}</div>
                    {isTop && best && (
                      <div className="text-xs text-success mt-0.5">Najlepszy wybór</div>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <span
                      className={`font-mono font-bold ${
                        row.netProfitPln >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(row.netProfitPln)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right hidden sm:table-cell">
                    <span className="font-mono text-sm text-muted-foreground">
                      {formatCurrency(row.totalRevenuePln)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right hidden md:table-cell">
                    <span className="font-mono text-sm text-muted-foreground">
                      -{formatCurrency(row.totalCostPln)}
                    </span>
                  </TableCell>

                  <TableCell className="text-right hidden lg:table-cell">
                    <span className="font-mono text-xs">
                      {row.auMassGrams > 0 ? formatMass(row.auMassGrams, "g") : "—"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right hidden lg:table-cell">
                    <span className="font-mono text-xs">
                      {row.agMassGrams > 0 ? formatMass(row.agMassGrams, "g") : "—"}
                    </span>
                  </TableCell>

                  <TableCell className="text-right hidden md:table-cell">
                    <span className="font-mono text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Clock className="h-3 w-3" />
                      {row.estimatedTimeHours}h
                    </span>
                  </TableCell>

                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {rating === "not_profitable" ? (
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                      ) : (
                        <TrendingUp className="h-3 w-3 shrink-0" />
                      )}
                      <span className="hidden sm:inline">{cfg.label}</span>
                    </span>
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant={isCurrent ? "default" : "outline"}
                      className="h-7 text-xs"
                      disabled={isSelecting}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProcess(row.processId);
                      }}
                    >
                      {isSelecting && isCurrent ? (
                        "..."
                      ) : (
                        <>
                          Wybierz
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
