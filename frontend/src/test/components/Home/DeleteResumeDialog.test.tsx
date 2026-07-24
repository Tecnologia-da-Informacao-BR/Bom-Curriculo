import DeleteResumeDialog from "@/components/Home/DeleteResumeDialog";
import {  render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("DeleteResumeDialog",()=>{
    it('displays the file name and confirms its deletion when the dialog is open',async()=>{
        const user = userEvent.setup()
        const open = true
        const onOpenChangeMock = vi.fn()
        const onConfirmMock  = vi.fn()
        const fileName = "lorem-iptsu.pdf"
        const {getByText,getAllByText,getByRole} = render(
            <DeleteResumeDialog
                open={open}
                onOpenChange={onOpenChangeMock}
                onConfirm={onConfirmMock}
                fileName={fileName}
            />
        )
         
        expect(getAllByText("Excluir currículo")).toHaveLength(2)
        expect(
            getByText((_, element) => {
                const text = element?.textContent
                ?.replace(/\s+/g, ' ')
                .trim();

                return (
                element?.getAttribute('data-slot') ===
                    'alert-dialog-description' &&
                text ===
                    `Tem certeza que deseja excluir ${fileName}? Essa ação não poderá ser desfeita.`
                );
            }),
        ).toBeInTheDocument();
        expect(getByText("Cancelar")).toBeInTheDocument()
        const deleteButton = getByRole('button', {
            name: /excluir currículo/i,
        });

        expect(deleteButton).toBeInTheDocument();
        await user.click(deleteButton)

        expect(onConfirmMock).toHaveBeenCalledTimes(1)
        expect(onOpenChangeMock).toHaveBeenCalledWith(false)    
    });
      
    it('does not display the dialog content when open is false', () => {
        const open = false;
        const onOpenChangeMock = vi.fn();
        const onConfirmMock = vi.fn();
        const fileName = 'lorem-iptsu.pdf';

        const { queryByText, queryByRole } = render(
            <DeleteResumeDialog
            open={open}
            onOpenChange={onOpenChangeMock}
            onConfirm={onConfirmMock}
            fileName={fileName}
            />,
        );

        expect(queryByText('Excluir currículo')).not.toBeInTheDocument();

        expect(
            queryByText((_, element) => {
            const text = element?.textContent
                ?.replace(/\s+/g, ' ')
                .trim();

            return (
                element?.getAttribute('data-slot') ===
                'alert-dialog-description' &&
                text ===
                `Tem certeza que deseja excluir ${fileName}? Essa ação não poderá ser desfeita.`
            );
            }),
        ).not.toBeInTheDocument();

        expect(queryByText('Cancelar')).not.toBeInTheDocument();

        expect(
            queryByRole('button', {
            name: /^excluir currículo$/i,
            }),
        ).not.toBeInTheDocument();

        expect(onConfirmMock).not.toHaveBeenCalled();
        expect(onOpenChangeMock).not.toHaveBeenCalled();
    });
    it('displays the default message and confirms the resume deletion when no file name is provided',async()=>{
        const user = userEvent.setup()
        const open = true
        const onOpenChangeMock = vi.fn()
        const onConfirmMock  = vi.fn()
      
        const {getByText,getAllByText,getByRole} = render(
            <DeleteResumeDialog
                open={open}
                onOpenChange={onOpenChangeMock}
                onConfirm={onConfirmMock}
                
            />
        )
         
        expect(getAllByText("Excluir currículo")).toHaveLength(2)
        expect(
            getByText((_, element) => {
                const text = element?.textContent
                ?.replace(/\s+/g, ' ')
                .trim();

                return (
                element?.getAttribute('data-slot') ===
                    'alert-dialog-description' &&
                text ===
                    `Tem certeza que deseja excluir este currículo? Essa ação não poderá ser desfeita.`
                );
            }),
        ).toBeInTheDocument();
        expect(getByText("Cancelar")).toBeInTheDocument()
        const deleteButton = getByRole('button', {
            name: /excluir currículo/i,
        });

        expect(deleteButton).toBeInTheDocument();
        await user.click(deleteButton)

        expect(onConfirmMock).toHaveBeenCalledTimes(1)
        expect(onOpenChangeMock).toHaveBeenCalledWith(false)    
    });
})