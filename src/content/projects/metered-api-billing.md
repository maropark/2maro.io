---
title: "Metered API Billing"
description: "The core of a SaaS metering + billing system: ingest usage events, aggregate into hourly windows, tiered-price into monthly invoices, and settle through a signed payment webhook — with a customer dashboard and an internal ops console."
status: "shipped"
tech: ["django", "postgres", "react", "typescript"]
github: "https://github.com/maropark/metered-api-billing"
highlight: true
date: 2026-05-31
---

Usage events flow in, aggregate into hourly windows, and get tiered-priced into monthly invoices behind a signed payment webhook — backed by a Postgres-advisory-locked job runner. 78 tests target the correctness boundaries that actually matter: idempotency, concurrency, tenant isolation, reconciliation of late events, and money.
