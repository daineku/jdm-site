import { notFound } from 'next/navigation'
import AdminClient from './AdminClient'

export const dynamic = 'force-dynamic'

export default async function AdminPage({ params }: { params: Promise<{ adminPath: string }> }) {
  const { adminPath } = await params
  if (!process.env.ADMIN_SECRET_PATH || adminPath !== process.env.ADMIN_SECRET_PATH) {
    notFound()
  }
  return <AdminClient adminSecret={adminPath} />
}
