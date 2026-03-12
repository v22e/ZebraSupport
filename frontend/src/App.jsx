import { Navigate, Route, Routes } from "react-router-dom";
import DemoBanner from "./components/DemoBanner";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import PlatformLayout from "./layouts/PlatformLayout";
import UserLayout from "./layouts/UserLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import BillingPage from "./pages/admin/BillingPage";
import DashboardPage from "./pages/admin/DashboardPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import TicketDetailPage from "./pages/admin/TicketDetailPage";
import TicketsPage from "./pages/admin/TicketsPage";
import UserNewRequestPage from "./pages/dashboard/UserNewRequestPage";
import UserProfilePage from "./pages/dashboard/UserProfilePage";
import UserRequestsPage from "./pages/dashboard/UserRequestsPage";
import UserTicketDetailPage from "./pages/dashboard/UserTicketDetailPage";
import PlatformDashboardPage from "./pages/platform/PlatformDashboardPage";
import PlatformDemoRequestsPage from "./pages/platform/PlatformDemoRequestsPage";
import PlatformLoginPage from "./pages/platform/PlatformLoginPage";
import PlatformOrganisationDetailPage from "./pages/platform/PlatformOrganisationDetailPage";
import PlatformOrganisationsPage from "./pages/platform/PlatformOrganisationsPage";

const App = () => {
  return (
    <>
      <DemoBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/platform/login" element={<PlatformLoginPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["org_owner", "org_admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="tickets" element={<TicketsPage />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route
            path="billing"
            element={
              <ProtectedRoute allowedRoles={["org_owner"]}>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserRequestsPage />} />
          <Route path="new" element={<UserNewRequestPage />} />
          <Route path="tickets/:id" element={<UserTicketDetailPage />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route
          path="/platform"
          element={
            <ProtectedRoute allowedRoles={["superadmin"]} unauthRedirect="/platform/login">
              <PlatformLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/platform/dashboard" replace />} />
          <Route path="dashboard" element={<PlatformDashboardPage />} />
          <Route path="organisations" element={<PlatformOrganisationsPage />} />
          <Route path="organisations/:id" element={<PlatformOrganisationDetailPage />} />
          <Route path="demo-requests" element={<PlatformDemoRequestsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

export default App;
