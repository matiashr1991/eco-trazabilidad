import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { QrScanner } from "@/components/qr-scanner";

export default async function ScanPage() {
  await requireUser();

  return (
    <main>
      <div className="pageHeader">
        <h1>Escaneo</h1>
        <Link className="btn secondary" href="/">
          Volver
        </Link>
      </div>

      <QrScanner />
    </main>
  );
}
