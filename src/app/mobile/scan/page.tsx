import Link from "next/link";
import { MobileQrScanner } from "@/components/mobile-qr-scanner";
import { requireUser } from "@/lib/auth";

export default async function MobileScanPage() {
  await requireUser();

  return (
    <main style={{ maxWidth: 560 }}>
      <div className="pageHeader">
        <h1>Escaneo rapido</h1>
        <Link className="btn secondary" href="/mobile">
          Volver
        </Link>
      </div>

      <MobileQrScanner />
    </main>
  );
}
