import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getModelBySlug, getModelPhotos, getModelBuilds, getModelAccessories, getModelVideos, getModelGames, getModelBlocks } from '@/lib/data'
import CarPageClient from './CarPageClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) return {}
  return {
    title: model.seo_title || model.title,
    description: model.seo_description || model.description || undefined,
    openGraph: {
      title: model.seo_title || model.title,
      description: model.seo_description || model.description || undefined,
      images: model.cover_image ? [model.cover_image] : [],
    },
  }
}

export default async function CarPage({ params }: Props) {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) notFound()

  const [photos, builds, accessories, videos, games, blocks] = await Promise.all([
    getModelPhotos(model.id),
    getModelBuilds(model.id),
    getModelAccessories(model.id),
    getModelVideos(model.id),
    getModelGames(model.id),
    getModelBlocks(model.id),
  ])

  return (
    <CarPageClient
      model={model}
      photos={photos}
      builds={builds}
      accessories={accessories}
      videos={videos}
      games={games}
      blocks={blocks}
    />
  )
}
