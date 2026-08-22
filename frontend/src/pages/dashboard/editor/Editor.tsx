import { Link } from "react-router";
import { PieChart, Pie, Cell } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { getUser } from "@/api/user/get-user";
import { listResumeAnalytics } from "@/api/resume/list-resume-analytics";
import type { ResumeAnalytic } from "@/types/resume";
import {
    Bell,
    CircleCheck,
    CircleUserRound,
    FileText,
    Plus,
    Save,
    Sparkles,
} from "lucide-react";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

const navItems = [
    { label: "Início", to: "/" },
    { label: "Editor", to: "/editor" },
    { label: "Vagas", to: "/vagas" },
];

export default function Editor() {
    const { data: user } = useQuery({
        queryKey: ["me"],
        queryFn: getUser,
    });
    const { data: analytics } = useQuery({
        queryKey: ["resumes", "pendings"],
        queryFn: listResumeAnalytics,
    });

    const analytic: ResumeAnalytic | undefined = [...(analytics ?? [])]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .find((item) => item.header && Object.keys(item.header).length > 0);

    const header = analytic?.header ?? {};
    const experiences = analytic?.experiences ?? [];
    const qualifications = analytic?.qualifications ?? [];
    const projects = analytic?.projects ?? [];
    const skills = analytic?.skills ?? [];
    const languages = analytic?.languages ?? [];

    const rawScore = analytic?.others?.score;
    const atsScore =
        typeof rawScore === "number"
            ? Math.max(0, Math.min(100, Math.round(rawScore)))
            : 0;

    const gaugeData = [
        { name: "Pontuação", value: atsScore },
        { name: "Restante", value: 100 - atsScore },
    ];
    const GAUGE_COLORS = ["var(--color-brand-primary)", "var(--color-border)"];

    const summary =
        typeof header.summary === "string" && header.summary.length > 0
            ? header.summary
            : null;

    const name = typeof header.name === "string" ? header.name : user?.name;
    const location = typeof header.location === "string" ? header.location : null;
    const email = typeof header.email === "string" ? header.email : user?.email;

    return (
        <div className="min-h-screen bg-background">
            {/* TOP BAR */}
            <header className="flex items-center justify-between border-b border-border bg-background px-8 py-3">
                <div className="flex items-center gap-1">
                    <img
                        src="/logo-dark.png"
                        alt="Bom Currículo"
                        className="h-8 w-auto dark:hidden"
                    />
                    <img
                        src="/logo.png"
                        alt="Bom Currículo"
                        className="hidden h-8 w-auto dark:block"
                    />
                    <span className="text-lg font-semibold text-brand-secondary dark:text-white">
                        Bom <span className="text-brand-primary">Currículo</span>
                    </span>
                </div>

                <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    {navItems.map((item) => {
                        const isActive = item.label === "Editor";
                        return (
                            <Link
                                key={item.label}
                                to={item.to}
                                className={
                                    isActive
                                        ? "border-b-2 border-brand-primary pb-1 text-brand-primary"
                                        : "pb-1 hover:text-foreground"
                                }
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground">
                        <Save className="size-4" />
                        Salvo
                    </span>

                    <button
                        type="button"
                        aria-label="Notificações"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Bell className="size-5" />
                    </button>

                    <button
                        type="button"
                        aria-label="Perfil"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <CircleUserRound className="size-6" />
                    </button>
                </div>
            </header>

            {!analytic ? (
                <div className="flex flex-col items-center justify-center gap-4 px-8 py-32 text-center">
                    <FileText className="size-12 text-brand-primary/50" />
                    <h2 className="text-xl font-bold text-brand-secondary">
                        Nenhuma análise disponível
                    </h2>
                    <p className="text-muted-foreground">
                        Envie um currículo e aguarde a inteligência artificial concluir a análise para visualizá-lo aqui.
                    </p>
                    <Link
                        to={ROUTE_LINKS.newResume}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-brand-secondary px-6 py-3 text-sm font-medium text-white hover:bg-brand-secondary/90"
                    >
                        <Plus className="size-4" />
                        Enviar currículo
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-[1fr_380px]">
                    {/* EDITOR / PREVIEW DO CURRÍCULO */}
                    <section className="p-8">
                        <div className="rounded-2xl border border-border bg-card p-10">
                            <div className="text-center">
                                <h1 className="text-4xl font-bold tracking-tight text-brand-secondary">
                                    {(name ?? "Nome").toUpperCase()}
                                </h1>
                                {(location || email) && (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {[location, email].filter(Boolean).join(" • ")}
                                    </p>
                                )}
                            </div>

                            {summary && (
                                <div className="mt-10">
                                    <h2 className="text-xl font-bold text-brand-secondary">
                                        Resumo Profissional
                                    </h2>
                                    <div className="mt-2 border-t border-border" />
                                    <p className="mt-4 leading-7 text-muted-foreground">
                                        {summary}
                                    </p>
                                </div>
                            )}

                            {experiences.length > 0 && (
                                <div className="mt-10">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-brand-secondary">
                                            Experiência Profissional
                                        </h2>
                                    </div>
                                    <div className="mt-2 border-t border-border" />

                                    <div className="mt-6 space-y-6">
                                        {experiences.map((exp, index) => (
                                            <div key={index}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="font-semibold text-brand-secondary">
                                                        {exp.role}
                                                    </h3>
                                                    <span className="shrink-0 text-sm text-muted-foreground">
                                                        {formatPeriod(exp.start, exp.end, exp.is_actual)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-brand-primary">
                                                    {exp.company}
                                                </p>
                                                {exp.description && (
                                                    <p className="mt-2 leading-7 text-muted-foreground">
                                                        {exp.description}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {qualifications.length > 0 && (
                                <div className="mt-10">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-bold text-brand-secondary">
                                            Educação
                                        </h2>
                                    </div>
                                    <div className="mt-2 border-t border-border" />

                                    <div className="mt-6 space-y-6">
                                        {qualifications.map((edu, index) => (
                                            <div key={index}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="font-semibold text-brand-secondary">
                                                        {edu.title}
                                                    </h3>
                                                    <span className="shrink-0 text-sm text-muted-foreground">
                                                        {formatPeriod(edu.start, edu.end)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {edu.institution}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {projects.length > 0 && (
                                <div className="mt-10">
                                    <h2 className="text-xl font-bold text-brand-secondary">
                                        Projetos
                                    </h2>
                                    <div className="mt-2 border-t border-border" />
                                    <div className="mt-6 space-y-6">
                                        {projects.map((project, index) => (
                                            <div key={index}>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="font-semibold text-brand-secondary">
                                                        {project.title}
                                                    </h3>
                                                    <span className="shrink-0 text-sm text-muted-foreground">
                                                        {formatPeriod(project.start, project.end)}
                                                    </span>
                                                </div>
                                                {project.description && (
                                                    <p className="mt-2 leading-7 text-muted-foreground">
                                                        {project.description}
                                                    </p>
                                                )}
                                                {project.technologies && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {String(project.technologies)
                                                            .split(",")
                                                            .map((tech) => tech.trim())
                                                            .filter(Boolean)
                                                            .map((tech) => (
                                                                <span key={tech} className="rounded-full bg-brand-primary-tint px-3 py-1 text-xs font-medium text-brand-secondary">
                                                                    {tech}
                                                                </span>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* PAINEL DE ANÁLISE ATS */}
                    <aside className="flex flex-col justify-between border-l border-border bg-brand-primary/5 p-8">
                        <div>
                            <h2 className="text-xl font-bold text-brand-secondary">
                                Análise em Tempo Real
                            </h2>

                            <div className="mt-6 flex flex-col items-center">
                                <div className="relative size-[160px]">
                                    <PieChart width={160} height={160}>
                                        <Pie
                                            data={gaugeData}
                                            dataKey="value"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={58}
                                            outerRadius={72}
                                            startAngle={90}
                                            endAngle={-270}
                                            stroke="none"
                                        >
                                            {gaugeData.map((entry, index) => (
                                                <Cell key={entry.name} fill={GAUGE_COLORS[index]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-bold text-brand-primary">
                                            {atsScore}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            Pontuação ATS
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-border" />

                            <div className="mt-6">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-secondary">
                                        Habilidades
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {skills.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">Nenhuma habilidade identificada.</p>
                                    ) : (
                                        skills.map((skill, index) => (
                                            <span key={index} className="inline-flex items-center gap-1 rounded-full bg-brand-primary-tint px-3 py-1 text-xs font-medium text-brand-primary">
                                                <CircleCheck className="size-3.5" />
                                                {skill.name}
                                            </span>
                                        ))
                                    )}
                                </div>
                            </div>

                            {languages.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-semibold text-brand-secondary">Idiomas</h3>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {languages.map((lang, index) => (
                                            <span key={index} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                                {lang.language} · {lang.level}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 rounded-xl border-l-4 border-brand-primary bg-card p-4 shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="size-4 text-brand-primary" />
                                    <h3 className="text-sm font-semibold text-brand-secondary">
                                        Dica
                                    </h3>
                                </div>
                                <p className="mt-2 text-sm text-muted-foreground italic">
                                    Adicione métricas quantitativas e palavras-chave da sua área para elevar a pontuação ATS.
                                </p>
                            </div>
                        </div>

                        <Link
                            to={ROUTE_LINKS.myResumes}
                            className="sticky bottom-8 mt-8 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-secondary py-3 font-medium text-brand-secondary-foreground hover:bg-brand-secondary/90"
                        >
                            <FileText className="size-4" />
                            Meus currículos
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    );
}

function formatPeriod(
    start?: string | null,
    end?: string | null,
    isActual?: boolean | null,
): string {
    if (isActual) return "Atual";
    if (!start && !end) return "";
    if (start && !end) return start;
    if (!start && end) return String(end);
    return `${start} - ${end}`;
}