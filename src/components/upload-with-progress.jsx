// components/UploadWithProgress.tsx
'use client'

import { useState } from 'react'
import axios from 'axios'

export default function UploadWithProgress() {
  const [progress, setProgress] = useState(0)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log('Selected file:', file)


    const res = await fetch(`/api/upload-url?filename=${encodeURIComponent(file.name)}&filetype=${"image/jpeg"}`)
    const { url } = await res.json()

    await axios.put(url, file, {
      headers: {
        'Content-Type':  'application/octet-stream',
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1))
        setProgress(percent)
      },
    })

    alert('Upload erfolgreich!')
    setProgress(0)
  }

  return (
    <div className="space-y-2">
      <input type="file" onChange={handleFileChange} />
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div
          className="bg-blue-500 h-4 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        >
            {progress}
            </div>
      </div>
    </div>
  )
}
