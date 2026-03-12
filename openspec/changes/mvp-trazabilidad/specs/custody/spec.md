# Custody Specification

## Purpose

Track the physical movement and current responsibility of files between internal areas and external destinations.

## Requirements

### Requirement: Internal Dispatch

An "Expediente" MUST be marked as "In Transit" when dispatched from one internal area to another.

#### Scenario: Dispatch to another area
- GIVEN an "Expediente" currently in the "Patrimonio" area
- WHEN a user from "Patrimonio" dispatches it to "Jurídicos"
- THEN the status MUST change to `in_internal_transit`
- AND the "Expediente" MUST appear in the "Pending Receipt" list for "Jurídicos"

### Requirement: Internal Receipt

A record MUST only update its current area when the receiving area confirms receipt.

#### Scenario: Confirming receipt
- GIVEN an "Expediente" in transit from "Patrimonio" to "Jurídicos"
- WHEN a user from "Jurídicos" confirms receipt
- THEN the status MUST change to `in_internal_node`
- AND the current area MUST be updated to "Jurídicos"
- AND the "Patrimonio" area MUST no longer have operational control over it

### Requirement: External Transfer

The system MUST track when an "Expediente" leaves the building to an external entity.

#### Scenario: Registration of external exit
- GIVEN an "Expediente" in the "Privada" area
- WHEN a user registers an exit to "Contención del Gasto" (External Node)
- THEN the status MUST change to `out_of_building`
- AND the system MUST record the last internal area (Privada) as the responsible party for the exit

### Requirement: External Return

The system MUST allow registering the return of an "Expediente" from an external entity.

#### Scenario: External re-entry
- GIVEN an "Expediente" marked as `out_of_building`
- WHEN a user from "DGA" registers its return
- THEN the status MUST change back to `in_internal_node`
- AND the current area MUST be set to "DGA"

### Requirement: Administrative Correction

Admins MUST be able to "force" a state or location update to resolve human errors or inconsistencies.

#### Scenario: Correcting location
- GIVEN an "Expediente" recorded as "In Transit" but physically present in "Patrimonio"
- WHEN an Admin performs an administrative correction to set location to "Patrimonio"
- THEN the system MUST update the state accordingly
- AND create an audit log entry documenting the correction
