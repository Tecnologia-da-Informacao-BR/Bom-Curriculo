import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import ResumesHeader from "@/components/Home/ResumesHeader";
import ResumeList from "@/components/Home/ResumeList";
import ResumeListSkeleton from "@/components/Home/ResumeListSkeleton";
import HomeEmptyState from "@/components/Home/HomeEmptyState";
import DeleteResumeDialog from "@/components/Home/DeleteResumeDialog";
import { useUserResumes } from "@/hooks/use-user-resumes";
import { getResumeFile, finishResume } from "@/api/resume";
import { getApiErrorMessage } from "@/api/client";

const RESUME_LIMIT = 5;

export default function MyResumesBKP() {
  const queryClient = useQueryClient();
  const { resumes, analytics, isLoading } = useUserResumes();
  const [resumeToDelete, setResumeToDelete] = useState<{
    id: string;
    fileName?: string;
  } | null>(null);

  const hasResumes = resumes.length > 0;

  const finalizeMutation = useMutation({
    mutationFn: (resumeId: string) => {
      const analytic = analytics.find(
        (item) =>
          item.user_resume_id === resumeId &&
          !!item.header &&
          Object.keys(item.header).length > 0,
      );

      return finishResume({
        user_resume_id: resumeId,
        header: (analytic?.header ?? {}) as Record<string, never>,
        experiences: analytic?.experiences ?? [],
        projects: analytic?.projects ?? [],
        qualifications: analytic?.qualifications ?? [],
        skills: analytic?.skills ?? [],
        languages: analytic?.languages ?? [],
        others: analytic?.others ?? {},
      });
    },
    onSuccess: () => {
      toast.success("Currículo finalizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["user", "resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resumes", "pendings"] });
    },
    onError: (error) => {
      toast.error(
        getApiErrorMessage(error, "Não foi possível finalizar o currículo."),
      );
    },
  });

  async function handleDownload(id: string) {
    try {
      const resume = resumes.find((item) => item.id === id);
      const url = resume?.downloadUrl ?? (await getResumeFile("cv"));
      window.open(url, "_blank");
    } catch (error) {
      console.error("Erro ao gerar arquivo:", error);
      toast.error("Não foi possível baixar o arquivo.");
    }
  }

  function handleFinalize(id: string) {
    const hasAnalysis = analytics.some(
      (item) =>
        item.user_resume_id === id &&
        !!item.header &&
        Object.keys(item.header).length > 0,
    );

    if (!hasAnalysis) {
      toast.warning("Este currículo ainda não tem análise disponível.");
      return;
    }

    finalizeMutation.mutate(id);
  }

  function handleRequestDelete(id: string) {
    const resume = resumes.find((item) => item.id === id) ?? null;
    setResumeToDelete(resume);
  }

  function handleConfirmDelete() {
    if (!resumeToDelete) return;
    toast.warning(
      "A exclusão de currículos ainda não está disponível no servidor.",
    );
    setResumeToDelete(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <ResumesHeader count={resumes.length} limit={RESUME_LIMIT} />

      {isLoading ? (
        <ResumeListSkeleton />
      ) : hasResumes ? (
        <>
          <ResumeList
            resumes={resumes}
            limit={RESUME_LIMIT}
            onDeleteResume={handleRequestDelete}
            onDownloadResume={handleDownload}
            onFinalizeResume={handleFinalize}
          />
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <HomeEmptyState />
        </div>
      )}

      <DeleteResumeDialog
        open={resumeToDelete !== null}
        fileName={resumeToDelete?.fileName}
        onOpenChange={(open) => !open && setResumeToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}