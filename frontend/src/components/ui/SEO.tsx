import { useEffect } from 'react'

interface SEOProps {
  title?: string
  description?: string
}

export const SEO = ({ title, description }: SEOProps) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | EduFlow`
    } else {
      document.title = 'EduFlow - Smart Digital Classroom'
    }

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', description)
      }
    }
  }, [title, description])

  return null
}
