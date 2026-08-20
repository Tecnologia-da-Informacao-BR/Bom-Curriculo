import { useNavigate } from "react-router";
import { Header } from "@/components/Home/Header";
import ResumesHeader from "@/components/Home/ResumesHeader";
import HomeEmptyState from "@/components/Home/HomeEmptyState";
import ResumeListSkeleton from "@/components/Home/ResumeListSkeleton";
import ResumeList from "@/components/Home/ResumeList";
import { useUserResumes } from "@/hooks/use-user-resumes";

const RESUME_LIMIT = 5;

export default function MyResumes() {
  const navigate = useNavigate();
  const { resumes, isLoading } = useUserResumes();

  const hasResumes = resumes.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col p-6">
        {isLoading ? (
          <ResumeListSkeleton />
        ) : hasResumes ? (
          <>
            <ResumesHeader
              count={resumes.length}
              limit={RESUME_LIMIT}
              onAdd={() => navigate("/novo-curriculo")}
            />
            <ResumeList
              resumes={resumes}
              limit={RESUME_LIMIT}
              onDownloadResume={(id) => {
                const resume = resumes.find((item) => item.id === id);
                const url = resume?.downloadUrl;
                if (url) {
                  window.open(url, "_blank");
                }
              }}
              onReviewResume={(id) => navigate(`/meus-curriculos/${id}/confirmar`)}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <HomeEmptyState onUpload={() => navigate("/novo-curriculo")} />
          </div>
        )}
      </div>
    </div>
  );
}