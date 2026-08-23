import ResumeCard, { type ResumeCardProps } from "@/components/Home/ResumeCard";
import AddResumeCard from "@/components/Home/AddResumeCard";

interface ResumeListProps {
  resumes: (ResumeCardProps & { id: string })[];
  limit: number;
  onDeleteResume?: (id: string) => void;
  onOpenResume?: (id: string) => void;
  onCreateResume?: () => void;
}

export default function ResumeList({
  resumes,
  limit,
  onDeleteResume,
  onOpenResume,
  onCreateResume,
}: ResumeListProps) {
  return (
    <section aria-label="Lista de currículos" className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {resumes.map(({ id, ...card }) => (
        <ResumeCard
          key={id}
          {...card}
          onMatch={onOpenResume ? () => onOpenResume(id) : card.onMatch}
          onDelete={onDeleteResume ? () => onDeleteResume(id) : card.onDelete}
        />
      ))}
      <AddResumeCard
        isLimitReached={resumes.length >= limit}
        limit={limit}
        onCreate={onCreateResume}
      />
    </section>
  );
}
