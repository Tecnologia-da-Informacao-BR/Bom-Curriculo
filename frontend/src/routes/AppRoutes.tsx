import { Routes, Route } from "react-router";

import Home from "../pages/home/Home";
import { Login } from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import { ForgotPassword } from "@/pages/auth/forgot-password";
import Dashboard from "@/pages/dashboard/Dashboard";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ProtectedRoute } from "@/components/protectRouter";
import Editor from "@/pages/dashboard/editor/Editor";
import JobDetails from "@/pages/dashboard/analisador-de-vagas/JobDetails";
import AnalisadorDeVagas from "@/pages/dashboard/analisador-de-vagas/AnalisadorDeVagas";
import MeusCurriculos from "@/pages/dashboard/meus-curriculos/MeusCurriculos";
import NovoCurriculo from "@/pages/dashboard/novo-curriculo/NovoCurriculo";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/editor" element={<Editor />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/meus-curriculos" element={<MeusCurriculos />} />
          <Route path="/novo-curriculo" element={<NovoCurriculo />} />
          <Route path="/analisador-de-vagas" element={<AnalisadorDeVagas />} />
          <Route path="/job-analysis/:id" element={<JobDetails />} />
        </Route>
      </Route>
    </Routes>
  );
}
