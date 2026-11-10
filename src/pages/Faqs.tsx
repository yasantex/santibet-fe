import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon } from '@hugeicons/core-free-icons'
import PageNav from '../components/globals/PageNav'
import { TextLoader } from '../components/globals/ReusedText'
import { Button } from '../components/globals/Button'
import { useFaqs } from '../data_layer/pages'
import { JsonLd } from '../seo/Seo'

/** Question-and-answer pairs from `/faqs`, in the order admins set. */
const Faqs = () => {
  const { data: faqs, isLoading, isError, refetch } = useFaqs()

  return (
    <main className='max-w-2xl mx-auto px-5 py-8'>
      <PageNav crumbs={[{ label: 'FAQs' }]} />
      <h1 className='my-5 text-2xl font-bold text-black'>
        Frequently Asked Questions
      </h1>
      {isLoading ? (
        <TextLoader count={16} />
      ) : isError ? (
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center'>
          <p className='text-sm text-neutral-10'>
            We couldn’t load the FAQs right now.
          </p>
          <Button
            type='button'
            text='Try again'
            className='w-fit!'
            variation='plain'
            onClick={() => refetch()}
          />
        </div>
      ) : !faqs?.length ? (
        <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
          Not available yet.
        </p>
      ) : (
        <div className='flex flex-col divide-y divide-border rounded-2xl border border-border bg-card'>
          {/* FAQPage markup: lets search and answer engines quote these. */}
          <JsonLd
            data={{
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            }}
          />
          {faqs.map((faq) => (
            <details key={faq.id} className='group px-4'>
              <summary className='flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-black [&::-webkit-details-marker]:hidden'>
                {faq.question}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  size={18}
                  className='shrink-0 text-neutral-10 transition-transform group-open:rotate-180'
                />
              </summary>
              <p className='pb-4 text-sm leading-relaxed whitespace-pre-line text-neutral-10'>
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      )}
    </main>
  )
}

export default Faqs
