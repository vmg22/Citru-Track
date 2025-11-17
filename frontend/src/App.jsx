import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./page/Dashboard/DashboardPage";
import LoginPage from "./page/Auth/LoginPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}