import { useState } from "react";
import { loginRequest } from "../services/api";
import { useAuthStore } from "../store/authStore";


export default function Login() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState(null);


const login = useAuthStore((state) => state.login);


const handleSubmit = async (e) => {
e.preventDefault();
setError(null);


try {
const res = await loginRequest(email, password);
login(res.data.usuario, res.data.token);
window.location.href = "/"; // REDIRIGE AL HOME
} catch (err) {
setError("Credenciales inválidas o error de servidor");
}
};


return (
<div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
<div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm">
<h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>


{error && <p className="text-red-500 text-center mb-4">{error}</p>}


<form onSubmit={handleSubmit} className="space-y-4">
<input
type="email"
placeholder="Email"
className="w-full p-3 border rounded-xl"
onChange={(e) => setEmail(e.target.value)}
/>


<input
type="password"
placeholder="Contraseña"
className="w-full p-3 border rounded-xl"
onChange={(e) => setPassword(e.target.value)}
/>


<button
type="submit"
className="w-full p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
>
Entrar
</button>
</form>
</div>
</div>
);
}