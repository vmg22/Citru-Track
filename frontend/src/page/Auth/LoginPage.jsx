import LoginForm from "./components/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh", // Ocupa toda la altura de la pantalla
        // Asegúrate que 'bg_orchard.png' esté en la carpeta /public
        background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/bg_orchard.png') center/cover no-repeat",
      }}
    >
      <LoginForm />
    </div>
  );
}