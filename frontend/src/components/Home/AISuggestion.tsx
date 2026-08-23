import { Bot } from "lucide-react";
import { Button } from "../ui/button";

interface AISuggestionProps {
  suggestion: string;
  onOptimize?: () => void;
}

export default function AISuggestion({
  suggestion,
  onOptimize,
}: AISuggestionProps) {
  return (
    <aside
      aria-label="Sugestão da IA"
      className="mt-6 flex flex-col lg:flex-row lg:items-center gap-4 border-l-4 border-brand-primary bg-brand-primary/10 p-5 sm:p-6"
    >
      <div className="flex items-start md:items-center justify-center gap-4 sm:flex-1">
        <span
          aria-hidden="true"
          className="hidden sm:flex size-10 lg:size-12 shrink-0 items-center justify-center rounded-full bg-brand-primary text-white"
        >
          <Bot className="size-5 lg:size-7" />
        </span>
        <div>
          <h3 className="font-bold text-sm lg:text-base xl:text-lg text-brand-secondary">
            Sugestão da análise ATS
          </h3>
          <p className="mt-1 text-xs lg:text-sm xl:text-base text-muted-foreground">
            {suggestion}
          </p>
        </div>
      </div>
      {onOptimize && (
        <Button
          type="button"
          onClick={onOptimize}
          className="h-9 lg:h-11 shrink-0 rounded-lg bg-brand-secondary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-secondary/90 "
        >
          Ver análise
        </Button>
      )}
    </aside>
  );
}
