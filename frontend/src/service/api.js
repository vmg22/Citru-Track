import axios from "axios";


export const API = axios.create({
baseURL: "http://localhost:4000/api", // BACKEND EXPRESS
});


export const loginRequest = async (email, password) => {
return await API.post("/auth/login", { email, password });
};