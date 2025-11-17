import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function AuthForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Determinar el modo inicial basado en la URL
  const initialMode = searchParams.get("token") ? "reset" : "login";
  const [mode, setMode] = useState(initialMode); // 'login', 'forgot', 'reset', 'success'
  
  // Estados para login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Estados para reset password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Token para reset desde URL
  const resetToken = searchParams.get("token");

  // Store
  const login = useAuthStore((state) => state.login);
  const requestPasswordReset = useAuthStore((state) => state.requestPasswordReset);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const error = useAuthStore((state) => state.error);
  const loading = useAuthStore((state) => state.loading);

  // Handler para Login
  const handleLogin = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  // Handler para Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    const success = await requestPasswordReset(email);
    if (success) {
      setMode("success");
    }
  };

  // Handler para Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    const success = await resetPassword(resetToken, newPassword);
    if (success) {
      setMode("success");
      setTimeout(() => {
        setMode("login");
        navigate("/login");
      }, 3000);
    }
  };

  // Helper para limpiar formulario
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  // ========== RENDERIZADO CONDICIONAL ==========
  
  // Pantalla de Éxito
  if (mode === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.successIcon}>
          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
        </div>

        <h2 style={{ color: "#333", marginBottom: "15px" }}>
          {resetToken ? "¡Contraseña Actualizada!" : "¡Correo Enviado!"}
        </h2>
        <p style={{ color: "#666", marginBottom: "25px", lineHeight: "1.5" }}>
          {resetToken 
            ? "Tu contraseña ha sido cambiada exitosamente. Serás redirigido al login..." 
            : `Hemos enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada y spam.`
          }
        </p>
        <button
          onClick={() => {
            setMode("login");
            resetForm();
          }}
          style={styles.primaryButton}
        >
          Volver al Login
        </button>
      </div>
    );
  }

  // Formulario de Reset Password
  if (mode === "reset") {
    if (!resetToken) {
      return (
        <div style={styles.container}>
          <div style={styles.errorIcon}>
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </div>
          <h2 style={{ color: "#d32f2f", marginBottom: "15px" }}>Token Inválido</h2>
          <p style={{ color: "#666", marginBottom: "25px" }}>
            El enlace de recuperación no es válido o ha expirado.
          </p>
          <button onClick={() => setMode("login")} style={styles.primaryButton}>
            Volver al Login
          </button>
        </div>
      );
    }

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src="/logo_citrustrack.png" alt="CitrusTrack Logo" style={styles.logo} />
          <h2 style={styles.title}>Nueva Contraseña</h2>
          <p style={styles.subtitle}>Ingresa tu nueva contraseña</p>
        </div>

        <div style={styles.formContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.inputWrapper}>
            <span style={styles.icon}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8h-1V6c0-2.8-2.2-5-5-5S6 3.2 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H8V6zm9 14H5V10h12v10z" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nueva contraseña"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>

          <div style={styles.inputWrapper}>
            <span style={styles.icon}>
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 8h-1V6c0-2.8-2.2-5-5-5S6 3.2 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H8V6zm9 14H5V10h12v10z" />
              </svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </div>

          {newPassword && (
            <div style={{ textAlign: "left" }}>
              <div style={styles.strengthBar}>
                <div
                  style={{
                    ...styles.strengthFill,
                    width: `${Math.min((newPassword.length / 12) * 100, 100)}%`,
                    backgroundColor:
                      newPassword.length < 6 ? "#f44336" :
                      newPassword.length < 10 ? "#ff9800" : "#4caf50",
                  }}
                />
              </div>
              <p style={styles.strengthText}>
                {newPassword.length < 6 ? "Contraseña débil" :
                 newPassword.length < 10 ? "Contraseña media" : "Contraseña fuerte"}
              </p>
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || !confirmPassword}
            style={{
              ...styles.primaryButton,
              backgroundColor: loading || !newPassword || !confirmPassword ? "#BDBDBD" : "#6FBF47",
              cursor: loading || !newPassword || !confirmPassword ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Actualizando..." : "Cambiar Contraseña"}
          </button>

          <button onClick={() => setMode("login")} disabled={loading} style={styles.linkButton}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Formulario Forgot Password
  if (mode === "forgot") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <img src="/logo_citrustrack.png" alt="CitrusTrack Logo" style={styles.logo} />
          <h2 style={styles.title}>¿Olvidaste tu contraseña?</h2>
          <p style={styles.subtitle}>
            Ingresa tu correo y te enviaremos un enlace para recuperarla
          </p>
        </div>

        <div style={styles.formContainer}>
          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.inputWrapper}>
            <span style={styles.icon}>
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
              style={styles.input}
            />
          </div>

          <button
            onClick={handleForgotPassword}
            disabled={loading || !email}
            style={{
              ...styles.primaryButton,
              backgroundColor: loading || !email ? "#BDBDBD" : "#6FBF47",
              cursor: loading || !email ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Enviando..." : "Enviar Enlace"}
          </button>

          <button onClick={() => setMode("login")} disabled={loading} style={styles.linkButton}>
            ← Volver al Login
          </button>
        </div>
      </div>
    );
  }

  // Formulario de Login (por defecto)
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <img src="/logo_citrustrack.png" alt="CitrusTrack Logo" style={styles.logo} />
        <div style={styles.brandTitle}>CitrusTrack</div>
        <div style={styles.brandSubtitle}>Gestión Industrial Citrícola</div>
      </div>

      <div style={styles.formContainer}>
        {error && <div style={styles.errorBox}>{error}</div>}

        <div style={styles.inputWrapper}>
          <span style={styles.icon}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 5-2.3 5-5s-2.3-5-5-5-5 2.3-5 5 2.3 5 5 5zm0 2c-4 0-8 2-8 5v1h16v-1c0-3-4-5-8-5z" />
            </svg>
          </span>
          <input
            type="email"
            placeholder="Ingresa tu usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            style={styles.input}
          />
        </div>

        <div style={styles.inputWrapper}>
          <span style={styles.icon}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 8h-1V6c0-2.8-2.2-5-5-5S6 3.2 6 6v2H5c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM8 6c0-1.7 1.3-3 3-3s3 1.3 3 3v2H8V6zm9 14H5V10h12v10z" />
            </svg>
          </span>
          <input
            type="password"
            placeholder="Ingresa tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            style={styles.input}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...styles.primaryButton,
            backgroundColor: loading ? "#BDBDBD" : "#6FBF47",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "10px",
          }}
        >
          {loading ? "Cargando..." : "Entrar"}
        </button>

        <div style={styles.linksContainer}>
          <button
            onClick={() => setMode("forgot")}
            disabled={loading}
            style={styles.linkButton}
          >
            ¿Olvidaste tu contraseña?
          </button>
          {/* <button
            onClick={() => navigate("/register")}
            disabled={loading}
            style={styles.linkButton}
          >
            Crear cuenta
          </button> */}
        </div>
      </div>
    </div>
  );
}

// ========== ESTILOS ==========
const styles = {
  container: {
    backgroundColor: "rgba(224, 224, 224, 0.4)",
    padding: "40px",
    borderRadius: "16px",
    width: "400px",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
  },
  header: {
    marginBottom: "30px",
  },
  logo: {
    width: "100px",
    height: "100px",
    backgroundColor: "#FFFFFF",
    borderRadius: "10px",
    padding: "10px",
    marginBottom: "15px",
  },
  brandTitle: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#333",
    margin: "0",
  },
  brandSubtitle: {
    fontSize: "16px",
    color: "#666",
    margin: "0",
  },
  title: {
    fontSize: "28px",
    color: "#333",
    margin: "0 0 10px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#666",
    margin: "0",
  },
  formContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  errorBox: {
    color: "#d32f2f",
    backgroundColor: "#ffebee",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
  },
  inputWrapper: {
    display: "flex",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: "8px",
    padding: "12px 15px",
    gap: "10px",
  },
  icon: {
    color: "#888",
    display: "flex",
  },
  input: {
    border: "none",
    outline: "none",
    backgroundColor: "transparent",
    flexGrow: 1,
    fontSize: "16px",
  },
  eyeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#888",
    display: "flex",
    fontSize: "18px",
  },
  primaryButton: {
    backgroundColor: "#6FBF47",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "14px",
    fontSize: "18px",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "background-color 0.3s",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#444",
    cursor: "pointer",
    fontSize: "14px",
    textDecoration: "underline",
  },
  linksContainer: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "15px",
  },
  successIcon: {
    width: "80px",
    height: "80px",
    backgroundColor: "#6FBF47",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  errorIcon: {
    width: "80px",
    height: "80px",
    backgroundColor: "#f44336",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  strengthBar: {
    height: "4px",
    backgroundColor: "#e0e0e0",
    borderRadius: "2px",
    overflow: "hidden",
    marginBottom: "5px",
  },
  strengthFill: {
    height: "100%",
    transition: "all 0.3s",
  },
  strengthText: {
    fontSize: "12px",
    color: "#666",
    margin: 0,
  },
};