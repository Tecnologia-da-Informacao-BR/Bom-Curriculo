import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  describe, expect, it ,vi} from "vitest";

import ResumesHeader from "@/components/Home/ResumesHeader";


describe("ResumesHeader",()=>{
   it('displays the resume count and handles filter and add actions', async () =>  {
        const user = userEvent.setup()
        const onFilterMock = vi.fn()
        const onAddMock = vi.fn()
        const count = 10
        const limit = 50
        const {getByText,getByRole} = render(
            <ResumesHeader
                count={count}
                onFilter={onFilterMock}
                limit={limit}
                onAdd={onAddMock}
            />
        );

        expect(getByText(`${count}/${limit} Currículos`)).toBeInTheDocument()
                const filterButton = getByRole('button', {
        name: /filtrar/i,
        });

        expect(filterButton).toBeInTheDocument();

        await user.click(filterButton);

        expect(onFilterMock).toHaveBeenCalledTimes(1);

        const addButton = getByRole('button', {
        name: /adicionar currículo/i,
        });

        expect(addButton).toBeInTheDocument();
        expect(addButton).toBeEnabled();

        await user.click(addButton);

        expect(onAddMock).toHaveBeenCalledTimes(1);
    })
    it('displays the default resume count and action buttons', () =>  {

        const {getByText,getByRole} = render(
            <ResumesHeader/>
        );
        expect(getByText(`${2}/${5} Currículos`)).toBeInTheDocument()
                const filterButton = getByRole('button', {
        name: /filtrar/i,
        });

        expect(filterButton).toBeInTheDocument();

        const addButton = getByRole('button', {
        name: /adicionar currículo/i,
        });

        expect(addButton).toBeInTheDocument();
        expect(addButton).toBeEnabled();

      
    })
   
})