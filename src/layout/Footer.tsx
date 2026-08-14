import {
  DiscordIcon,
  Facebook01Icon,
  InstagramIcon,
  NewTwitterIcon,
  TelegramIcon,
  TiktokIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const socialLinks = [
  { name: 'X', href: 'https://x.com', icon: NewTwitterIcon },
  { name: 'Discord', href: 'https://discord.com', icon: DiscordIcon },
  { name: 'Telegram', href: 'https://telegram.org', icon: TelegramIcon },
  { name: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { name: 'Facebook', href: 'https://facebook.com', icon: Facebook01Icon },
  { name: 'TikTok', href: 'https://tiktok.com', icon: TiktokIcon },
]

const footerLinks = [
  { label: 'About', href: '#' },
  { label: 'Cookie Policy', href: '#' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms & Conditions', href: '/terms-of-service' },
  { label: 'Contact Support', href: '#' },
  { label: 'FAQs', href: '#' },
]
const Footer = () => {
  return (
    <footer className='w-full bg-background text-neutral-10 py-10 border-t border-border'>
      <div className='mx-auto max-w-8xl px-6 py-12 sm:px-8 lg:px-12'>
        <div className='flex flex-col gap-10 lg:flex-row lg:justify-between'>
          <div className='max-w-md space-y-4 text-sm leading-relaxed text-neutral-10'>
            <p>
              We use cookies and third-party cookies. You can modify the
              settings and obtain further information in our{' '}
              <a
                href='#'
                className='text-neutral-50 underline underline-offset-2 hover:text-white'
              >
                Cookie Policy
              </a>
              . You accept its use by continuing the navigation.
            </p>
            <p>
              SantiBet is operated by SantiBet Limited (Office 226, 1st Floor,
              World Trade Center, 6 Bayside Road, Gibraltar) which is licensed
              by the Government of Gibraltar with{' '}
            </p>
          </div>
          <ul className='space-y-4 text-sm'>
            {footerLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className='text-neutral-10 hover:underline hover:underline-offset-2 hover:text-black'
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <div className='flex h-fit flex-wrap gap-3 sm:justify-end'>
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                aria-label={social.name}
                className='flex h-9 w-9 items-center justify-center rounded-full bg-white text-neutral-10 transition-colors hover:bg-hover hover:text-black'
              >
                <HugeiconsIcon icon={social.icon} size={18} strokeWidth={1.5} />
              </a>
            ))}
          </div>
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
