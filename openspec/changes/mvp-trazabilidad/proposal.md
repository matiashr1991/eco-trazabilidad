# Proposal: Subsistema de Trazabilidad de Expedientes Físicos (MVP)

## Intent

Implement a simple, scalable, and auditable system to track the physical location and custody of purchase files and related documents. This replaces partial Excel tracking, reducing uncertainty, manual searches, and loss of visibility over the document lifecycle.

## Scope

### In Scope
- **Authentication & RBAC**: Implementation of roles (Admin, Area Manager, Operator) and area assignment.
- **Expediente Management**: Registration, search (by number or QR), and QR code generation.
- **Internal Custody Flow**: "Despachar" (Dispatch) and "Recibir" (Receive) operations between internal areas.
- **External Custody Flow**: Tracking exits to external entities without system access and subsequent re-entry.
- **Dashboards**: Role-based views for global supervision and area-specific operation.
- **QR Scanning**: Mobile-friendly scanning from the browser.
- **Audit Logs**: Record of all critical movement and administrative correction events.
- **Responsive UI**: Optimized for both mobile and desktop use.

### Out of Scope
- Digitalization of document content (paper only).
- Digital signatures.
- Detailed administrative workflows (beyond custody).
- Integration with third-party systems.

## Approach

- **Framework**: Next.js 15+ (App Router) using Server Components and Server Actions.
- **Database**: PostgreSQL with Prisma ORM.
- **UI/UX**: Premium, responsive interface using Vanilla CSS or a modern utility system (avoiding Tailwind unless requested, following system rules for premium look).
- **Scanning**: HTML5-QRCODE or similar browser-supported scanning library.
- **Hosting/Deployment**: Prepared for standard modern web deployment.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `prisma/schema.prisma` | New | Database schema definition. |
| `src/app/` | New | App routes, layouts, and pages. |
| `src/components/` | New | Shared UI components (QR scanner, dashboards, etc.). |
| `src/lib/` | New | Database clients, auth logic, and utilities. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Low Adoption | Medium | Keep UX minimal, mobile-first, and focus on one-touch actions. |
| Inconsistent States | Low | Implement robust backend validations for allowed transitions. |
| Missing External Returns | High | Supervisor dashboard with "Out of Building" alerts. |

## Rollback Plan

Revert to Excel tracking and use manual records. Database migrations can be rolled back using Prisma Migrate.

## Dependencies

- PostgreSQL database instance.
- Node.js environment.

## Success Criteria

- [ ] Successful registration of a "Expediente" with QR generation.
- [ ] Complete internal transfer cycle (Dispatch -> Receipt) reflected in history.
- [ ] Tracking of external transfer and return correctly updates document state.
- [ ] Functional QR scanning from a mobile device browser.
- [ ] Admin can correct an inconsistent transaction.
