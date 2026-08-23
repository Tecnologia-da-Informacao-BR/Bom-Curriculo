import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";

import { Header } from "@/components/Home/Header";
import ResumesHeader from "@/components/Home/ResumesHeader";
import AISuggestion from "@/components/Home/AISuggestion";
import HomeEmptyState from "@/components/Home/HomeEmptyState";
import ResumeListSkeleton from "@/components/Home/ResumeListSkeleton";
import ResumeProcessingState from "@/components/Home/ResumeProcessingState";
import ResumeList from "@/components/Home/ResumeList";
import { ResumeUploadStage } from "@/components/resume-upload/ResumeUploadStage";
import { ResumeReviewStage } from "@/components/resume-upload/ResumeReviewStage";
import { useResumeFile } from "@/hooks/use-resume-file";
import { getResumes, RESUMES_QUERY_KEY, uploadResume } from "@/api/resume/resume-api";
import { toResumeCard, toReviewSections } from "@/lib/resume-data";
import type { UserResume } from "@/types/resume-type";

const RESUME_LIMIT = 5;

type OnboardingStage = "idle" | "uploading" | "processing" | "reviewing";

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [stage, setStage] = useState<OnboardingStage>("idle");
  const [processedResume, setProcessedResume] = useState<UserResume | null>(null);
  const { file, error, acceptedExtensions, maxSizeMB, selectFile, removeFile } = useResumeFile();

  const resumesQuery = useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getResumes,
  });
  const uploadMutation = useMutation({
    mutationFn: (resumeFile: File) => uploadResume({ resumeCv: resumeFile }),
    onSuccess: async (resume) => {
      setProcessedResume(resume);
      setStage("reviewing");
      removeFile();
      await queryClient.invalidateQueries({ queryKey: RESUMES_QUERY_KEY });
    },
    onError: (uploadError: Error) => {
      setStage("uploading");
      toast.error(uploadError.message);
    },
  });

  const resumes = resumesQuery.data || [];
  const cards = resumes.map(toResumeCard);
  const latestSuggestedResume = resumes.find((resume) => resume.analytic?.suggestion);
  const latestSuggestion = latestSuggestedResume?.analytic?.suggestion;
  const reviewSections = toReviewSections(processedResume?.analytic);

  function handleCancelUpload() {
    removeFile();
    setStage("idle");
  }

  function handleConfirmUpload() {
    if (!file) return;
    setStage("processing");
    uploadMutation.mutate(file);
  }

  function openResume(id: string) {
    navigate(`/editor?resume=${id}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col p-6">
        {stage === "idle" && resumes.length > 0 && (
          <ResumesHeader
            count={resumes.length}
            limit={RESUME_LIMIT}
            onAdd={() => setStage("uploading")}
          />
        )}

        {stage === "processing" ? (
          <ResumeProcessingState />
        ) : stage === "reviewing" ? (
          <ResumeReviewStage
            sections={reviewSections}
            onContinue={() => processedResume && openResume(processedResume.id)}
          />
        ) : stage === "uploading" ? (
          <ResumeUploadStage
            file={file}
            error={error}
            acceptedExtensions={acceptedExtensions}
            maxSizeMB={maxSizeMB}
            onFileSelected={selectFile}
            onRemoveFile={removeFile}
            onCancel={handleCancelUpload}
            onContinue={handleConfirmUpload}
          />
        ) : resumesQuery.isLoading ? (
          <ResumeListSkeleton />
        ) : resumesQuery.isError ? (
          <p role="alert" className="mt-8 text-sm text-destructive">
            {resumesQuery.error.message}
          </p>
        ) : resumes.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <HomeEmptyState onUpload={() => setStage("uploading")} />
          </div>
        ) : (
          <ResumeList
            resumes={cards}
            limit={RESUME_LIMIT}
            onOpenResume={openResume}
            onCreateResume={() => setStage("uploading")}
          />
        )}

        {stage === "idle" && latestSuggestion && latestSuggestedResume && (
          <AISuggestion
            suggestion={latestSuggestion}
            onOptimize={() => openResume(latestSuggestedResume.id)}
          />
        )}
      </div>
    </div>
  );
}
