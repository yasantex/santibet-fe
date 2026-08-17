import { NavLink, useLocation } from 'react-router'

// Mirrors the section-level nav shown above "Sports" / "Crypto" in the
// reference screenshots. Sits below the Header, above the page content.
// Active state is derived from the route, so it stays correct whether the
// user lands on /sports, /sports/:slug, /crypto, or /crypto/:slug.
const sectionTabs = [
  { label: 'Trending', href: '/trending' },
  { label: 'Sports', href: '/sports' },
  { label: 'Crypto', href: '/crypto' },
] as const

const CategoryTabs = () => {
  const location = useLocation()

  return (
    <div className='flex items-center gap-6 border-b border-border px-3 text-sm font-semibold md:px-8'>
      {sectionTabs.map((tab) => {
        const isActive =
          location.pathname === tab.href ||
          location.pathname.startsWith(`${tab.href}/`)

        return (
          <NavLink
            key={tab.href}
            to={tab.href}
            className={`border-b-2 py-3 transition-colors ${
              isActive
                ? 'border-brand-green text-black'
                : 'border-transparent text-neutral-10 hover:text-black'
            }`}
          >
            {tab.label}
          </NavLink>
        )
      })}
    </div>
  )
}

export default CategoryTabs
