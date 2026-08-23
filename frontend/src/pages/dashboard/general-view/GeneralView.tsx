import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Bell, CircleCheck, FileText, Sparkles } from "lucide-react";

import { getUser } from "@/api/user/get-user";
import { getResumes, RESUMES_QUERY_KEY } from "@/api/resume/resume-api";
import { ApplicationProgress } from "@/components/ui/ApplicationProgress";
import { OptimizationChart } from "@/components/ui/OptimizationChart";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { resumeDateLabel, resumeFileName, resumeScore } from "@/lib/resume-data";

export default function GeneralView() {
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: getUser,
  });
  const resumesQuery = useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getResumes,
  });

  const resumes = resumesQuery.data || [];
  const analyzedResumes = resumes.filter((resume) => resumeScore(resume.analytic) !== null);
  const scores = analyzedResumes.map((resume) => resumeScore(resume.analytic) as number);
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length)
    : 0;
  const latestAnalyzedResume = resumes.find((resume) => resume.analytic?.status === "ready");
  const latestAnalytic = latestAnalyzedResume?.analytic;
  const identifiedSkills = Array.from(new Set(
    analyzedResumes.flatMap((resume) => (resume.analytic?.skills || []).map((skill) => skill.name)),
  )).slice(0, 4);

  return (
    <div className="w-full max-w-[1450px] mx-auto px-6 py-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold leading-tight">
            Bem-vindo, <span className="text-brand-primary">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Seus currículos analisados em um só lugar.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Notificações"
            className="text-brand-secondary transition-colors hover:text-brand-primary"
          >
            <Bell className="size-6" />
          </button>
          <div className="flex items-center gap-3 rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1.5">
            <Avatar className="size-8">
              <AvatarFallback className="size-full bg-brand-primary text-white text-xs font-semibold">
                {user?.name?.[0]}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{user?.name}</span>
          </div>
        </div>
      </div>

      <section className="grid grid-cols-[2.2fr_340px] gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex gap-8">
            <div className="flex-shrink-0">
              <OptimizationChart score={averageScore} />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-transparent bg-brand-primary text-white">
                  MÉDIA ATS
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {analyzedResumes.length} {analyzedResumes.length === 1 ? "currículo analisado" : "currículos analisados"}
                </p>
              </div>
              <h2 className="text-3xl font-bold mt-2">Performance Geral</h2>
              <p className="mt-4 text-muted-foreground leading-7">
                {latestAnalytic?.suggestion || "Envie um currículo para receber a pontuação e a sugestão da análise ATS."}
              </p>

              {identifiedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {identifiedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 px-3 py-1 text-sm font-medium text-brand-primary"
                    >
                      <CircleCheck className="size-4" /> {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="size-5 text-brand-primary" />
            <h2 className="text-xl font-bold">Sugestão da IA</h2>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">
            {latestAnalytic?.suggestion || "A sugestão aparecerá aqui depois que o bot concluir a primeira análise."}
          </p>
          {latestAnalyzedResume && (
            <Link
              to={`/editor?resume=${latestAnalyzedResume.id}`}
              className="mt-8 inline-flex w-full justify-center rounded-lg border-2 border-brand-primary py-2 font-medium text-brand-primary hover:bg-brand-primary/15"
            >
              Ver análise
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-[1fr_340px] gap-6 mt-10 items-start">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl font-bold">Meus Currículos</h2>
            <Link to="/my-resume" className="text-brand-primary text-sm font-medium hover:underline">
              Ver todos
            </Link>
          </div>

          {resumesQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando currículos...</p>
          ) : resumesQuery.isError ? (
            <p role="alert" className="text-sm text-destructive">{resumesQuery.error.message}</p>
          ) : resumes.length === 0 ? (
            <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
              Nenhum currículo enviado ainda.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {resumes.slice(0, 2).map((resume) => {
                const score = resumeScore(resume.analytic);
                const tags = (resume.analytic?.skills || []).slice(0, 3);

                return (
                  <Link
                    key={resume.id}
                    to={`/editor?resume=${resume.id}`}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 min-h-[260px] transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex size-12 items-center justify-center rounded-lg bg-brand-primary/10">
                        <FileText className="size-6 text-brand-primary" />
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-bold">{score ?? "—"}</span>
                        <span className="text-xs font-medium text-muted-foreground">ATS SCORE</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-semibold break-all">{resumeFileName(resume)}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Atualizado {resumeDateLabel(resume.processed_at || resume.updated_at)}
                      </p>
                    </div>

                    {tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {tags.map((tag) => <Badge key={tag.name} variant="secondary">{tag.name}</Badge>)}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <ApplicationProgress />
      </section>
    </div>
  );
}
