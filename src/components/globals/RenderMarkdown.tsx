import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface RenderMarkdownProps {
  children: string
  usePreWrapper?: boolean
}

const components: Components = {
  h1: ({ children }) => (
    <h2 className='text-lg font-bold text-black mt-8 first:mt-0 mb-3'>
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className='text-lg font-bold text-black mt-8 first:mt-0 mb-3'>
      {children}
    </h2>
  ),
  p: ({ children }) => (
    <p className='text-neutral-10 leading-relaxed mb-4'>{children}</p>
  ),
  ul: ({ children }) => (
    <ul className='list-disc pl-5 text-neutral-10 mb-4 space-y-1'>
      {children}
    </ul>
  ),
  a: ({ href, children }) => (
    <a href={href} className='text-black underline underline-offset-2'>
      {children}
    </a>
  ),
}
const RenderMarkdown = ({
  children,
  usePreWrapper = true,
}: RenderMarkdownProps) => {
  const markdown = (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  )

  if (usePreWrapper) {
    return <div className='whitespace-pre-wrap'>{markdown}</div>
  }

  return markdown
}

export default RenderMarkdown
