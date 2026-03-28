import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

// Admin must never be indexed — path is secret but defence-in-depth requires this
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default async function AdminPage({ params }: { params: Promise<{ adminPath: string }> }) {
  const { adminPath } = await params
  if (!process.env.ADMIN_SECRET_PATH || adminPath !== process.env.ADMIN_SECRET_PATH) {
    notFound()
  }
  return <AdminClient adminSecret={adminPath} />
}
