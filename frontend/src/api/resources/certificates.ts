import { apiClient } from '../client'
import toast from 'react-hot-toast'

export const downloadCertificate = async (certificateId: string | number, filename?: string) => {
  try {
    const toastId = toast.loading('Generating certificate...')
    
    const response = await apiClient.get(`/certificates/${certificateId}/download`, {
      responseType: 'blob',
    })
    
    // Extract filename from Content-Disposition header if possible
    let downloadFilename = filename || `certificate-${certificateId}.pdf`
    const disposition = response.headers['content-disposition']
    if (disposition && disposition.indexOf('attachment') !== -1) {
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      const matches = filenameRegex.exec(disposition)
      if (matches != null && matches[1]) {
        downloadFilename = matches[1].replace(/['"]/g, '')
      }
    }

    const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', downloadFilename)
    document.body.appendChild(link)
    link.click()
    
    // Cleanup
    link.parentNode?.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Certificate downloaded successfully!', { id: toastId })
    return true
  } catch (error) {
    console.error('Certificate download failed:', error)
    toast.error('Failed to download certificate. Please try again.', { id: 'cert_err' })
    return false
  }
}
