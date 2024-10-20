"use client"

import React, { useRef, useState } from "react"
import { cn, checkFileExtension, fileToBase64 } from "@/lib/utils"

import { toast } from "sonner"

// Define the props expected by the Dropzone component
interface DropzoneProps {
  onChange: (files: string[] | string) => void
  children?: React.ReactNode
  className?: string
  droppable?: boolean
  clickable?: boolean
  extensions?: string[]
  maxSize?: number
  multiple?: boolean
}

// Create the Dropzone component receiving props
export function Dropzone({
  onChange,
  children,
  className,
  droppable = true,
  clickable = true,
  extensions,
  maxSize,
  multiple = false,
  ...props
}: DropzoneProps) {
  // Initialize state variables using the useState hook
  const fileInputRef = useRef<HTMLInputElement | null>(null) // Reference to file input element
  const [isDragOver, setIsDragOver] = useState<boolean>(false) // Drag over state

  // Function to handle drag over event
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Function to handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (!droppable) return

    setIsDragOver(false)
    const { files } = e.dataTransfer
    handleFiles(files)
  }

  // Function to handle file input change event
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target
    if (files) {
      handleFiles(files)
    }
  }

  // Function to handle processing of uploaded files
  const handleFiles = async (files: FileList) => {
    if (!files.length) {
      toast.error("No file uploaded")
      return
    }

    // Check files extensions
    if (!!extensions) {
      let valid = true
      for (const file of files) {
        valid = checkFileExtension(file, extensions)
        break
      }
      if (!valid) {
        toast.error(`Invalid file type. Expected: ${extensions.join(", ")}`)
        return
      }
    }

    // Check file size
    if (!!maxSize) {
      let valid = true
      for (const file of files) {
        if (file.size > maxSize) {
          valid = false
          break
        }
      }
      if (!valid) {
        toast.error(`File size exceeds the limit of ${maxSize / 1024} KB`)
        return
      }
    }

    // const returnValue = !multiple
    //   ? URL.createObjectURL(files[0]!)
    //   : Array.from(files).map((file) => URL.createObjectURL(file))
    // returnValue as base64
    const returnValue = !multiple ? await fileToBase64(files[0]) : await Promise.all(Array.from(files).map(fileToBase64))
    
    onChange(returnValue!)
  }

  // Function to simulate a click on the file input element
  const handleClick = () => {
    if (!clickable) return
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div
      className={cn(
        "flex cursor-pointer rounded-md border border-dashed",
        className,
        isDragOver ? "border-primary" : "border-dark/20 hover:border-dark/30",
      )}
      {...props}
    >
      <div
        className="flex h-full w-full flex-col items-center justify-center space-y-2 p-4 text-sm"
        onDragOver={handleDragOver}
        onDragEnter={() => {
          if (droppable) {
            setIsDragOver(true)
          }
        }}
        onDragLeave={() => {
          if (droppable) {
            setIsDragOver(false)
          }
        }}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div
          className={cn(
            "pointer-events-none flex items-center justify-center",
            isDragOver ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {!children ? (
            <span className="text-center text-xs font-medium">
              Click or Drag {multiple ? "Files" : "File"} to Upload
            </span>
          ) : (
            children
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={extensions?.map((ext) => `.${ext}`).join(", ")} // Set accepted file type
            onChange={handleFileInputChange}
            className="hidden"
            multiple={multiple}
          />
        </div>
      </div>
    </div>
  )
}
