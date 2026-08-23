import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router";
import { CircleUserRound, Sparkles } from "lucide-react";

import { getResumes, RESUMES_QUERY_KEY } from "@/api/resume/resume-api";
import { OptimizationChart } from "@/components/ui/OptimizationChart";
import { resumeFileName, resumeScore } from "@/lib/resume-data";

const navItems = [
  { label: "Dashboard", to: "/dashboard" },
  { label: "Editor", to: "/editor" },
  { label: "Vagas", to: "/job-analysis" },
  { label: "Preços", to: "/" },
];

function period(start?: string | null, end?: string | null, current = false) {
  return [start, current ? "Atual" : end].filter(Boolean).join(" — ");
}

function readableType(value: string) {
  return value.replaceAll("_", " ");
}

export default function Editor() {
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get("resume");
  const resumesQuery = useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getResumes,
  });

  const resumes = resumesQuery.data || [];
  const resume = resumes.find((item) => item.id === resumeId) || resumes[0];
  const analytic = resume?.analytic;
  const header = analytic?.header || {};
  const score = resumeScore(analytic) ?? 0;
  const contactLine = [header.location, header.email || header.emails, header.contacts]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b border-border bg-background px-8 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-1">
            <img src="/logo-dark.png" alt="BomCurriculo" className="h-8 w-auto dark:hidden" />
            <img src="/logo.png" alt="BomCurriculo" className="hidden h-8 w-auto dark:block" />
            <span className="text-lg font-semibold text-brand-secondary dark:text-white">
              Bom <span className="text-brand-primary">Currículo</span>
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={item.label === "Editor"
                  ? "border-b-2 border-brand-primary pb-1 text-brand-primary"
                  : "pb-1 hover:text-foreground"}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <CircleUserRound className="size-6 text-muted-foreground" aria-label="Perfil" />
      </header>

      {resumesQuery.isLoading ? (
        <p className="p-8 text-sm text-muted-foreground">Carregando análise...</p>
      ) : resumesQuery.isError ? (
        <p role="alert" className="p-8 text-sm text-destructive">{resumesQuery.error.message}</p>
      ) : !resume ? (
        <div className="p-8">
          <p className="text-muted-foreground">Nenhum currículo foi enviado.</p>
          <Link to="/my-curriculum" className="mt-4 inline-block text-brand-primary hover:underline">
            Enviar currículo
          </Link>
        </div>
      ) : !analytic || analytic.status !== "ready" ? (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-brand-secondary">{resumeFileName(resume)}</h1>
          <p className={resume.status === "fail" ? "mt-3 text-destructive" : "mt-3 text-muted-foreground"}>
            {resume.status === "fail"
              ? resume.observation || "A análise não pôde ser concluída."
              : "A análise deste currículo ainda está em processamento."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_380px]">
          <section className="p-8">
            <div className="rounded-2xl border border-border bg-card p-10">
              <div className="text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {resumeFileName(resume)}
                </p>
                <h1 className="text-4xl font-bold tracking-tight text-brand-secondary">
                  {(header.name || "Nome não identificado").toUpperCase()}
                </h1>
                {header.headline && <p className="mt-2 font-medium text-brand-primary">{header.headline}</p>}
                {contactLine && <p className="mt-2 text-sm text-muted-foreground">{contactLine}</p>}
                {Object.keys(header.links || {}).length > 0 && (
                  <div className="mt-2 flex flex-wrap justify-center gap-3 text-sm">
                    {Object.entries(header.links || {}).map(([label, url]) => (
                      <a key={label} href={url} target="_blank" rel="noreferrer" className="text-brand-primary hover:underline">
                        {label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {analytic.professional_summary && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Resumo Profissional</h2>
                  <div className="mt-2 border-t border-border" />
                  <p className="mt-4 leading-7 text-muted-foreground">{analytic.professional_summary}</p>
                </div>
              )}

              {(analytic.experiences || []).length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Experiência Profissional</h2>
                  <div className="mt-2 border-t border-border" />
                  <div className="mt-6 space-y-6">
                    {(analytic.experiences || []).map((experience, index) => (
                      <div key={`${experience.company}-${experience.role}-${index}`}>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold text-brand-secondary">{experience.role}</h3>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {period(experience.start, experience.end, Boolean(experience.is_actual))}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-brand-primary">{experience.company}</p>
                        {experience.description && (
                          <p className="mt-2 whitespace-pre-line leading-7 text-muted-foreground">{experience.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(analytic.qualifications || []).length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Formação</h2>
                  <div className="mt-2 border-t border-border" />
                  <div className="mt-6 space-y-5">
                    {(analytic.qualifications || []).map((qualification, index) => (
                      <div key={`${qualification.institution}-${qualification.title}-${index}`}>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold text-brand-secondary">{qualification.title}</h3>
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {period(qualification.start, qualification.end, Boolean(qualification.is_coursing))}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{qualification.institution}</p>
                        <p className="mt-1 text-xs capitalize text-muted-foreground">{readableType(qualification.type)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(analytic.projects || []).length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Projetos</h2>
                  <div className="mt-2 border-t border-border" />
                  <div className="mt-6 space-y-5">
                    {(analytic.projects || []).map((project, index) => (
                      <div key={`${project.title}-${index}`}>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="font-semibold text-brand-secondary">{project.title}</h3>
                          <span className="shrink-0 text-sm text-muted-foreground">{period(project.start, project.end)}</span>
                        </div>
                        {project.technologies && <p className="text-sm font-medium text-brand-primary">{project.technologies}</p>}
                        {project.description && <p className="mt-2 leading-7 text-muted-foreground">{project.description}</p>}
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brand-primary hover:underline">
                            Ver projeto
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(analytic.skills || []).length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Habilidades</h2>
                  <div className="mt-2 border-t border-border" />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(analytic.skills || []).map((skill, index) => (
                      <span key={`${skill.name}-${index}`} className="rounded-full bg-brand-primary/10 px-3 py-1 text-sm text-brand-secondary">
                        {skill.name}{skill.years == null ? "" : ` · ${skill.years} ${skill.years === 1 ? "ano" : "anos"}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(analytic.languages || []).length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-bold text-brand-secondary">Idiomas</h2>
                  <div className="mt-2 border-t border-border" />
                  <ul className="mt-4 space-y-2 text-muted-foreground">
                    {(analytic.languages || []).map((language, index) => (
                      <li key={`${language.language}-${index}`}>
                        <span className="font-medium text-brand-secondary">{language.language}</span> — {language.level}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          <aside className="border-l border-border bg-brand-primary/5 p-8">
            <h2 className="text-xl font-bold text-brand-secondary">Análise ATS</h2>
            <div className="mt-6 flex justify-center">
              <OptimizationChart score={score} />
            </div>

            {analytic.score !== null && analytic.original_score !== null && analytic.score !== analytic.original_score && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Versão estruturada pela IA: <strong className="text-brand-secondary">{analytic.score}%</strong>
              </p>
            )}

            {analytic.suggestion && (
              <div className="mt-8 rounded-xl border-l-4 border-brand-primary bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-brand-primary" />
                  <h3 className="text-sm font-semibold text-brand-secondary">Sugestão da análise</h3>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{analytic.suggestion}</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
