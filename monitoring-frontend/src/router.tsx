import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppLayout from "./components/layout/AppLayout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MonitorsPage from "./pages/MonitorsPage";
import SettingsPage from "./pages/SettingsPage";
const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "var(--color-bg)",
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        border: "2px solid var(--color-border)",
        borderTopColor: "var(--color-accent)",
        borderRadius: "50%",
        animation: "spin 0.7s linear infinite",
      }}
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// AFTER — waits for session verification before deciding
function AuthGuard() {
  const { user, isLoading } = useAuth();

  // Still verifying session with server — render nothing
  // prevents premature redirect to /login
  if (isLoading) return <LoadingScreen />; // or a full-page spinner

  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function GuestGuard() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (user) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <GuestGuard />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/monitors", element: <MonitorsPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
  { path: "/", element: <Navigate to="/dashboard" replace /> },
  { path: "*", element: <Navigate to="/dashboard" replace /> },
]);

export default router;
