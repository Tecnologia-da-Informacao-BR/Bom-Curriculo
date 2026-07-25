import { Header, NAV_LINKS } from "@/components/Home/Header";
import { render,within } from "@testing-library/react";
import {  beforeEach, describe, expect, it, vi } from "vitest";
import * as Query from '@tanstack/react-query';
import { MemoryRouter } from "react-router";
import { userMock } from "./__mocks__";
import type { UserType } from "@/types/user-type";
import { getUser } from "@/api/user/get-user";
import userEvent from "@testing-library/user-event";

vi.mock('@tanstack/react-query', {
  spy: true,
});

const mockUseQuery = vi.mocked(Query.useQuery);
const mockUseMutation = vi.mocked(Query.useMutation)
const mutateMock = vi.fn();
mockUseMutation.mockReturnValue({
  mutate: mutateMock,
} as unknown as ReturnType<typeof Query.useMutation>);
const queryClient = new Query.QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe("Header",()=>{
    beforeEach(()=>{
      
    })
    it('displays authenticated user data, navigation links, and handles logout actions',async()=>{
      const userEvt = userEvent.setup()
    
      mockUseQuery.mockReturnValue({
        data: userMock,
        isLoading: false,
        isSuccess: true,
        isError: false,
        status: 'success',
      } as Query.UseQueryResult<UserType, Error>);

      const {getByText,getAllByText,getByRole,queryByText,findByRole} = render(
        <MemoryRouter initialEntries={["/"]}>
            <Query.QueryClientProvider client={queryClient}>
            <Header />
            </Query.QueryClientProvider>
        </MemoryRouter>,
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey:["me"],
        queryFn:getUser,
        retry:false
      });
      expect(getByText(userMock.name.charAt(0).toUpperCase())).toBeInTheDocument()
      expect(getAllByText(userMock.name)).toHaveLength(2)
      expect(getAllByText(userMock.email)).toHaveLength(2)
      expect(queryByText("Entrar")).not.toBeInTheDocument()
      expect(getByText("Desconectar")).toBeInTheDocument()
      expect(getAllByText("Dashboard")).toHaveLength(3)
      expect(getByText("Configurações")).toBeInTheDocument()

      const desktopNav = getByRole('navigation', {
        name: /navegação principal/i,
      });

      const mobileNav = getByRole('navigation', {
        name: /navegação móvel/i,
      });

      NAV_LINKS.forEach(({ label, to }) => {
        if (to) {
          const desktopLink = within(desktopNav).getByRole('link', {
            name: new RegExp(`^${label}$`, 'i'),
          });

          const mobileLink = within(mobileNav).getByRole('link', {
            name: new RegExp(`^${label}$`, 'i'),
          });

          expect(desktopLink).toHaveAttribute('href', to);
          expect(desktopLink).toHaveClass(
            'transition',
            'hover:text-brand-primary',
          );

          expect(mobileLink).toHaveAttribute('href', to);
          expect(mobileLink).toHaveClass('hover:text-brand-primary');

          return;
        }

        const desktopItem = within(desktopNav).getByText(label);
        const mobileItem = within(mobileNav).getByText(label);

        [desktopItem, mobileItem].forEach((item) => {
          expect(item).toHaveAttribute('title', 'Em breve');
          expect(item).toHaveClass(
            'cursor-not-allowed',
            'text-gray-400',
            'dark:text-gray-500',
          );
        });
      });


      const disconnectButtons = getByRole('button', {
        name: /desconectar/i,
      });

     
      await userEvt.click(disconnectButtons);
      

      expect(mutateMock).toHaveBeenCalledTimes(1);
            const menuTrigger = getByRole('button', {
        name: new RegExp(userMock.name, 'i'),
      });

      await userEvent.click(menuTrigger);

      const disconnectMenuItem = await findByRole('menuitem', {
        name: /desconectar/i,
      });

      expect(disconnectMenuItem).toBeInTheDocument();

      await userEvent.click(disconnectMenuItem);

      expect(mutateMock).toHaveBeenCalledTimes(2);
    })

    it('displays guest navigation and hides authenticated user actions when the user request fails',async()=>{

      mockUseQuery.mockReturnValue({
        data: undefined,
        error: new Error('Usuário não autenticado'),

        status: 'error',
        fetchStatus: 'idle',

        isLoading: false,
        isPending: false,
        isFetching: false,
        isSuccess: false,
        isError: true,

        isLoadingError: true,
        isRefetchError: false,
      } as unknown as Query.UseQueryResult<UserType, Error>);
    

      const {getAllByText,getByRole,queryByText} = render(
        <MemoryRouter initialEntries={["/"]}>
            <Query.QueryClientProvider client={queryClient}>
            <Header />
            </Query.QueryClientProvider>
        </MemoryRouter>,
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey:["me"],
        queryFn:getUser,
        retry:false
      });
    
      expect(getAllByText("Entrar")).toHaveLength(2)
      expect(queryByText("Desconectar")).not.toBeInTheDocument()
      expect(getAllByText("Dashboard")).toHaveLength(2)
      expect(queryByText("Configurações")).not.toBeInTheDocument()

      const desktopNav = getByRole('navigation', {
        name: /navegação principal/i,
      });

      const mobileNav = getByRole('navigation', {
        name: /navegação móvel/i,
      });

      NAV_LINKS.forEach(({ label, to }) => {
        if (to) {
          const desktopLink = within(desktopNav).getByRole('link', {
            name: new RegExp(`^${label}$`, 'i'),
          });

          const mobileLink = within(mobileNav).getByRole('link', {
            name: new RegExp(`^${label}$`, 'i'),
          });

          expect(desktopLink).toHaveAttribute('href', to);
          expect(desktopLink).toHaveClass(
            'transition',
            'hover:text-brand-primary',
          );

          expect(mobileLink).toHaveAttribute('href', to);
          expect(mobileLink).toHaveClass('hover:text-brand-primary');

          return;
        }

        const desktopItem = within(desktopNav).getByText(label);
        const mobileItem = within(mobileNav).getByText(label);

        [desktopItem, mobileItem].forEach((item) => {
          expect(item).toHaveAttribute('title', 'Em breve');
          expect(item).toHaveClass(
            'cursor-not-allowed',
            'text-gray-400',
            'dark:text-gray-500',
          );
        });
      });

    })
})