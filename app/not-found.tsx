import NotFound, { notFoundMetadata } from '@/components/studio/NotFound'
import StudioShell from '@/components/studio/StudioShell'

// URLs no route matches at all (e.g. two unknown segments): the public 404 in the studio frame.
export const metadata = notFoundMetadata
export default function RootNotFound() {
  return <StudioShell><NotFound /></StudioShell>
}
