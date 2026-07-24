import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  describe, expect, it, vi } from "vitest";

import HomeEmptyState from "@/components/Home/HomeEmptyState";

describe("HomeEmptyState",()=>{
   it('displays the empty state and calls onUpload when the upload button is clicked', async () => {
        const onUploadMock = vi.fn()
        const user = userEvent.setup();
        const {getByText,getByRole} = render(
            <HomeEmptyState onUpload={onUploadMock}/>
        );
        expect(getByText("Você ainda não enviou nenhum currículo")).toBeInTheDocument()
  
        const uploadButton = getByRole('button', {
            name: /enviar currículo/i,
        });

        expect(uploadButton).toBeInTheDocument();

        await user.click(uploadButton)
        expect(onUploadMock).toHaveBeenCalledTimes(1)
    })
})