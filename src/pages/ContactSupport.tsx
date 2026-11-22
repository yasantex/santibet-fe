import ContentPageView from '../components/globals/ContentPageView'
import SupportActions from '../components/support/SupportActions'
import ContactForm from '../components/support/ContactForm'

const ContactSupport = ({ slug }: { slug: string }) => (
  <ContentPageView slug={slug} footer={<ContactForm />}>
    <div className='mb-6'>
      <SupportActions />
    </div>
  </ContentPageView>
)

export default ContactSupport
