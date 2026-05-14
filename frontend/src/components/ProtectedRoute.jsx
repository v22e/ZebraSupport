import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getHomeRouteByRole } from "../utils/roles";

const ProtectedRoute = ({ children, allowedRoles, unauthRedirect = "/login" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zebra-white text-lg font-semibold text-zebra-black">
        Loading ZebraSupport...
      </div>
    );
  }

  if (!user) {
    return <Navigate to={unauthRedirect} replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const redirectPath = getHomeRouteByRole(user.role);
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
