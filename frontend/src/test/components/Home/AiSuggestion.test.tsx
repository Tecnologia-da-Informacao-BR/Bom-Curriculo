import AISuggestion from "@/components/Home/AISuggestion";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AISuggestion", () => {
  it("displays the suggestion returned by the API without an action when no callback is provided", () => {
    const suggestion = "Inclua resultados mensuráveis nas experiências profissionais.";
    render(<AISuggestion suggestion={suggestion} />);

    expect(screen.getByText("Sugestão da análise ATS")).toBeInTheDocument();
    expect(screen.getByText(suggestion)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("calls onOptimize when the analysis button is clicked", async () => {
    const user = userEvent.setup();
    const onOptimize = vi.fn();
    render(<AISuggestion suggestion="Revise as palavras-chave." onOptimize={onOptimize} />);

    await user.click(screen.getByRole("button", { name: /ver análise/i }));

    expect(onOptimize).toHaveBeenCalledTimes(1);
  });
});
