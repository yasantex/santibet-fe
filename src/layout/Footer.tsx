import {
  Facebook01Icon,
  InstagramIcon,
  Linkedin01Icon,
  NewTwitterIcon,
  TiktokIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Link } from 'react-router'

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/santibetng',
    icon: InstagramIcon,
  },
  { name: 'X', href: 'https://x.com/santibetng', icon: NewTwitterIcon },
  {
    name: 'TikTok',
    href: 'https://www.tiktok.com/@santibetng',
    icon: TiktokIcon,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/santibetng',
    icon: Facebook01Icon,
  },
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/santibet/',
    icon: Linkedin01Icon,
  },
]

const footerLinks = [
  { label: 'About', href: '/about-us' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Responsible Gambling', href: '/responsible-gambling' },
  { label: 'Contact Support', href: '/contact-us' },
]

const footerLinksTwo = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-of-service' },
  { label: 'FAQs', href: '/faqs' },
]
const Footer = () => {
  return (
    <footer className='w-full bg-background text-neutral-10 py-10 border-t border-border'>
      <div className='mx-auto max-w-8xl px-6 py-12 sm:px-8 lg:px-12'>
        <div className='flex flex-col gap-10 xl:flex-row xl:justify-between'>
          <div className='max-w-md space-y-4 text-sm leading-relaxed text-neutral-10'>
            <p>
              SantiBet is operated by AWA LAWA LIMITED, a company registered in
              Nigeria, with its registered office at Adegite House, Adegite
              Close, Off Iyin-Ado Road, Iyin-Ekiti, Ekiti State, Nigeria. AWA
              LAWA LIMITED operates under an Operational Accord with the Ekiti
              State Lotteries and Gaming Commission. SantiBet is for use by
              persons aged 18 and above only.
            </p>
            <p>
              We use cookies and third-party cookies. You can modify the
              settings and obtain further information in our{' '}
              <a
                href='/cookie-policy'
                className='text-neutral-10 underline underline-offset-2 hover:text-black'
              >
                Cookie Policy
              </a>
              . You accept its use by continuing the navigation.
            </p>
            <div className='flex h-fit flex-wrap gap-3'>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target='_blank'
                  rel='noopener noreferrer'
                  aria-label={social.name}
                  className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-10 transition-colors hover:bg-hover hover:text-black'
                >
                  <HugeiconsIcon
                    icon={social.icon}
                    size={18}
                    strokeWidth={1.5}
                  />
                </a>
              ))}
            </div>
          </div>
          <ul className='space-y-4 text-sm max-w-md'>
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className='text-neutral-10 text-left hover:underline hover:underline-offset-2 hover:text-black'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className='space-y-4 text-sm max-w-md min-w-md'>
            {footerLinksTwo.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  className='text-neutral-10 hover:underline hover:underline-offset-2 hover:text-black'
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className='my-10 h-px w-full bg-border' />

        <p className='text-xs text-center text-neutral-10'>
          © SantiBet, 2026. All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer
