import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getModelBySlug, getModelPhotos, getModelBuilds, getModelAccessories, getModelVideos, getModelGames, getModelBlocks, getModelFitment, getModelCategories, getModelParts, getModelWheelSpecs, getSiteSettings, getModelBuildInstances } from '@/lib/data'
import { resolveSeoTitle, resolveSeoDescription, resolveOgImages, getBaseUrl } from '@/lib/seo'
import CarPageClient from './CarPageClient'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [model, settings] = await Promise.all([
    getModelBySlug(slug),
    getSiteSettings(),
  ])
  if (!model) return {}

  // Fetch first photo for OG image fallback (cover_image is legacy override)
  const photos = await getModelPhotos(model.id).catch(() => [])
  const coverSrc = model.cover_image || photos[0]?.url || null

  const title       = resolveSeoTitle(model.seo_title, model.title, settings)
  const description = resolveSeoDescription(model.seo_description, model.description, settings)
  const images      = resolveOgImages(null, coverSrc, settings)
  const canonical   = `${getBaseUrl()}/cars/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title,
      description,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images,
    },
  }
}

export default async function CarPage({ params }: Props) {
  const { slug } = await params
  const model = await getModelBySlug(slug)
  if (!model) notFound()

  const [photos, builds, accessories, videos, games, blocks, fitment, categories, parts, wheelSpecs, buildInstances] = await Promise.all([
    getModelPhotos(model.id),
    getModelBuilds(model.id),
    getModelAccessories(model.id),
    getModelVideos(model.id),
    getModelGames(model.id),
    getModelBlocks(model.id),
    getModelFitment(model.id),
    getModelCategories(model.id),
    getModelParts(model.id),
    getModelWheelSpecs(model.id),
    getModelBuildInstances(model.id),
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
      fitment={fitment}
      categories={categories}
      parts={parts}
      wheelSpecs={wheelSpecs}
      buildInstances={buildInstances}
    />
  )
}
