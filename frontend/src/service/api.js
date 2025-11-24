import axios from "axios";


export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api", // BACKEND EXPRESS
});


export const loginRequest = async (email, password) => {
return await API.post("/auth/login", { email, password });
};