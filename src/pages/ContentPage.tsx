import { useParams } from 'react-router'
import ContentPageView from '../components/globals/ContentPageView'

/** Any admin-managed page without a route of its own. */
const ContentPage = () => {
  const { slug = '' } = useParams()
  return <ContentPageView key={slug} slug={slug} />
}

export default ContentPage
