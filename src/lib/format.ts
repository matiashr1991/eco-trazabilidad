import { CustodyStatus } from "@prisma/client";

export function statusLabel(status: CustodyStatus) {
  switch (status) {
    case CustodyStatus.IN_INTERNAL_NODE:
      return "En area interna";
    case CustodyStatus.IN_INTERNAL_TRANSIT:
      return "En transito interno";
    case CustodyStatus.OUT_OF_BUILDING:
      return "Fuera del edificio";
    case CustodyStatus.ARCHIVED:
      return "Archivado";
    default:
      return status;
  }
}

export function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

