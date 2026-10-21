import NotFound, { notFoundMetadata } from '@/components/studio/NotFound'

// notFound() thrown by a public page (unknown article, car, build or part): the layout above
// already provides the studio frame.
export const metadata = notFoundMetadata
export default NotFound
