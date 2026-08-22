import {
  //ChartColumnBigIcon,
  //CircleQuestionMarkIcon,
  FileText,
  LayoutDashboard,
  LogOut,
  Plus,
  //SettingsIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogoutApi } from "@/api/auth/logout-api";
import { toast } from "sonner";
import { NavLink, useLocation, useNavigate } from "react-router";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

const items = [
  {
    title: "Início",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Meus Curriculos",
    url: ROUTE_LINKS.myResumes,
    icon: FileText,
  },
  //{
  //  title: "Analisador de Vagas",
  //  url: "/vagas",
  //  icon: ChartColumnBigIcon,
  //},
  //{
  //  title: "Configurações",
  //  url: "/configuracoes",
  //  icon: SettingsIcon,
  //},
];

export default function AppSidebar() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const logoutMutation = useMutation({
    mutationFn: LogoutApi,
    onSettled: () => {
      queryClient.clear();
      localStorage.removeItem("token");
      sessionStorage.removeItem("token");

      navigate(ROUTE_LINKS.login);
    },
    onSuccess: () => {
      toast.success("Logout realizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro na API de Logout:", error);
      toast.warning("Sua sessão foi encerrada localmente.");
    },
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="border-b border-solid border-sidebar-border">
        <div className="border-b border-sidebar-border ">
          <div className="p-4 ">
            <div className="flex gap-1">
              <img
                src="/logo-dark.png"
                alt="Bom Currículo"
                className="h-10 w-auto dark:hidden"
              />

              <img
                src="/logo.png"
                alt="Bom Currículo"
                className="hidden h-10 w-auto dark:block"
              />
              <h1 className="text-brand-secondary dark:text-white flex items-center text-xl gap-1 font-semibold">
                Bom<span className="text-brand-primary"> Currículo</span>
              </h1>
            </div>
            <span className="text-muted-foreground text-sm">Otimização ATS</span>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    className="py-8 data-[active=true]:bg-brand-primary/10 data-[active=true]:font-medium data-[active=true]:text-brand-primary hover:bg-brand-secondary hover:text-white dark:hover:bg-brand-primary"
                  >
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3"
                    >
                      <item.icon className={"w-5! h-5!"} />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <footer className="p-4">
        <div className="flex flex-col gap-1">
          <Button
          onClick={() => navigate(ROUTE_LINKS.newResume)}
          className="mb-2 bg-brand-secondary p-6 hover:bg-brand-secondary dark:bg-brand-primary">
            <Plus /> Novo Currículo
          </Button>
          
          {/*
          <button
            type="button"
            className="flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <CircleQuestionMarkIcon size={18} /> Ajuda
          </button>
          */}

          <button
            type="button"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className="flex items-center justify-start gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut size={18} /> Sair
          </button>
        </div>
      </footer>
    </Sidebar>
  );
}
