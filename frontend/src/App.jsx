import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useAuthStore } from "./page/Auth/store/useAuthStore";
import Login from "./page/Auth/LoginPage";


function Home() {
const user = useAuthStore((state) => state.user);
return (
<div className="p-10 text-xl">Bienvenido, {user?.email}</div>
);
}


export default function App() {
const isAuthenticated = useAuthStore((state) => state.isAuthenticated);


return (
<BrowserRouter>
<Routes>
<Route path="/login" element={<Login />} />
<Route
path="/"
element={isAuthenticated ? <Home /> : <Login />}
/>
</Routes>
</BrowserRouter>
);
}