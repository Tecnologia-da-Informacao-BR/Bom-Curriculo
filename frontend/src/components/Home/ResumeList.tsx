import ResumeCard, { type ResumeCardProps } from "@/components/Home/ResumeCard";
import AddResumeCard from "@/components/Home/AddResumeCard";

interface ResumeListProps {
  resumes: (ResumeCardProps & { id: string })[];
  limit: number;
  onDeleteResume?: (id: string) => void;
  onDownloadResume?: (id: string) => void;
  onFinalizeResume?: (id: string) => void;
  onReviewResume?: (id: string) => void;
}

export default function ResumeList({
  resumes,
  limit,
  onDeleteResume,
  onDownloadResume,
  onFinalizeResume,
  onReviewResume,
}: ResumeListProps) {
  return (
    <section aria-label="Lista de currículos" className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {resumes.map(({ id, ...card }) => (
        <ResumeCard
          key={id}
          {...card}
          onDelete={() => onDeleteResume?.(id)}
          onDownload={
            onDownloadResume ? () => onDownloadResume(id) : card.onDownload
          }
          onMatch={
            onFinalizeResume ? () => onFinalizeResume(id) : card.onMatch
          }
          onReview={
            onReviewResume ? () => onReviewResume(id) : card.onReview
          }
        />
      ))}
      <AddResumeCard isLimitReached={resumes.length >= limit} limit={limit} />
    </section>
  );
}
