import { Button } from "@/components/ui/button";

export interface ReviewItem {
  id: string;
  title: string;
  description?: string;
}

export interface ReviewSection {
  id: string;
  title: string;
  items: ReviewItem[];
}

interface ResumeReviewStageProps {
  sections: ReviewSection[];
  onContinue: () => void;
}

export function ResumeReviewStage({ sections, onContinue }: ResumeReviewStageProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-brand-secondary md:text-3xl dark:text-foreground">
            Dados identificados pela IA
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confira as informações estruturadas a partir do currículo enviado.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              <h2 className="text-sm font-semibold text-brand-secondary">{section.title}</h2>
              <ul className="mt-2 space-y-2">
                {section.items.map((item) => (
                  <li key={item.id}>
                    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={onContinue}>
          Ver currículo analisado
        </Button>
      </div>
    </div>
  );
}
