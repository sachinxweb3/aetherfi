# 06-FRONTEND-BIBLE.md

# AETHERFI FRONTEND BIBLE

Version: 1.0

---

# Purpose

This document defines the official frontend engineering standards for AetherFI.

The frontend must deliver a premium, fast, accessible, and maintainable user experience while integrating seamlessly with blockchain infrastructure.

---

# Core Principles

- User-first design
- Type-safe development
- Component-driven architecture
- Accessibility by default
- Performance-first
- Responsive layouts
- Predictable state management

---

# Technology Stack

Framework:
- Next.js (App Router)

Language:
- TypeScript (Strict Mode)

UI:
- React
- Tailwind CSS
- shadcn/ui

Animation:
- Framer Motion

State:
- TanStack Query
- React Context
- Local State where appropriate

Wallet:
- Wagmi
- Viem
- RainbowKit

---

# Folder Structure

app/
components/
features/
hooks/
lib/
providers/
styles/
types/
utils/

Feature folders should contain:

- components/
- hooks/
- services/
- types/
- validation/
- tests/

---

# Component Standards

Components must be:

- Reusable
- Small
- Single responsibility
- Fully typed
- Accessible
- Testable

Avoid deeply nested components.

---

# State Management

Separate:

- Server State
- Client State
- Wallet State
- Form State
- UI State

Do not mix responsibilities.

---

# Forms

Every form must include:

- Validation
- Loading state
- Error state
- Success state
- Disabled submit while processing

Prefer schema validation (Zod).

---

# UI Standards

Every screen should provide:

- Empty state
- Loading state
- Error state
- Success feedback

Never leave users without feedback.

---

# Performance

Optimize using:

- Code splitting
- Dynamic imports
- Image optimization
- Memoization where appropriate
- Lazy loading
- Efficient rendering

Measure before optimizing.

---

# Accessibility

All interfaces must support:

- Keyboard navigation
- Focus visibility
- Semantic HTML
- ARIA attributes where required
- Sufficient color contrast

Accessibility is mandatory.

---

# Design Principles

Interface should be:

- Clean
- Minimal
- Consistent
- Professional
- Premium
- Responsive

Animations should enhance usability, not distract.

---

# Wallet UX

Wallet flows must:

- Explain connection status
- Detect unsupported networks
- Show transaction progress
- Display confirmations
- Handle user rejection gracefully

---

# Error Handling

Every error should provide:

- Clear explanation
- Suggested recovery
- Retry option when appropriate

Never expose internal implementation details.

---

# Testing

Frontend requires:

- Component tests
- Integration tests
- Accessibility checks
- Responsive verification
- Wallet flow testing

---

# Build Requirements

Before merge:

- TypeScript passes
- ESLint passes
- Production build succeeds
- No hydration issues
- No console errors

---

# Definition of Complete

Frontend work is complete only when:

- UI is functional
- Responsive
- Accessible
- Connected to real data
- Fully tested
- Documented
- Production-ready

---

# End of Document

Next:
07-AI-SYSTEMS.md
