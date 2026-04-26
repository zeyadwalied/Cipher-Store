"use client"

import { useState, useRef } from "react"
import { Upload, X, Loader2, ImageIcon } from "lucide-react"

interface Props {
  currentUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPickerModal({ currentUrl, onSelect, onClose }: Props) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploadProgress, setUploadProgress] = useState(0)

  const handleUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const file = files[0] // only support single upload for simplicity
      const fd = new FormData()
      fd.append("file", file)

      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/api/admin/media")

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            onSelect(data.url)
            onClose()
          } catch (err) {
            setUploadError("Invalid Server Response")
            setIsUploading(false)
          }
        } else {
          setUploadError(xhr.responseText || "Upload failed")
          setIsUploading(false)
        }
      }

      xhr.onerror = () => {
        setUploadError("Network error during upload")
        setIsUploading(false)
      }

      xhr.send(fd)
    } catch (err: any) {
      setUploadError(err.message || "An error occurred during upload")
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0a0a0f] border border-[#a855f7]/30 rounded-2xl w-full max-w-lg flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Upload className="h-5 w-5 text-[#a855f7]" />
            <h2 className="text-lg font-bold text-white font-cyber">Upload Image</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Upload Zone */}
        <div className="p-6">
          <div
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-[#a855f7] bg-[#a855f7]/10"
                : "border-[#27272a] hover:border-[#a855f7]/50 hover:bg-[#a855f7]/5"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleUpload(e.target.files)}
            />
            {isUploading ? (
              <div className="flex flex-col items-center justify-center gap-4 text-[#a855f7] w-full max-w-[80%] mx-auto">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2 px-1">
                    <span className="text-xs font-mono font-bold text-gray-300">
                      {uploadProgress < 100 ? "Uploading to Server..." : "Saving to External Host..."}
                    </span>
                    <span className="text-xs font-mono font-bold text-[#00f5ff]">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#141417] rounded-full overflow-hidden border border-[#27272a]">
                    <div 
                      className="h-full bg-gradient-to-r from-[#a855f7] to-[#00f5ff] transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
                {uploadProgress === 100 && (
                  <p className="text-[10px] text-gray-400 font-mono mt-1 animate-pulse">This may take a moment while we process the image.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className={`h-12 w-12 ${isDragging ? "text-[#a855f7]" : "text-gray-600"}`} />
                <p className="text-sm text-gray-400 mt-2">
                  <span className="text-[#a855f7] font-bold">Click to upload</span> or drag & drop
                </p>
                <p className="text-xs text-gray-600 font-mono">PNG, JPG, WEBP, GIF — max 20MB</p>
              </div>
            )}
          </div>
          {uploadError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm font-mono text-center">{uploadError}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272a] flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
