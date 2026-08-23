import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";

import ResumesHeader from "@/components/Home/ResumesHeader";
import ResumeList from "@/components/Home/ResumeList";
import ResumeListSkeleton from "@/components/Home/ResumeListSkeleton";
import HomeEmptyState from "@/components/Home/HomeEmptyState";
import AISuggestion from "@/components/Home/AISuggestion";
import { getResumes, RESUMES_QUERY_KEY } from "@/api/resume/resume-api";
import { toResumeCard } from "@/lib/resume-data";

const RESUME_LIMIT = 5;

export default function MyResume() {
  const navigate = useNavigate();
  const resumesQuery = useQuery({
    queryKey: RESUMES_QUERY_KEY,
    queryFn: getResumes,
  });

  const resumes = resumesQuery.data || [];
  const cards = resumes.map(toResumeCard);
  const latestSuggestedResume = resumes.find((resume) => resume.analytic?.suggestion);
  const latestSuggestion = latestSuggestedResume?.analytic?.suggestion;

  return (
    <div className="flex flex-1 flex-col">
      <ResumesHeader
        count={resumes.length}
        limit={RESUME_LIMIT}
        onAdd={() => navigate("/my-curriculum")}
      />

      {resumesQuery.isLoading ? (
        <ResumeListSkeleton />
      ) : resumesQuery.isError ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          {resumesQuery.error.message}
        </p>
      ) : resumes.length > 0 ? (
        <>
          <ResumeList
            resumes={cards}
            limit={RESUME_LIMIT}
            onOpenResume={(id) => navigate(`/editor?resume=${id}`)}
            onCreateResume={() => navigate("/my-curriculum")}
          />
          {latestSuggestion && latestSuggestedResume && (
            <AISuggestion
              suggestion={latestSuggestion}
              onOptimize={() => navigate(`/editor?resume=${latestSuggestedResume.id}`)}
            />
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <HomeEmptyState onUpload={() => navigate("/my-curriculum")} />
        </div>
      )}
    </div>
  );
}
