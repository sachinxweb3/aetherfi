import { DashboardSkeleton } from "./skeleton"

// Shown instantly on client-side navigation into /dashboard while the route
// streams (Next.js wraps page.tsx in a Suspense boundary behind this file).
export default function Loading() {
  return <DashboardSkeleton />
}
