import { useParams } from 'react-router'
import ContentPageView from '../components/globals/ContentPageView'

/**
 * An admin-managed page: one of the known pages on its own route (`slug`
 * given), or any other page at `/pages/:slug`.
 */
const ContentPage = ({ slug: fixedSlug }: { slug?: string }) => {
  const { slug = fixedSlug ?? '' } = useParams()
  return <ContentPageView key={slug} slug={slug} />
}

export default ContentPage
