import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./page/Dashboard/DashboardPage";
import DashboardPrincipal from "./page/Dashboard/components/DashboardPrincipal";
import BinReceptionPanel from "./page/Dashboard/components/BinReceptionPanel";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPrincipal />} />
        <Route path="/bins" element={<BinReceptionPanel />} />

      </Routes>
    </BrowserRouter>
  );
}