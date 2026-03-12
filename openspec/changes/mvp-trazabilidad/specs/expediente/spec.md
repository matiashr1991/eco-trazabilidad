# Expediente Specification

## Purpose

Define the lifecycle and identification of physical files within the system.

## Requirements

### Requirement: Unique Identification

Every "Expediente" MUST have a unique human-readable number and a system-generated QR code.

#### Scenario: Expediente creation
- GIVEN a user in the "DGA" area
- WHEN they create a new "Expediente" with number "COMPRA-2024-001"
- THEN the system MUST generate a unique internal ID
- AND generate a scannable QR code containing a direct link to the record
- AND set the initial custody to "DGA"

### Requirement: QR Scanning and Search

The system MUST allow users to locate an "Expediente" by typing its number or scanning its QR code.

#### Scenario: Search by number
- GIVEN several "Expedientes" in the database
- WHEN a user types "001" in the search bar
- THEN the system MUST return a list containing "COMPRA-2024-001"

#### Scenario: QR code redirection
- GIVEN a physical "Expediente" with a printed QR code
- WHEN a user scans the code using their mobile browser
- THEN the system MUST redirect them directly to the detail view and available actions for that "Expediente"
