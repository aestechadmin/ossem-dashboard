import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "@/layouts/AdminLayout";
import AccountCategoriesPage from "@/pages/AccountCategoriesPage";
import AdmissionsPage from "@/pages/AdmissionsPage";
import AttendancePage from "@/pages/AttendancePage";
import BankAccountsPage from "@/pages/BankAccountsPage";
import BiometricsPage from "@/pages/BiometricsPage";
import DashboardPage from "@/pages/DashboardPage";
import DepartmentListPage from "@/pages/DepartmentListPage";
import DepartmentsPage from "@/pages/DepartmentsPage";
import EmployeesPage from "@/pages/EmployeesPage";
import FeesPage from "@/pages/FeesPage";
import HostelListPage from "@/pages/HostelListPage";
import HostelPage from "@/pages/HostelPage";
import LoginPage from "@/pages/LoginPage";
import OtpPage from "@/pages/OtpPage";
import StudentsPage from "@/pages/StudentsPage";
import ToastHost from "@/components/ToastHost";
import { useAuthStore } from "@/store/authStore";
import { isJwtExpired } from "@/utils/jwt";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const jwt = useAuthStore((s) => s.jwt);
  const adminSessionId = useAuthStore((s) => s.adminSessionId);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (jwt && isJwtExpired(jwt)) {
      logout();
    }
  }, [jwt, logout]);

  if (!jwt || isJwtExpired(jwt) || !adminSessionId) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const jwt = useAuthStore((s) => s.jwt);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (jwt && isJwtExpired(jwt)) {
      logout();
    }
  }, [jwt, logout]);

  return (
    <BrowserRouter>
      <ToastHost />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OtpPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="students" element={<StudentsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="fees" element={<FeesPage />} />
          <Route path="hostel" element={<HostelPage />} />
          <Route path="hostel/:kind" element={<HostelListPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="biometrics" element={<BiometricsPage />} />
          <Route path="account-categories" element={<AccountCategoriesPage />} />
          <Route path="bank-accounts" element={<BankAccountsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="departments/:kind" element={<DepartmentListPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
