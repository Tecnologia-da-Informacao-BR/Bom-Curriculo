import ResumeCard from "@/components/Home/ResumeCard";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  describe, expect, it, vi } from "vitest";

const tags = ["nodejs","reactjs","docker","git","github","docker compose","vue","angular"]
describe("ResumeCard",()=>{
   it('displays the visible tags, hidden tag count, resume data, and handles actions', async ()  => {
        const onDownloadMock = vi.fn()
        const onMatchMock = vi.fn()
        const onDeleteMock = vi.fn()
        const fileName = "lorem.pdf"
        const matchPercentage = 55
        const updatedLabel = "03/07/2026"
        const user = userEvent.setup();
        const maxVisibleTags = 5
        const {getByText,getByRole} = render(
            <ResumeCard
                fileName={fileName}
                matchPercentage={matchPercentage}
                tags={tags}
                onDelete={onDeleteMock}
                onMatch={onMatchMock}
                onDownload={onDownloadMock}
                updatedLabel={updatedLabel}
                maxVisibleTags={maxVisibleTags}
            />
        );
        expect(
            getByText(new RegExp(`${matchPercentage}\\s*%\\s*Match`, 'i')),
        ).toBeInTheDocument();

        expect(
            getByText(new RegExp(`Atualizado\\s*${updatedLabel}`, 'i')),
        ).toBeInTheDocument();

        //hidencount
        const visibleTags = tags.slice(0, maxVisibleTags);
        const hiddenCount = tags.length - visibleTags.length;
        expect(getByText(`+${hiddenCount}`))
        visibleTags.forEach((val)=>{
            expect(getByText(val)).toBeInTheDocument()
        })

        const downloadButton = getByRole('button', {
        name: /baixar/i,
        });

        expect(downloadButton).toBeInTheDocument();

        await user.click(downloadButton)
        expect(onDownloadMock).toHaveBeenCalledTimes(1)

        const matchButton = getByRole('button', {
            name: /match/i,
        });

        expect(matchButton).toBeInTheDocument();
        await user.click(matchButton);

        expect(onMatchMock).toHaveBeenCalledTimes(1);

        const deleteButton = getByRole('button', {
            name: /excluir/i,
        });

        expect(deleteButton).toBeInTheDocument();

        await user.click(deleteButton);

        expect(onDeleteMock).toHaveBeenCalledTimes(1);
    })
    it('displays the resume data, hides technologies when no tags are provided, and handles actions', async ()  => {
        const onDownloadMock = vi.fn()
        const onMatchMock = vi.fn()
        const onDeleteMock = vi.fn()
        const fileName = "lorem.pdf"
        const matchPercentage = 55
        const updatedLabel = "03/07/2026"
        const user = userEvent.setup();
        const maxVisibleTags = 5
        const {getByText,getByRole,queryByLabelText} = render(
            <ResumeCard
                fileName={fileName}
                matchPercentage={matchPercentage}
                tags={[]}
                onDelete={onDeleteMock}
                onMatch={onMatchMock}
                onDownload={onDownloadMock}
                updatedLabel={updatedLabel}
                maxVisibleTags={maxVisibleTags}
            />
        );
        expect(
            getByText(new RegExp(`${matchPercentage}\\s*%\\s*Match`, 'i')),
        ).toBeInTheDocument();

        expect(
            getByText(new RegExp(`Atualizado\\s*${updatedLabel}`, 'i')),
        ).toBeInTheDocument();

        expect(
            queryByLabelText(/tecnologias identificadas/i),
        ).not.toBeInTheDocument();

        const downloadButton = getByRole('button', {
        name: /baixar/i,
        });

        expect(downloadButton).toBeInTheDocument();

        await user.click(downloadButton)
        expect(onDownloadMock).toHaveBeenCalledTimes(1)

        const matchButton = getByRole('button', {
            name: /match/i,
        });

        expect(matchButton).toBeInTheDocument();
        await user.click(matchButton);

        expect(onMatchMock).toHaveBeenCalledTimes(1);

        const deleteButton = getByRole('button', {
            name: /excluir/i,
        });

        expect(deleteButton).toBeInTheDocument();

        await user.click(deleteButton);

        expect(onDeleteMock).toHaveBeenCalledTimes(1);
    })
})