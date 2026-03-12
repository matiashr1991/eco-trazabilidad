import { redirect } from "next/navigation";
import { loginAction } from "@/actions/auth";
import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;

  if (user) {
    redirect("/");
  }

  return (
    <main style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "1rem" }}>
      <section className="card" style={{ width: "100%", maxWidth: "440px", padding: "3rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Bienvenido</h1>
          <p className="small">Ingrese sus credenciales para acceder al subsistema de trazabilidad.</p>
        </div>

        {params.error && <div className="notice error">{params.error}</div>}

        <form action={loginAction}>
          <div className="formRow">
            <label htmlFor="username">Usuario</label>
            <input 
              id="username" 
              name="username" 
              placeholder="Nombre de usuario"
              required 
              autoComplete="username" 
            />
          </div>

          <div className="formRow">
            <label htmlFor="password">Contraseña</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              placeholder="••••••••"
              required 
              autoComplete="current-password" 
            />
          </div>

          <div style={{ marginTop: "2rem" }}>
            <button type="submit" style={{ width: "100%" }}>Iniciar Sesión</button>
          </div>
        </form>
        
        <div style={{ marginTop: "2rem", textAlign: "center" }}>
          <p className="small" style={{ color: "var(--muted)" }}>
            &copy; 2024 Plataforma Administrativa Interna
          </p>
        </div>
      </section>
    </main>
  );
}
