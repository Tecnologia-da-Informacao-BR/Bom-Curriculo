import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getUser } from "@/api/user/get-user";
import { updateUser } from "@/api/user/update-user";
import { getEnums } from "@/api/misc/get-enums";
import { getApiErrorMessage } from "@/api/client";
import type { EnumOption } from "@/api/misc/get-enums";
import type {
  UserType,
  UserGender,
  UserSkill,
  UserLanguage,
} from "@/types/user-type";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const GENDER_LABEL: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  another: "Outro",
};

function PersonalField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <Input
        type={type}
        className="h-11 rounded-lg border-input-border-strong text-foreground"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default function Settings() {
  const queryClient = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: getUser,
  });

  const { data: enums } = useQuery({
    queryKey: ["enums"],
    queryFn: getEnums,
  });

  const genders = enums?.user_gender ?? [];
  const languageLevels = enums?.user_language_level ?? [];

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  return (
    <ProfileForm
      key={user.id}
      user={user}
      queryClient={queryClient}
      genders={genders}
      languageLevels={languageLevels}
    />
  );
}

function ProfileForm({
  user,
  queryClient,
  genders,
  languageLevels,
}: {
  user: UserType;
  queryClient: ReturnType<typeof useQueryClient>;
  genders: EnumOption[];
  languageLevels: EnumOption[];
}) {
  const [form, setForm] = useState<Partial<UserType>>(user);
  const [skills, setSkills] = useState<UserSkill[]>(user.skills ?? []);
  const [languages, setLanguages] = useState<UserLanguage[]>(
    user.languages ?? [],
  );
  const [skillsInput, setSkillsInput] = useState("");
  const [newLanguage, setNewLanguage] = useState({ language: "", level: "" });
  const [resumeCvFile, setResumeCvFile] = useState<File | null>(null);
  const [resumeLinkedinFile, setResumeLinkedinFile] = useState<File | null>(
    null,
  );
  const [pcdCertificateFile, setPcdCertificateFile] = useState<File | null>(
    null,
  );

  const mutation = useMutation({
    mutationFn: () =>
      updateUser({
        name: form.name,
        social_name: form.social_name,
        phone: form.phone,
        resume_email: form.resume_email,
        github_link: form.github_link,
        site_link: form.site_link,
        linkedin_link: form.linkedin_link,
        gender: form.gender,
        is_pcd: form.is_pcd,
        city: form.city,
        state: form.state,
        country: form.country,
        resume_cv: resumeCvFile,
        resume_linkedin: resumeLinkedinFile,
        path_certificate_pcd: pcdCertificateFile,
        skills,
        experiences: form.experiences,
        qualifications: form.qualifications,
        languages,
        projects: form.projects,
      }),
    onSuccess: (data) => {
      const updated = data.user;
      setForm(updated);
      setSkills(updated.skills ?? []);
      setLanguages(updated.languages ?? []);
      setResumeCvFile(null);
      setResumeLinkedinFile(null);
      setPcdCertificateFile(null);
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Alterações salvas com sucesso!");
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Não foi possível salvar as alterações."),
      );
    },
  });

  function addSkill() {
    if (!skillsInput.trim()) return;
    setSkills((prev) => [...prev, { name: skillsInput.trim() }]);
    setSkillsInput("");
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  function addLanguage() {
    if (!newLanguage.language.trim() || !newLanguage.level.trim()) return;
    setLanguages((prev) => [...prev, newLanguage]);
    setNewLanguage({ language: "", level: "" });
  }

  function removeLanguage(index: number) {
    setLanguages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold text-foreground">
        Configurações do perfil
      </h1>

      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Informações pessoais
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PersonalField
              label="Nome"
              value={form.name ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
            />
            <PersonalField
              label="Nome social"
              value={form.social_name ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, social_name: v }))}
            />
            <PersonalField
              label="Telefone"
              value={form.phone ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            />
            <PersonalField
              label="E-mail do currículo"
              type="email"
              value={form.resume_email ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, resume_email: v }))}
            />
            <PersonalField
              label="Link do GitHub"
              value={form.github_link ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, github_link: v }))}
            />
            <PersonalField
              label="Link do LinkedIn"
              value={form.linkedin_link ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, linkedin_link: v }))}
            />
            <PersonalField
              label="Site / Portfólio"
              value={form.site_link ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, site_link: v }))}
            />
            <PersonalField
              label="Cidade"
              value={form.city ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, city: v }))}
            />
            <PersonalField
              label="Estado"
              value={form.state ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, state: v }))}
            />
            <PersonalField
              label="País"
              value={form.country ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, country: v }))}
            />
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="text-sm font-medium text-foreground">
              Gênero
            </label>
            <select
              className="h-11 rounded-xl border border-input-border-strong bg-background px-3 text-foreground"
              value={form.gender ?? ""}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  gender: (e.target.value || null) as UserGender | null,
                }))
              }
            >
              <option value="">Não informar</option>
              {genders.map((option) => (
                <option key={option.value} value={option.value}>
                  {GENDER_LABEL[option.value] ?? option.value}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-foreground">
            <input
              type="checkbox"
              checked={!!form.is_pcd}
              onChange={(e) =>
                setForm((f) => ({ ...f, is_pcd: e.target.checked }))
              }
              className="h-4 w-4"
            />
            Pessoa com deficiência (PCD)
          </label>
        </section>

        <hr className="border-t border-border" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Documentos
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Currículo (CV)
              </label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                className="h-11 rounded-lg border-input-border-strong text-foreground"
                onChange={(e) =>
                  setResumeCvFile(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Currículo LinkedIn
              </label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                className="h-11 rounded-lg border-input-border-strong text-foreground"
                onChange={(e) =>
                  setResumeLinkedinFile(e.target.files?.[0] ?? null)
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Certificado PCD
              </label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                className="h-11 rounded-lg border-input-border-strong text-foreground"
                onChange={(e) =>
                  setPcdCertificateFile(e.target.files?.[0] ?? null)
                }
              />
            </div>
          </div>
        </section>

        <hr className="border-t border-border" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Habilidades
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill.name}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-foreground"
              >
                {skill.name}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${skill.name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="h-11 rounded-xl border-input-border-strong"
              placeholder="Ex: React"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addSkill()}
            />
            <Button onClick={addSkill}>Adicionar</Button>
          </div>
        </section>

        <hr className="border-t border-border" />

        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Idiomas
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {languages.map((lang, index) => (
              <span
                key={`${lang.language}-${index}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-foreground"
              >
                {lang.language} · {lang.level}
                <button
                  type="button"
                  onClick={() => removeLanguage(index)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${lang.language}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              className="h-11 rounded-xl border-input-border-strong"
              placeholder="Idioma (ex: Inglês)"
              value={newLanguage.language}
              onChange={(e) =>
                setNewLanguage((l) => ({ ...l, language: e.target.value }))
              }
            />
            <select
              className="h-11 rounded-xl border border-input-border-strong bg-background px-3 text-foreground"
              value={newLanguage.level}
              onChange={(e) =>
                setNewLanguage((l) => ({ ...l, level: e.target.value }))
              }
            >
              <option value="">Nível</option>
              {languageLevels.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.value}
                </option>
              ))}
            </select>
            <Button onClick={addLanguage}>Adicionar</Button>
          </div>
        </section>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="bg-brand-secondary text-white hover:bg-brand-secondary/90"
          >
            {mutation.isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </div>
    </div>
  );
}