# Auth Specification

## Purpose

Manage system access and permissions based on user roles and assigned internal areas.

## Requirements

### Requirement: Role-Based Access Control (RBAC)

The system MUST restrict access to features based on the user's role:
- **Admin**: Total visibility and full system management.
- **Area Manager**: Manage "Expedientes" currently in their area, dispatch, receive, and register external transfers.
- **Operator**: Read-only access to their area's "Expedientes".

#### Scenario: Admin login
- GIVEN a user with the role "Admin"
- WHEN they log in
- THEN they MUST see the global dashboard with statistics for all areas

#### Scenario: Area Manager restricted access
- GIVEN a user with the role "Area Manager" assigned to the "Jurídicos" area
- WHEN they view the "Expedientes" list
- THEN they MUST only see "Expedientes" currently in "Jurídicos" or in transit to/from "Jurídicos"

### Requirement: Area Assignment

Every user EXCEPT global Admins MUST be associated with exactly one "Internal Node" (Area).

#### Scenario: User creation with area
- GIVEN an Admin creating a new "Area Manager" user
- WHEN they select "Patrimonio" as the assigned area
- THEN the system MUST persist this relationship
- AND the user's operational scope MUST be limited to "Patrimonio"
