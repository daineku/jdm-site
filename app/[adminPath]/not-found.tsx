import NotFound, { notFoundMetadata } from '@/components/studio/NotFound'
import StudioShell from '@/components/studio/StudioShell'

// Any unknown single-segment URL lands in this segment (it is the admin catch-all) and is
// rejected with notFound(); show the public 404 inside the studio frame, never the admin.
export const metadata = notFoundMetadata
export default function AdminSegmentNotFound() {
  return <StudioShell><NotFound /></StudioShell>
}
