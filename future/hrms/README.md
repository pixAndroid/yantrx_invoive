# Yantrix HRMS Module (Planned)

> **Status:** 📋 Planned — Phase 4

This module will provide Human Resource Management features, reusing the existing `users`, `memberships`, and `branches` tables from the core platform.

## Planned Features

- Employee profiles & documents
- Attendance tracking (manual + biometric)
- Leave management
- Payroll processing with PF/ESI/TDS calculations
- Salary slips (PDF)
- Performance reviews
- Holiday calendar
- Expense reimbursements

## Data Reuse

This module will reuse:
- `users` / `memberships` (existing)
- `businesses` / `branches` (existing)
- `expenses` table (existing)
- `audit_logs` (existing)
- `notifications` (existing)

## Sub-modules

- **Attendance** — Daily check-in/check-out, geo-fencing
- **Payroll** — Monthly salary run, statutory deductions
- **Leave** — Approval workflows, balance tracking

## Prerequisites

- Yantrix Core (Invoice module)
- Business Plan subscription or above

## Getting Started (Future)

```bash
# Enable HRMS module for a business
POST /api/v1/modules/hrms/enable
```
