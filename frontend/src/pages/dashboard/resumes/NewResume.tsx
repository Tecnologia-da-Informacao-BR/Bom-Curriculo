import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { createResume, analyseResume, listUserResumes } from "@/api/resume";
import type { CreateResumeSkill } from "@/api/resume";
import { getApiErrorMessage } from "@/api/client";
import {
  Upload,
  Link as LinkIcon,
  Code2,
  FileText,
  Plus,
  Trash2,
  Send,
  AlertCircle,
} from 'lucide-react';
import { ROUTE_LINKS } from '@/constants/RouteLinks';

export type Skill = CreateResumeSkill;

export default function NewResume() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [linkedinPdf, setLinkedinPdf] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');

  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentSkill, setCurrentSkill] = useState<string>('');
  const [currentYears, setCurrentYears] = useState<string>('');

  const mutation = useMutation({
    mutationFn: async () => {
      await createResume({
        resume_cv: resumePdf,
        resume_linkedin: linkedinPdf,
        github_link: githubUrl,
        site_link: portfolioUrl,
        skills,
      });

      const resumes = await listUserResumes();
      const newest = resumes[0];
      if (!newest) {
        throw new Error('Não foi possível localizar o currículo enviado.');
      }

      await analyseResume(newest.id);

      return newest.id;
    },
    onSuccess: (resumeId) => {
      queryClient.invalidateQueries({ queryKey: ["user", "resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resumes", "pendings"] });
      toast.success('Currículo analisado! Confirme os dados.');
      navigate(ROUTE_LINKS.resumeConfirmId(resumeId));
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, 'Erro ao conectar com o servidor. Tente novamente.'));
    },
  });

  const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setResumePdf(e.target.files[0]);
    }
  };

  const handleLinkedinChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLinkedinPdf(e.target.files[0]);
    }
  };

  const handleAddSkill = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!currentSkill.trim()) return;

    const newSkill: Skill = {
      name: currentSkill.trim(),
      years: currentYears ? Number(currentYears) : 0,
    };

    setSkills((prev) => [...prev, newSkill]);
    setCurrentSkill('');
    setCurrentYears('');
  };

  const handleRemoveSkill = (index: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!resumePdf) {
      toast.error('Por favor, anexe o PDF do seu currículo atual (obrigatório).');
      return;
    }

    mutation.mutate();
  };

  return (
    <div className="mx-auto max-w-[850px] px-4 py-6 font-sans text-slate-900">
      <header className="mb-6">
        <h1 className="mb-2 text-[28px] font-bold text-gray-950">Otimizar Novo Currículo</h1>
        <p className="text-[15px] text-slate-500">
          Preencha as informações abaixo para que a IA gere uma versão otimizada para ATS.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">

        <section className="mb-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">1. Documentos PDF</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">
                Currículo Atual <span className="text-red-500">*</span>
              </label>
              <div className="cursor-pointer rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  id="resume_pdf"
                  className="hidden"
                  onChange={handleResumeChange}
                />
                <label htmlFor="resume_pdf" className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600">
                  <Upload size={20} color="#2563eb" />
                  <span>{resumePdf ? resumePdf.name : 'Selecionar arquivo (PDF, DOC ou DOCX)'}</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">PDF do Perfil do LinkedIn (Opcional)</label>
              <div className="cursor-pointer rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  id="linkedin_pdf"
                  className="hidden"
                  onChange={handleLinkedinChange}
                />
                <label htmlFor="linkedin_pdf" className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600">
                  <FileText size={20} color="#0077b5" />
                  <span>{linkedinPdf ? linkedinPdf.name : 'Selecionar PDF do LinkedIn'}</span>
                </label>
              </div>
            </div>

          </div>
        </section>

        <hr className="my-6 border-0 border-t border-slate-100" />

        <section className="mb-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">2. Links e Presença Digital</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Link do GitHub</label>
              <div className="relative flex items-center">
                <Code2 size={18} color="#64748b" className="absolute left-3" />
                <input
                  type="url"
                  placeholder="https://github.com/seu-usuario"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="box-border w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">Link do Portfólio / Site</label>
              <div className="relative flex items-center">
                <LinkIcon size={18} color="#64748b" className="absolute left-3" />
                <input
                  type="url"
                  placeholder="https://seu-portfolio.com"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="box-border w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none"
                />
              </div>
            </div>

          </div>
        </section>

        <hr className="my-6 border-0 border-t border-slate-100" />

        <section className="mb-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">3. Habilidades Principais</h2>
          <p className="-mt-2 mb-3 text-[13px] text-slate-500">Adicione suas hard skills e o tempo de experiência em cada uma.</p>

          <div className="mb-4 flex flex-wrap gap-2.5">
            <input
              type="text"
              placeholder="Ex: React, TypeScript, Node.js..."
              value={currentSkill}
              onChange={(e) => setCurrentSkill(e.target.value)}
              className="box-border rounded-lg border border-slate-300 bg-white py-3 pl-3.5 pr-3 text-sm outline-none"
              style={{ flex: '2 1 200px' }}
            />
            <input
              type="number"
              placeholder="Anos"
              min="0"
              max="50"
              value={currentYears}
              onChange={(e) => setCurrentYears(e.target.value)}
              className="box-border rounded-lg border border-slate-300 bg-white py-3 pl-3.5 pr-3 text-sm outline-none"
              style={{ flex: '1 1 100px' }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="flex h-[42px] items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-600"
            >
              <Plus size={18} />
              <span>Adicionar</span>
            </button>
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((item, index) => (
                <div key={index} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-[13px] text-slate-700">
                  <span><strong>{item.name}</strong> ({item.years} {item.years === 1 ? 'ano' : 'anos'})</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="flex items-center border-none bg-transparent p-0 text-slate-400"
                    title="Remover habilidade"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {mutation.isError && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
            <AlertCircle size={20} />
            <span>{getApiErrorMessage(mutation.error, 'Erro ao conectar com o servidor. Tente novamente.')}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="flex items-center gap-2 rounded-[10px] bg-[#031b5b] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(3,7,18,0.15)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Send size={18} />
            <span>{mutation.isPending ? 'Analisando com IA...' : 'Gerar Currículo com IA'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}