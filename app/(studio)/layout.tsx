import type { ReactNode } from 'react'
import StudioShell from '@/components/studio/StudioShell'

// Every public page: the studio header and footer around the page. No request data is read
// here, so the pages inside stay statically generated.
export default function StudioLayout({ children }: { children: ReactNode }) {
  return <StudioShell>{children}</StudioShell>
}
