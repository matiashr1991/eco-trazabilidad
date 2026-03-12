import Link from "next/link";
import { requireUser } from "@/lib/auth";

export default async function MobileHomePage() {
  const user = await requireUser();

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="pageHeader">
        <h1>Modo movil</h1>
        <Link className="btn secondary" href="/">
          Dashboard
        </Link>
      </div>

      <section className="card" style={{ padding: "1rem" }}>
        <p className="small" style={{ marginBottom: "0.7rem" }}>
          Usuario: {user.nombre}
        </p>
        <Link className="btn" href="/mobile/scan" style={{ display: "inline-block", width: "100%", textAlign: "center", padding: "0.85rem" }}>
          Escanear QR
        </Link>
      </section>
    </main>
  );
}
