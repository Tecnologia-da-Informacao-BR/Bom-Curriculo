import React, { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import {
  Upload,
  Link as LinkIcon,
  Code2,
  FileText,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface Skill {
  name: string;
  years: number;
}

interface StatusMessage {
  type: 'success' | 'error';
  text: string;
}

export default function SendCurriculumForm() {
  const [resumePdf, setResumePdf] = useState<File | null>(null);
  const [linkedinPdf, setLinkedinPdf] = useState<File | null>(null);
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [portfolioUrl, setPortfolioUrl] = useState<string>('');

  const [skills, setSkills] = useState<Skill[]>([]);
  const [currentSkill, setCurrentSkill] = useState<string>('');
  const [currentYears, setCurrentYears] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<StatusMessage | null>(null);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!resumePdf) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, anexe o PDF do seu currículo atual (obrigatório).'
      });
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('resume_pdf', resumePdf);
    if (linkedinPdf) formData.append('linkedin_pdf', linkedinPdf);
    formData.append('github_url', githubUrl);
    formData.append('portfolio_url', portfolioUrl);
    formData.append('skills', JSON.stringify(skills));

    try {
      await axios.post('/api/resumes/optimize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setStatusMessage({
        type: 'success',
        text: 'Dados enviados com sucesso! A IA está processando o currículo.'
      });

      setResumePdf(null);
      setLinkedinPdf(null);
      setGithubUrl('');
      setPortfolioUrl('');
      setSkills([]);
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      const apiErrorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setStatusMessage({
        type: 'error',
        text: apiErrorMessage || 'Erro ao conectar com o servidor. Tente novamente.'
      });
    } finally {
      setLoading(false);
    }
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
                Currículo Atual (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="cursor-pointer rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept=".pdf"
                  id="resume_pdf"
                  className="hidden"
                  onChange={handleResumeChange}
                />
                <label htmlFor="resume_pdf" className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600">
                  <Upload size={20} color="#2563eb" />
                  <span>{resumePdf ? resumePdf.name : 'Selecionar arquivo PDF'}</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-700">PDF do Perfil do LinkedIn (Opcional)</label>
              <div className="cursor-pointer rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <input
                  type="file"
                  accept=".pdf"
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

        {statusMessage && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
              statusMessage.type === 'error'
                ? 'bg-red-50 text-red-800'
                : 'bg-green-50 text-green-800'
            }`}
          >
            {statusMessage.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-[10px] bg-[#031b5b] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_12px_rgba(3,7,18,0.15)]"
          >
            <Send size={18} />
            <span>{loading ? 'Processando dados...' : 'Gerar Currículo com IA'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}