# Design: Subsistema de Trazabilidad de Expedientes Físicos (MVP)

## Technical Approach

The system follows a full-stack Next.js architecture (App Router) using Server Actions for all mutations and business logic. Data persistence is handled by PostgreSQL via Prisma. The UI is designed to be mobile-first for operational efficiency, with a desktop-focused admin dashboard.

## Architecture Decisions

### Decision: State Machine for Custody

**Choice**: Use a `custody_status` enum in the `Expediente` model complemented by specialized movement tables.
**Alternatives considered**: A single `Movements` table with all types.
**Rationale**: Internal transfers require explicit receipt by a second party, while external transfers are one-way registrations (until return). Separating them simplifies queries for "Pending Receipts" and "Out of Building" tracking.

### Decision: Authentication & RBAC

**Choice**: NextAuth.js (Auth.js) for session management and credential-based login.
**Alternatives considered**: Custom JWT implementation.
**Rationale**: NextAuth is the standard for Next.js, provides built-in CSRF protection, and easy integration with database persistence.

### Decision: QR Generation & Scanning

**Choice**: `qrcode` (npm) for server-side generation and `html5-qrcode` for client-side browser scanning.
**Alternatives considered**: Hardware scanners.
**Rationale**: Browser-based scanning lowers the barrier to entry, requiring only a smartphone.

## Data Flow

1. **User Action**: Scans QR or searches for Expediente.
2. **Server Action**: Validates state transitions (e.g., can only dispatch if `IN_INTERNAL_NODE`).
3. **Database**: Atomic update of state and creation of movement record (InternalDispatch or ExternalTransfer).
4. **UI**: Revalidation of paths to show real-time updates.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | Create | Define `User`, `InternalNode`, `ExternalNode`, `Expediente`, `InternalDispatch`, `ExternalTransfer`, `AuditLog`. |
| `src/lib/db.ts` | Create | Prisma client singleton. |
| `src/lib/auth.ts` | Create | NextAuth configuration and role helpers. |
| `src/app/(auth)/login/page.tsx` | Create | Authentication entry point. |
| `src/app/(dashboard)/layout.tsx` | Create | Main navigation and dashboard frame. |
| `src/app/(dashboard)/expedientes/[id]/page.tsx` | Create | Detail view and action panel. |
| `src/app/(dashboard)/scan/page.tsx` | Create | QR scanning interface. |
| `src/actions/expediente.ts` | Create | Server actions for CRUD and movements. |

## Interfaces / Contracts

```typescript
enum CustodyStatus {
  IN_INTERNAL_NODE
  IN_INTERNAL_TRANSIT
  OUT_OF_BUILDING
  ARCHIVED
}

interface Expediente {
  id: string;
  numero: string;
  status: CustodyStatus;
  currentNodeId?: string; // Internal
  currentExternalNodeId?: string;
  lastInternalNodeId?: string; // Reference for external exits
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Transition Logic | Jest tests for state transition validators. |
| Integration | Database CRUD | Prisma tests with a test database. |
| Manual | QR Scanning | Verify mobile browser camera access and redirection. |

## Migration / Rollout

No migration required (Greenfield project). Default areas and nodes will be seeded.
