import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TermsAndConditions from "./pages/TermsAndConditions";
import CollectorResponsibilities from "./pages/CollectorResponsibilities";
import MedicalExaminerProcess from "./pages/MedicalExaminerProcess";

// Admin routes
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import Members from "./pages/admin/Members";
import Collectors from "./pages/admin/Collectors";
import Finance from "./pages/admin/Finance";
import Support from "./pages/admin/Support";
import Profile from "./pages/admin/Profile";
import Database from "./pages/admin/Database";
import Registrations from "./pages/admin/Registrations";
import CoveredMembers from "./pages/admin/CoveredMembers";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/collector-responsibilities" element={<CollectorResponsibilities />} />
      <Route path="/medical-examiner-process" element={<MedicalExaminerProcess />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="collectors" element={<Collectors />} />
        <Route path="finance" element={<Finance />} />
        <Route path="support" element={<Support />} />
        <Route path="profile" element={<Profile />} />
        <Route path="database" element={<Database />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="covered-members" element={<CoveredMembers />} />
      </Route>
    </Routes>
  );
}