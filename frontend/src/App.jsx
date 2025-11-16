import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./page/Dashboard/DashboardPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  );
}