import AuthForm from "./components/AuthForm";

export default function LoginPage() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/bg_orchard.png') center/cover no-repeat",
      }}
    >
      <AuthForm />
    </div>
  );
}