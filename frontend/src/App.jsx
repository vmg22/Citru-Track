import { BrowserRouter, Routes, Route, Navigate  } from "react-router-dom";

import DashboardPage from "./page/Dashboard/DashboardPage";
import LoginPage from "./page/Auth/LoginPage";
import ForgotPasswordPage from "./page/Auth/ForgotPasswordPage";
import ResetPasswordPage from "./page/Auth/ResetPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        
      </Routes>
    </BrowserRouter>
  );
}