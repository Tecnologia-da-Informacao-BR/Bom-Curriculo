import ResumeList from "@/components/Home/ResumeList";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  describe, expect, it ,vi} from "vitest";
import { resumeCardMock1 } from "./__mocks__";


describe("ResumeList",()=>{
   it('displays the resume data and handles download, match, and deletion actions', async () => {
        const user = userEvent.setup()
        const mockOnDeleteResume = vi.fn()
        const {getByText,getByRole} = render(
            <ResumeList
                resumes={[resumeCardMock1]}
                limit={3}
                onDeleteResume={mockOnDeleteResume}
            />
        );
        expect(
            getByText(new RegExp(`${resumeCardMock1.matchPercentage}\\s*%\\s*Match`, 'i')),
        ).toBeInTheDocument();

        expect(
            getByText(new RegExp(`Atualizado\\s*${resumeCardMock1.updatedLabel}`, 'i')),
        ).toBeInTheDocument();

        //hidencount
        const visibleTags = resumeCardMock1.tags.slice(0, resumeCardMock1.maxVisibleTags);
        const hiddenCount = resumeCardMock1.tags.length - visibleTags.length;
        expect(getByText(`+${hiddenCount}`))
        visibleTags.forEach((val)=>{
            expect(getByText(val)).toBeInTheDocument()
        })

        const downloadButton = getByRole('button', {
        name: /baixar/i,
        });

        expect(downloadButton).toBeInTheDocument();

        await user.click(downloadButton)
        expect(resumeCardMock1.onDownload).toHaveBeenCalledTimes(1)

        const matchButton = getByRole('button', {
            name: /match/i,
        });

        expect(matchButton).toBeInTheDocument();
        await user.click(matchButton);

        expect(resumeCardMock1.onMatch).toHaveBeenCalledTimes(1);

        const deleteButton = getByRole('button', {
            name: /excluir/i,
        });

        expect(deleteButton).toBeInTheDocument();

        await user.click(deleteButton);

        expect(mockOnDeleteResume).toHaveBeenCalledWith(resumeCardMock1.id);
    })
   
})