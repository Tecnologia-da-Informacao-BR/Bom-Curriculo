import { Routes, Route } from "react-router";

// Login and register
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Account recovery
import SendEmail from "@/pages/auth/send-email"; 
import ForgotPassword from "@/pages/auth/forgot-password";
import ResetPassword from "@/pages/auth/reset-password";

// Protecton shell
import { ProtectedRoute } from "@/components/protectRouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

// Resumes
import Home from "@/pages/dashboard/home/Home";
import MyResumes from "@/pages/dashboard/resumes/MyResumes";
import NewResume from "@/pages/dashboard/resumes/NewResume";
import ConfirmResume from "@/pages/dashboard/resumes/ConfirmResume";
import { ROUTE_LINKS } from "@/constants/RouteLinks";

// ???
//import Editor from "@/pages/dashboard/editor/Editor";
//import Jobs from "@/pages/dashboard/jobs/Jobs";
//import JobDetails from "@/pages/dashboard/jobs/JobDetails";
//import Settings from "@/pages/dashboard/settings/Settings";

export function AppRoutes() {
  return (
    <Routes>

      {/* Login and register */}
      <Route path={ROUTE_LINKS.login} element={<Login />} />
      <Route path={ROUTE_LINKS.register} element={<Register />} />

      {/* Account recovery */}
      <Route path={ROUTE_LINKS.sendOtp} element={<SendEmail />} />
      <Route path={ROUTE_LINKS.forgotPassword}  element={<ForgotPassword />} />
      <Route path={ROUTE_LINKS.changePassword} element={<ResetPassword />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>

          {/* Pages */}
          <Route path={ROUTE_LINKS.home} element={<Home />} />
          <Route path={ROUTE_LINKS.myResumes} element={<MyResumes />} />
          <Route path={ROUTE_LINKS.resumeConfirm} element={<ConfirmResume />} />
          <Route path={ROUTE_LINKS.newResume} element={<NewResume />} />

          {/* ???
          <Route path="/editor" element={<Editor />} />
          <Route path="/vagas" element={<Jobs />} />
          <Route path="/vaga/:id" element={<JobDetails />} />
          <Route path="/configuracoes" element={<Settings />} />
          */}

        </Route>
      </Route>

    </Routes>
  );
}
