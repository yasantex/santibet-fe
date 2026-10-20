import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowDown01Icon, ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import RenderMarkdown from './RenderMarkdown'
import { TextLoader } from './ReusedText'
import { Button } from './Button'
import { isPageNotFound, useContentPage } from '../../data_layer/pages'
import {
  findLegacyContentPage,
  splitMarkdownSections,
} from '../../utils/contentPages'
import { formatShortDate } from '../../utils/points'

const FaqAccordion = ({ markdown }: { markdown: string }) => {
  const { intro, sections } = splitMarkdownSections(markdown)

  return (
    <>
      {intro && <RenderMarkdown usePreWrapper={false}>{intro}</RenderMarkdown>}
      <div className='flex flex-col divide-y divide-border rounded-2xl border border-border bg-card'>
        {sections.map((s, i) => (
          <details key={`${i}-${s.heading}`} className='group px-4'>
            <summary className='flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-sm font-semibold text-black [&::-webkit-details-marker]:hidden'>
              {s.heading}
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={18}
                className='shrink-0 text-neutral-10 transition-transform group-open:rotate-180'
              />
            </summary>
            <div className='pb-2'>
              <RenderMarkdown usePreWrapper={false}>{s.body}</RenderMarkdown>
            </div>
          </details>
        ))}
      </div>
    </>
  )
}

interface ContentPageViewProps {
  slug: string
  /** Show each `##` section as a collapsible question. */
  accordion?: boolean
  /** Rendered between the title and the body. */
  children?: ReactNode
}

/**
 * An admin-managed page from `/pages/:slug`. Until it's published, a page
 * that predates the API shows its bundled Markdown; any other page says it
 * isn't available yet.
 */
const ContentPageView = ({
  slug,
  accordion = false,
  children,
}: ContentPageViewProps) => {
  const navigate = useNavigate()
  const legacy = findLegacyContentPage(slug)
  const page = useContentPage(slug)

  const useFallback = page.isError && !!legacy
  const fallback = useQuery({
    queryKey: ['content-fallback', legacy?.fallbackFile],
    queryFn: async () => {
      const res = await fetch(legacy!.fallbackFile)
      if (!res.ok) throw new Error(`Failed to load ${legacy!.fallbackFile}`)
      return res.text()
    },
    enabled: useFallback,
    staleTime: Infinity,
  })

  const title = page.data?.title ?? legacy?.title ?? ''
  const body = page.data?.body ?? (useFallback ? fallback.data : undefined)
  const loading = page.isLoading || (useFallback && fallback.isLoading)
  const notPublished = page.isError && !legacy && isPageNotFound(page.error)
  const failed =
    !loading && body === undefined && !notPublished && (page.isError || fallback.isError)

  return (
    <main className='max-w-2xl mx-auto px-5 py-8'>
      <div
        className='flex items-center gap-3 my-5 cursor-pointer'
        onClick={() => navigate(-1)}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} className='text-black' />
        <h1 className='text-2xl font-bold text-black'>{title}</h1>
      </div>
      {page.data?.updatedAt && formatShortDate(page.data.updatedAt) && (
        <p className='-mt-3 mb-5 text-xs text-neutral-10'>
          Last updated {formatShortDate(page.data.updatedAt)}
        </p>
      )}
      {children}
      {loading ? (
        <TextLoader count={16} />
      ) : notPublished ? (
        <p className='rounded-2xl border border-border bg-card p-6 text-center text-sm text-neutral-10'>
          Not available yet.
        </p>
      ) : failed ? (
        <div className='flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center'>
          <p className='text-sm text-neutral-10'>
            We couldn’t load this page right now.
          </p>
          <Button
            type='button'
            text='Try again'
            className='w-fit!'
            variation='plain'
            onClick={() => (useFallback ? fallback.refetch() : page.refetch())}
          />
        </div>
      ) : body !== undefined ? (
        accordion ? (
          <FaqAccordion markdown={body} />
        ) : (
          <RenderMarkdown usePreWrapper={false}>{body}</RenderMarkdown>
        )
      ) : null}
    </main>
  )
}

export default ContentPageView
