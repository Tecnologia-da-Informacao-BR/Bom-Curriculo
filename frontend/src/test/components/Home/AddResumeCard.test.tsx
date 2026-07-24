import AddResumeCard from "@/components/Home/AddResumeCard";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("AddResumeCard",()=>{
    it('displays the limit message and hides the create button when the limit is reached',async()=>{
      
        const spyCreate = vi.fn()
        const limit = 50
        const {getByText,queryByRole} = render(
            <AddResumeCard
                onCreate={spyCreate}
                limit={limit}
                isLimitReached={true}/>
        )
      
        expect(getByText(`Limite Atingido`)).toBeInTheDocument()
        expect(
            getByText(
                new RegExp(
                `Você atingiu o limite de ${limit} currículos\\.\\s*Exclua um currículo para liberar espaço\\.`,
                'i',
                ),
            ),
        ).toBeInTheDocument();

        expect(
        queryByRole('button', {
            name: /criar novo currículo/i,
        }),
        ).not.toBeInTheDocument();
    })
    it('displays the create button and calls onCreate when the limit is not reached',async()=>{
        const user = userEvent.setup()
        const spyCreate = vi.fn()
        const limit = 50
        const {queryByText,getByRole} = render(
            <AddResumeCard
                onCreate={spyCreate}
                limit={limit}
                isLimitReached={false}/>
        )
      
        expect(queryByText(`Limite Atingido`)).not.toBeInTheDocument()
        expect(
            queryByText(
                new RegExp(
                `Você atingiu o limite de ${limit} currículos\\.\\s*Exclua um currículo para liberar espaço\\.`,
                'i',
                ),
            ),
        ).not.toBeInTheDocument();

        const createButton = getByRole('button', {
            name: /criar novo currículo/i,
        });

        expect(createButton).toBeInTheDocument();

        expect(createButton).toHaveTextContent(
        /crie uma versão otimizada\s*para uma nova vaga\./i,
        );
        await user.click(createButton)
      
        expect(spyCreate).toHaveBeenCalledTimes(1)
    })
})