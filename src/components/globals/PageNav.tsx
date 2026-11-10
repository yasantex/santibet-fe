import { Fragment, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router'
import { JsonLd } from '../../seo/Seo'
import { absoluteUrl } from '../../seo/seoUtils'
import { useGoBack } from '../../hooks/useGoBack'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons'

export type Crumb = { label: string; href?: string }

interface PageNavProps {
  /** Trail after "Home"; the last crumb is the current page (not a link). */
  crumbs?: Crumb[]
  /** Where Back leads when there's no in-app history. Defaults to the
   *  nearest linked crumb, then Home. */
  fallbackHref?: string
  /** Right-aligned actions (share, save…). */
  actions?: ReactNode
  className?: string
}

/** Back button + breadcrumbs, shared by detail and section pages. */
const PageNav = ({
  crumbs = [],
  fallbackHref,
  actions,
  className = '',
}: PageNavProps) => {
  const trail: Crumb[] = [{ label: 'Home', href: '/' }, ...crumbs]
  const parentHref =
    fallbackHref ??
    [...trail.slice(0, -1)].reverse().find((c) => c.href)?.href ??
    '/'
  const goBack = useGoBack(parentHref)
  const { pathname } = useLocation()

  // BreadcrumbList markup so search results show the trail. Unlinked middle
  // crumbs are skipped (schema.org needs a URL for every item but the last).
  const breadcrumbLd =
    crumbs.length > 0 && crumbs[crumbs.length - 1].label
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: trail
            .filter((c, i) => c.href || i === trail.length - 1)
            .map((c, i, list) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: c.label,
              item: absoluteUrl(i === list.length - 1 ? pathname : c.href!),
            })),
        }
      : null

  return (
    <div className={`flex items-center justify-between gap-3 ${className}`}>
      {breadcrumbLd && <JsonLd data={breadcrumbLd} />}
      <nav
        aria-label='Breadcrumb'
        className='flex min-w-0 items-center gap-2 text-sm text-neutral-10'
      >
        <button
          type='button'
          onClick={goBack}
          aria-label='Go back'
          className='flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-card text-black hover:bg-hover'
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        </button>
        <ol className='flex min-w-0 items-center gap-1.5'>
          {trail.map((crumb, i) => {
            const last = i === trail.length - 1
            // On phones only the immediate parent and the current page fit.
            const hideOnMobile = trail.length > 2 && i < trail.length - 2
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <li
                    aria-hidden
                    // Also hidden before the first crumb phones show.
                    className={`shrink-0 ${
                      hideOnMobile || (trail.length > 2 && i === trail.length - 2)
                        ? 'hidden md:block'
                        : ''
                    }`}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                  </li>
                )}
                <li
                  className={`${last ? 'min-w-0 truncate' : 'shrink-0'} ${
                    hideOnMobile ? 'hidden md:block' : ''
                  }`}
                >
                  {last || !crumb.href ? (
                    <span
                      aria-current={last ? 'page' : undefined}
                      className={last ? 'font-medium text-black' : ''}
                    >
                      {crumb.label}
                    </span>
                  ) : (
                    <Link to={crumb.href} className='hover:text-black'>
                      {crumb.label}
                    </Link>
                  )}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>
      {actions && <div className='flex shrink-0 items-center gap-2'>{actions}</div>}
    </div>
  )
}

export default PageNav
