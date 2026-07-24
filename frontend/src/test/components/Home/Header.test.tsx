import { Header } from "@/components/Home/Header";
import { render } from "@testing-library/react";
import {  describe, it } from "vitest";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from "react-router";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});
describe("Header",()=>{
    it('',async()=>{
     render(
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                <Header />
                </QueryClientProvider>
            </MemoryRouter>,
        );
        
    })
  
})