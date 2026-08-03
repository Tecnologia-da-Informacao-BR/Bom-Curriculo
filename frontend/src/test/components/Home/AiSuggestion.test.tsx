import AISuggestion from "@/components/Home/AISuggestion";
import {  render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AISuggestion",()=>{
    it('displays the provided values when props are provided',async()=>{
        const keyword = "Kubernetes"
        const scoreIncrease = 15
        const role = "Engenheiro"
        const {getByText,getByRole} = render(
            <AISuggestion
                role={role}
                keyword={keyword}
                scoreIncrease={scoreIncrease}
            />
        )
        
      
        expect(
            getByText(`Dica da IA para o seu currículo de ${role}`),
        ).toBeInTheDocument();

        expect(
            getByText(
                new RegExp(
                `Identificamos que a palavra-chave "${keyword}" está em alta para as vagas que você analisa\\.\\s*Adicione experiências relacionadas para aumentar seu ATS score em até ${scoreIncrease}%\\.`,
                'i',
                ),
            ),
            ).toBeInTheDocument();
        
            const optimizeButton = getByRole('button', {
                name: /otimizar agora/i,
            });

            expect(optimizeButton).toBeInTheDocument();
        
    });

    it('displays the provided suggestion values and calls onOptimize when the button is clicked',async()=>{
        const user = userEvent.setup()
        const keyword = "docker-compose"
        const scoreIncrease = 50
        const role = "QA"
        const mockBtn = vi.fn()
        const {getByText,getByRole} = render(
            <AISuggestion
                role={role}
                keyword={keyword}
                scoreIncrease={scoreIncrease}
                onOptimize={mockBtn}
            />
        )
        
      
        expect(
            getByText(`Dica da IA para o seu currículo de ${role}`),
        ).toBeInTheDocument();

        expect(
            getByText(
                new RegExp(
                `Identificamos que a palavra-chave "${keyword}" está em alta para as vagas que você analisa\\.\\s*Adicione experiências relacionadas para aumentar seu ATS score em até ${scoreIncrease}%\\.`,
                'i',
                ),
            ),
            ).toBeInTheDocument();
        
            const optimizeButton = getByRole('button', {
                name: /otimizar agora/i,
        });

        expect(optimizeButton).toBeInTheDocument();

        await user.click(optimizeButton)

        expect(mockBtn).toHaveBeenCalledTimes(1)
        
    });
  
})