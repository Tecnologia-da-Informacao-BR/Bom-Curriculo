import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResumeReviewStage, type ReviewSection } from "@/components/resume-upload/ResumeReviewStage";

const sections: ReviewSection[] = [
  {
    id: "experiences",
    title: "Experiências",
    items: [{ id: "exp-1", title: "Desenvolvedor — Bom Currículo", description: "2025 — Atual" }],
  },
  {
    id: "skills",
    title: "Habilidades",
    items: [{ id: "skill-php", title: "PHP", description: "8 anos de experiência" }],
  },
];

describe("ResumeReviewStage", () => {
  it("renders the structured data returned by the bot as read-only content", () => {
    render(<ResumeReviewStage sections={sections} onContinue={vi.fn()} />);

    expect(screen.getByText("Experiências")).toBeInTheDocument();
    expect(screen.getByText("Habilidades")).toBeInTheDocument();
    expect(screen.getByText("Desenvolvedor — Bom Currículo")).toBeInTheDocument();
    expect(screen.getByText("PHP")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("calls onContinue when the user opens the analyzed resume", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<ResumeReviewStage sections={sections} onContinue={onContinue} />);

    await user.click(screen.getByRole("button", { name: /ver currículo analisado/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });
});
