import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/user/get-user";
import { useUserResumes } from "@/hooks/use-user-resumes";
import type { UserResume } from "@/types/resume";
import { ApplicationProgress, type ApplicationDay } from "../../../components/ui/ApplicationProgress";
import { OptimizationChart } from "../../../components/ui/OptimizationChart";
import { Link } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Bell,
    CircleCheck,
    FileText,
    MoreVertical,
    Sparkles,
} from "lucide-react";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

const DAY_ORDER = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

function buildApplicationData(resumes: UserResume[]): ApplicationDay[] {
    const counts = new Map<string, number>();
    DAY_ORDER.forEach((day) => counts.set(day, 0));

    resumes.forEach((resume) => {
        const date = resume.created_at ? new Date(resume.created_at) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        const day = DAY_ORDER[date.getDay()];
        counts.set(day, (counts.get(day) ?? 0) + 1);
    });

    return DAY_ORDER.map((day) => ({ day, value: counts.get(day) ?? 0 }));
}

export default function Home() {
    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: getUser,
    });
    const { resumes, userResumes, isLoading } = useUserResumes();

    const averageScore =
        resumes.length > 0
            ? Math.round(
                  resumes.reduce((sum, resume) => sum + resume.matchPercentage, 0) /
                      resumes.length,
              )
            : 0;

    const applicationData = buildApplicationData(userResumes);

    return (
        <div className="flex-1 p-6 bg-white">
            

            {/* HEADER */}

            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-4xl font-bold leading-tight">
                        Bem-vindo,{" "}
                        <span className="text-brand-primary">
                            {user?.name}
                        </span>
                    </h1>

                    <p className="text-muted-foreground mt-1">
                        Seus currículos otimizados em um só lugar.
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

                        <span className="text-sm font-medium">
                            {user?.name}
                        </span>
                    </div>
                </div>
            </div>

            {/* PRIMEIRA LINHA */}

            <section className="grid grid-cols-[2.2fr_340px] gap-6">

                {/* PERFORMANCE */}

                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="flex gap-8">
                        <div className="flex-shrink-0">
                            <OptimizationChart score={averageScore} />
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="border-transparent bg-brand-primary text-white">
                                    MÉDIA GLOBAL
                                </Badge>
                                <p className="text-sm text-muted-foreground">
                                    {resumes.length > 0
                                        ? `Média de ${averageScore}% entre seus currículos`
                                        : "Envie um currículo para começar"}
                                </p>
                            </div>
                            <h2 className="text-3xl font-bold mt-2">
                                Performance Geral
                            </h2>
                            <p className="mt-4 text-muted-foreground leading-7">
                                {resumes.length > 0
                                    ? "Sua pontuação média reflete a qualidade atual dos seus currículos. Adicione palavras-chave relevantes para elevar o score ATS."
                                    : "Envie seu currículo e a IA analisará sua compatibilidade com sistemas ATS."}
                            </p>

                            <div className="flex gap-2 mt-6">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 px-3 py-1 text-sm font-medium text-brand-primary">
                                    <CircleCheck className="size-4" /> Keywords
                                </span>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary/15 px-3 py-1 text-sm font-medium text-brand-primary">
                                    <CircleCheck className="size-4" /> Formatação
                                </span>
                            </div>
                        </div>
                    </div>

                </div>

                {/* IA */}

                <div className="rounded-2xl border border-l-4 border-brand-primary bg-brand-primary/5 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Sparkles className="size-5 text-brand-primary" />
                        <h3 className="font-bold text-lg">
                            Dicas da IA
                        </h3>
                    </div>
                    <div className="space-y-5">
                        <p className="text-sm text-muted-foreground">
                            Inclua métricas quantitativas na seção de experiências para aumentar o score do seu currículo.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Use palavras-chave específicas da sua área de atuação para melhorar a compatibilidade com sistemas ATS.
                        </p>
                    </div>
                    <Link
                        to={ROUTE_LINKS.newResume}
                        className="mt-8 block w-full rounded-lg border-2 border-brand-primary py-2 text-center font-medium text-brand-primary hover:bg-brand-primary/15"
                    >
                        Otimizar agora
                    </Link>
                </div>
            </section>

            {/* SEGUNDA LINHA */}

            <section className="grid grid-cols-[1fr_340px] gap-6 mt-10 items-start">
                <div>
                    {/* TÍTULO */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-3xl font-bold">
                            Meus Currículos
                        </h2>
                        <Link
                            to={ROUTE_LINKS.myResumes}
                            className="text-brand-primary text-sm font-medium hover:underline"
                        >
                            Ver todos
                        </Link>
                    </div>

                    {/* CARDS */}
                    {isLoading ? (
                        <div className="grid grid-cols-2 gap-6">
                            {[0, 1].map((item) => (
                                <div key={item} className="h-[290px] animate-pulse rounded-2xl bg-slate-200" />
                            ))}
                        </div>
                    ) : resumes.length > 0 ? (
                        <div className="grid grid-cols-2 gap-6">
                            {resumes.slice(0, 4).map((resume) => (
                                <div
                                    key={resume.id}
                                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 min-h-[290px]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex size-12 items-center justify-center rounded-lg bg-brand-primary/10">
                                            <FileText className="size-6 text-brand-primary" />
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-2xl font-bold">
                                                {resume.matchPercentage}
                                            </span>
                                            <span className="text-xs font-medium text-muted-foreground">
                                                ATS SCORE
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h3 className="font-semibold break-all">
                                            {resume.fileName}
                                        </h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Atualizado {resume.updatedLabel}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            {resume.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="secondary">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            aria-label="Mais opções"
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            <MoreVertical className="size-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
                            <p className="font-semibold text-brand-secondary">
                                Nenhum currículo ainda
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Envie seu primeiro currículo para começar a otimizar.
                            </p>
                            <Link
                                to={ROUTE_LINKS.newResume}
                                className="mt-4 inline-block rounded-lg bg-brand-primary px-6 py-2 text-sm font-medium text-white hover:bg-brand-primary/90"
                            >
                                Enviar currículo
                            </Link>
                        </div>
                    )}
                </div>

                <ApplicationProgress data={applicationData} />
            </section>
        </div>
    );
}