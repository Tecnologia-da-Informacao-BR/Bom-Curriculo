import { Login } from "@/pages/auth/login";
import {  render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe ,expect,it,vi} from "vitest";
import * as Query from '@tanstack/react-query';
import userEvent from "@testing-library/user-event";
import * as service from "@/api/auth/login-api";
import * as sonner from 'sonner'
vi.mock('@tanstack/react-query', {
  spy: true,
});


vi.mock('sonner', {
  spy: true,
});

const spyToastSuccess = vi.mocked(sonner.toast.success);
const spyToastError = vi.mocked(sonner.toast.error);
const mockUseMutation = vi.mocked(Query.useMutation)
const mutateMock = vi.fn();
mockUseMutation.mockReturnValue({
  mutate: mutateMock,
} as unknown as ReturnType<typeof Query.useMutation>);

describe("Page login",()=>{
    beforeEach(()=>{
        vi.clearAllMocks()
        vi.restoreAllMocks()
    })
    it('displays an email validation error and prevents submission when the email is invalid',async()=>{
        const user = userEvent.setup()
        const { getByPlaceholderText,getByRole,getByText} = render(
           <MemoryRouter initialEntries={["/login"]}>
                 <Login/>
           </MemoryRouter>
        )
        const emailInput = getByPlaceholderText('nome@exemplo.com.br');
        const passwordInput = getByPlaceholderText('••••••••');
        const accessButton = getByRole('button', {
            name: /acessar plataforma/i,
        });

        await user.type(emailInput,'testing')

        await user.type(passwordInput,'123456789')

        await user.click(accessButton)

        expect(getByText("Email inválido")).toBeInTheDocument()
        expect(mutateMock).not.toHaveBeenCalled()
        expect(spyToastError).not.toHaveBeenCalled()
        expect(spyToastSuccess).not.toHaveBeenCalled()
    })
    it('displays a password validation error and prevents submission when the password is too short',async()=>{
        const user = userEvent.setup()
        const { getByPlaceholderText,getByRole,getByText} = render(
           <MemoryRouter initialEntries={["/login"]}>
                 <Login/>
           </MemoryRouter>
        )
        const emailInput = getByPlaceholderText('nome@exemplo.com.br');
        const passwordInput = getByPlaceholderText('••••••••');
        const accessButton = getByRole('button', {
            name: /acessar plataforma/i,
        });

        await user.type(emailInput,'testing@gmail.com')

        await user.type(passwordInput,'1')

        await user.click(accessButton)

        expect(getByText("A senha precisa ter no mínimo 8 caracteres")).toBeInTheDocument()
        expect(mutateMock).not.toHaveBeenCalled()
        expect(spyToastError).not.toHaveBeenCalled()
        expect(spyToastSuccess).not.toHaveBeenCalled()
    })
    it('authenticates the user and displays a success message with valid credentials',async()=>{

        mockUseMutation.mockImplementation((options) => {
        mutateMock.mockImplementation(() => {
            options.onSuccess?.(
            { status: 201 },
            undefined as never,
            undefined,
            undefined as never,
            );
        });

        return {
            mutate: mutateMock,
            isPending: false,
        } as unknown as ReturnType<typeof Query.useMutation>;
        });
        vi.spyOn(service,'LoginApi')
        .mockResolvedValue({} as never)
        const user = userEvent.setup()
        const email = "testing@gmail.com"
        const password = "1".repeat(8)
        const { getByPlaceholderText,getByRole} = render(
           <MemoryRouter initialEntries={["/login"]}>
                 <Login/>
           </MemoryRouter>
        )
        const emailInput = getByPlaceholderText('nome@exemplo.com.br');
        const passwordInput = getByPlaceholderText('••••••••');
        const accessButton = getByRole('button', {
            name: /acessar plataforma/i,
        });

        await user.type(emailInput,email)

        await user.type(passwordInput,password)

        await user.click(accessButton)
        
        await waitFor(()=>{
            expect(spyToastSuccess).toHaveBeenCalledWith("Usuario autenticado com sucesso!")
            expect(spyToastError).not.toHaveBeenCalled()
            expect(mutateMock).toHaveBeenCalledWith({
                email,password
            })
        })
    })
    it('displays an authentication error when the login request fails',async()=>{

        mockUseMutation.mockImplementation((options) => {
            mutateMock.mockImplementation(() => {
                options.onError?.(
                new Error('Erro ao autenticar usuário'),
                undefined as never,
                undefined,
                undefined as never,
                );
            });

            return {
                mutate: mutateMock,
                isPending: false,
            } as unknown as ReturnType<typeof Query.useMutation>;
            });
            vi.spyOn(service,'LoginApi')
            .mockResolvedValue({} as never)
            const user = userEvent.setup()
            const email = "testing@gmail.com"
            const password = "1".repeat(8)
            const { getByPlaceholderText,getByRole} = render(
            <MemoryRouter initialEntries={["/login"]}>
                    <Login/>
            </MemoryRouter>
            )
            const emailInput = getByPlaceholderText('nome@exemplo.com.br');
            const passwordInput = getByPlaceholderText('••••••••');
            const accessButton = getByRole('button', {
                name: /acessar plataforma/i,
            });

            await user.type(emailInput,email)

            await user.type(passwordInput,password)

            await user.click(accessButton)
            
            await waitFor(()=>{
                expect(spyToastError).toHaveBeenCalledWith("Erro ao autenticar usuário")
                expect(spyToastSuccess).not.toHaveBeenCalled()
                expect(mutateMock).toHaveBeenCalledWith({
                email,password
            })
        })
    })
})