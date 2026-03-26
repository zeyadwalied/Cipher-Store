"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Upload, X, Check, Trash2, ImageIcon, Loader2 } from "lucide-react"

type MediaImage = { name: string; url: string }

interface Props {
  currentUrl: string
  onSelect: (url: string) => void
  onClose: () => void
}

export default function MediaPickerModal({ currentUrl, onSelect, onClose }: Props) {
  const [images, setImages] = useState<MediaImage[]>([])
  const [selected, setSelected] = useState<string>(currentUrl)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [deletingName, setDeletingName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchImages = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/media")
      if (res.ok) {
        const data = await res.json()
        setImages(data.images)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchImages() }, [fetchImages])

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploadError(null)
    setIsUploading(true)

    let lastUrl = selected
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/admin/media", { method: "POST", body: fd })
      if (res.ok) {
        const data = await res.json()
        lastUrl = data.url
      } else {
        const txt = await res.text()
        setUploadError(txt)
      }
    }

    await fetchImages()
    setSelected(lastUrl)
    setIsUploading(false)
  }

  const handleDelete = async (img: MediaImage, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${img.name}"?`)) return
    setDeletingName(img.name)
    await fetch(`/api/admin/media?name=${encodeURIComponent(img.name)}`, { method: "DELETE" })
    if (selected === img.url) setSelected("")
    await fetchImages()
    setDeletingName(null)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0a0a0f] border border-[#a855f7]/30 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272a] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ImageIcon className="h-5 w-5 text-[#a855f7]" />
            <h2 className="text-lg font-bold text-white font-cyber">Media Library</h2>
            <span className="text-xs text-gray-500 font-mono">{images.length} images</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        {/* Upload Zone */}
        <div
          className={`mx-6 mt-4 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all shrink-0 ${
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
            multiple
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
          {isUploading ? (
            <div className="flex items-center justify-center gap-2 text-[#a855f7]">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm font-mono">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className={`h-8 w-8 ${isDragging ? "text-[#a855f7]" : "text-gray-600"}`} />
              <p className="text-sm text-gray-400">
                <span className="text-[#a855f7] font-bold">Click to upload</span> or drag & drop
              </p>
              <p className="text-xs text-gray-600 font-mono">PNG, JPG, WEBP, GIF — max 20MB</p>
            </div>
          )}
          {uploadError && <p className="text-red-400 text-xs mt-2 font-mono">{uploadError}</p>}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading...
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500 font-mono text-sm">
              <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
              No images uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map(img => {
                const isSelected = selected === img.url
                return (
                  <div
                    key={img.name}
                    onClick={() => setSelected(isSelected ? "" : img.url)}
                    className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all group ${
                      isSelected
                        ? "border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        : "border-transparent hover:border-[#a855f7]/40"
                    }`}
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    
                    {/* Selected tick */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 bg-[#a855f7] rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={e => handleDelete(img, e)}
                      disabled={deletingName === img.name}
                      className="absolute bottom-1 right-1 h-6 w-6 bg-red-600/80 hover:bg-red-600 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete image"
                    >
                      {deletingName === img.name
                        ? <Loader2 className="h-3 w-3 text-white animate-spin" />
                        : <Trash2 className="h-3 w-3 text-white" />
                      }
                    </button>

                    {/* Name tooltip */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-gray-300 px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {img.name}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272a] flex items-center justify-between shrink-0">
          <div className="text-sm text-gray-400 font-mono truncate max-w-xs">
            {selected ? (
              <span className="text-[#00f5ff]">✓ {selected.split("/").pop()}</span>
            ) : (
              <span className="text-gray-600">No image selected</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSelect(selected); onClose() }}
              className="px-5 py-2 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-lg text-sm font-bold transition-colors"
            >
              Select Image
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
