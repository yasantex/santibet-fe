import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import RenderMarkdown from './RenderMarkdown'
import { TextLoader } from './ReusedText'
import { Button } from './Button'
import { isPageNotFound, useContentPage } from '../../data_layer/pages'
import { findKnownContentPage } from '../../utils/contentPages'
import { formatShortDate } from '../../utils/points'

interface ContentPageViewProps {
  slug: string
  /** Rendered between the title and the body. */
  children?: ReactNode
}

/**
 * An admin-managed page from `/pages/:slug`. Until it's published, a page
 * that predates the API shows its bundled Markdown; any other page says it
 * isn't available yet.
 */
const ContentPageView = ({ slug, children }: ContentPageViewProps) => {
  const navigate = useNavigate()
  const known = findKnownContentPage(slug)
  const page = useContentPage(slug)

  const useFallback = page.isError && !!known
  const fallback = useQuery({
    queryKey: ['content-fallback', known?.fallbackFile],
    queryFn: async () => {
      const res = await fetch(known!.fallbackFile)
      if (!res.ok) throw new Error(`Failed to load ${known!.fallbackFile}`)
      return res.text()
    },
    enabled: useFallback,
    staleTime: Infinity,
  })

  const title = page.data?.title ?? known?.title ?? ''
  const body = page.data?.body ?? (useFallback ? fallback.data : undefined)
  const loading = page.isLoading || (useFallback && fallback.isLoading)
  const notPublished = page.isError && !known && isPageNotFound(page.error)
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
        <RenderMarkdown usePreWrapper={false}>{body}</RenderMarkdown>
      ) : null}
    </main>
  )
}

export default ContentPageView
