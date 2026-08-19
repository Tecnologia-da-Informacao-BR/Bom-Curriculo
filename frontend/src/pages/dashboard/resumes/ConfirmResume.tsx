import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/Home/Header";
import { ResumeReviewStage } from "@/components/resume-upload/ResumeReviewStage";
import {
  reviewSectionsFromAnalytic,
  filterAnalyticBySelection,
} from "@/components/resume-upload/resume-analytic-adapter";
import { getResumeAnalytic, finishResume } from "@/api/resume";
import { getApiErrorMessage } from "@/api/client";

export default function ConfirmResume() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const analyticQuery = useQuery({
    queryKey: ["resume", "analytic", id],
    queryFn: () => getResumeAnalytic(id!),
    enabled: !!id,
  });

  const mutation = useMutation({
    mutationFn: (selectedItemIds: string[]) => {
      const analytic = analyticQuery.data!;
      const filtered = filterAnalyticBySelection(analytic, selectedItemIds);
      return finishResume({
        user_resume_id: analytic.user_resume_id!,
        ...filtered,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "resumes"] });
      queryClient.invalidateQueries({ queryKey: ["resumes", "pendings"] });
      toast.success("Currículo gerado com sucesso!");
      navigate("/meus-curriculos");
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Erro ao gerar o currículo. Tente novamente."));
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col p-6">
        {analyticQuery.isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Carregando dados analisados...</p>
        ) : analyticQuery.isError || !analyticQuery.data ? (
          <p className="text-center text-sm text-destructive">
            Não foi possível carregar a análise desse currículo.
          </p>
        ) : (
          <ResumeReviewStage
            sections={reviewSectionsFromAnalytic(analyticQuery.data)}
            onGenerate={(selectedItemIds) => mutation.mutate(selectedItemIds)}
            isSubmitting={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
