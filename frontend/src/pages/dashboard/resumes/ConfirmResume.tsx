import { useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Header } from "@/components/Home/Header";
import { ResumeReviewStage } from "@/components/resume-upload/ResumeReviewStage";
import {
  reviewSectionsFromAnalytic,
  filterAnalyticBySelection,
} from "@/components/resume-upload/resume-analytic-adapter";
import { listResumeAnalytics, finishResume } from "@/api/resume";
import { getApiErrorMessage } from "@/api/client";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

export default function ConfirmResume() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const analyticsQuery = useQuery({
    queryKey: ["resumes", "pendings"],
    queryFn: listResumeAnalytics,
    enabled: !!id,
  });

  const analytic = analyticsQuery.data?.find((item) => item.user_resume_id === id);

  const mutation = useMutation({
    mutationFn: (selectedItemIds: string[]) => {
      if (!analytic) throw new Error("Análise não encontrada.");
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
      navigate(ROUTE_LINKS.myResumes);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error, "Erro ao gerar o currículo. Tente novamente."));
    },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col p-6">
        {analyticsQuery.isLoading ? (
          <p className="text-center text-sm text-muted-foreground">Carregando dados analisados...</p>
        ) : analyticsQuery.isError || !analytic ? (
          <p className="text-center text-sm text-destructive">
            Não foi possível carregar a análise desse currículo.
          </p>
        ) : (
          <ResumeReviewStage
            sections={reviewSectionsFromAnalytic(analytic)}
            onGenerate={(selectedItemIds) => mutation.mutate(selectedItemIds)}
            isSubmitting={mutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
