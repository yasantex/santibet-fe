import { useEffect, useState } from 'react'
import RenderMarkdown from '../components/globals/RenderMarkdown'
import { TextLoader } from '../components/globals/ReusedText'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft02Icon } from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'

const Faqs = () => {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/contents/faq.md')
      .then((res) => res.text())
      .then((d) => {
        setContent(d)
        setLoading(false)
      })
      .catch((err) => console.error('Failed to load markdown:', err))
  }, [])
  return (
    <main className='max-w-2xl mx-auto px-5 py-8'>
      <div className='flex items-center gap-3 my-5 cursor-pointer' onClick={() => navigate(-1)}>
        <HugeiconsIcon icon={ArrowLeft02Icon} className='text-black' />
        <h1 className='text-2xl font-bold text-black'>Frequently Asked Questions</h1>
      </div>
      {loading ? (
        <TextLoader count={16} />
      ) : (
        <RenderMarkdown usePreWrapper={false}>{content}</RenderMarkdown>
      )}
    </main>
  )
}

export default Faqs
