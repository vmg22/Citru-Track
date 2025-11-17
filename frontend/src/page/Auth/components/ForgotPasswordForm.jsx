import { useState } from "react";
import { useAuthStore } from "../store/authStore";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const success = await requestPasswordReset(email);

    if (success) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          backgroundColor: "rgba(224, 224, 224, 0.4)",
          padding: "40px",
          borderRadius: "16px",
          width: "400px",
          textAlign: "center",
          fontFamily: "Arial, sans-serif",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Icono de éxito */}
        <div
          style={{
            width: "80px",
            height: "80px",
            backgroundColor: "#6FBF47",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <svg
            width="40"
            height="40"
            fill="white"
            viewBox="0 0 24 24"
          >
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>

        <h2 style={{ color: "#333", marginBottom: "15px" }}>
          ¡Correo Enviado!
        </h2>
        <p style={{ color: "#666", marginBottom: "25px", lineHeight: "1.5" }}>
          Hemos enviado un enlace de recuperación a{" "}
          <strong>{email}</strong>. Revisa tu bandeja de entrada y spam.
        </p>
        <button
          onClick={() => (window.location.href = "/login")}
          style={{
            backgroundColor: "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px 30px",
            fontSize: "16px",
            fontWeight: "bold",
            cursor: "pointer",
            transition: "background-color 0.3s",
          }}
        >
          Volver al Login
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "rgba(224, 224, 224, 0.4)",
        padding: "40px",
        borderRadius: "16px",
        width: "400px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Logo */}
      <div style={{ marginBottom: "30px" }}>
        <img
          src="/logo_citrustrack.png"
          alt="CitrusTrack Logo"
          style={{
            width: "100px",
            height: "100px",
            backgroundColor: "#FFFFFF",
            borderRadius: "10px",
            padding: "10px",
            marginBottom: "15px",
          }}
        />
        <h2 style={{ fontSize: "28px", color: "#333", margin: "0 0 10px" }}>
          ¿Olvidaste tu contraseña?
        </h2>
        <p style={{ fontSize: "14px", color: "#666", margin: "0" }}>
          Ingresa tu correo y te enviaremos un enlace para recuperarla
        </p>
      </div>

      {/* Formulario */}
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {error && (
          <div
            style={{
              color: "#d32f2f",
              backgroundColor: "#ffebee",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}

        {/* Email Input */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            padding: "12px 15px",
            gap: "10px",
          }}
        >
          <span style={{ color: "#888", display: "flex" }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="correo@ejemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            style={{
              border: "none",
              outline: "none",
              backgroundColor: "transparent",
              flexGrow: 1,
              fontSize: "16px",
            }}
          />
        </div>

        {/* Botón Enviar */}
        <button
          onClick={handleSubmit}
          disabled={loading || !email}
          style={{
            backgroundColor: loading || !email ? "#BDBDBD" : "#6FBF47",
            color: "white",
            border: "none",
            borderRadius: "8px",
            padding: "14px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: loading || !email ? "not-allowed" : "pointer",
            transition: "background-color 0.3s",
          }}
        >
          {loading ? "Enviando..." : "Enviar Enlace"}
        </button>

        {/* Link para volver */}
        <button
          onClick={() => (window.location.href = "/login")}
          disabled={loading}
          style={{
            background: "none",
            border: "none",
            color: "#444",
            cursor: "pointer",
            fontSize: "14px",
            marginTop: "10px",
          }}
        >
          ← Volver al Login
        </button>
      </div>
    </div>
  );
}