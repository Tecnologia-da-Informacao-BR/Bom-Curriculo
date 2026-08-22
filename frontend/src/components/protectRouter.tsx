import { getUser } from "@/api/user/get-user";
import { ROUTE_LINKS } from "@/constants/RouteLinks";
import { useQuery } from "@tanstack/react-query";
import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: getUser,
    retry: false,
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }
  if (!user) {
    return <Navigate to={ROUTE_LINKS.login} replace />;
  }

  return <Outlet />;
}
