# Yantrix CRM Module (Planned)

> **Status:** 📋 Planned — Phase 3

This module will provide Customer Relationship Management features, reusing the existing `customers` table from the Invoice module.

## Planned Features

- Lead management & pipeline
- Contact history & activity log
- Deal tracking (Kanban view)
- Email & WhatsApp integration
- Follow-up reminders
- Customer segmentation
- Sales reports & forecasts
- Integration with Invoice module (one-click invoice from deal)

## Data Reuse

This module will reuse:
- `customers` table (existing)
- `users` / `memberships` (existing)
- `businesses` / `branches` (existing)
- `audit_logs` (existing)
- `notifications` (existing)

## Prerequisites

- Yantrix Core (Invoice module)
- Business Plan subscription or above

## Getting Started (Future)

```bash
# Enable CRM module for a business
POST /api/v1/modules/crm/enable
```
