import ContentPageView from '../components/globals/ContentPageView'
import SupportActions from '../components/support/SupportActions'

const ContactSupport = ({ slug }: { slug: string }) => (
  <ContentPageView slug={slug}>
    <div className='mb-6'>
      <SupportActions />
    </div>
  </ContentPageView>
)

export default ContactSupport
