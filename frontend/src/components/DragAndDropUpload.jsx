"use client";
import React, { useRef, useState } from "react";
import 'material-symbols';


export default function DragAndDropUpload({
  onUpload,
  accept = "image/*",
  multiple = false,
  className = "",
}) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  function handleFiles(files) {
    if (files && files.length > 0) {
      onUpload(files);
    }
  }

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e) {
    handleFiles(e.target.files);
  }

  return (
    <div
      className={`border  p-8 cursor-pointer hover:bg-brand-primary hover:text-white transition-colors rounded flex flex-col items-center justify-center text-center ${dragActive ? 'bg-brand-primary text-white' : 'bg-white text-darkest'} ${className}`}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      style={{ minHeight: 400 }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <span
        className={`material-symbols-outlined mb-4 ${dragActive ? 'text-white' : 'text-darkest'}`}
        style={{
          fontVariationSettings: '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 40',
          fontSize: 40,
          display: 'block',
        }}
      >
        upload
      </span>
      <div className={`mb-2 ${dragActive ? 'text-white' : 'text-darkest'}`}>
        Dateien via Drag & Drop hochladen
      </div>
      <div className={`mb-4 ${dragActive ? 'text-white' : 'text-darkest'}`}>oder</div>
      <button
        type="button"
        className="px-5 py-2 rounded text-white font-medium transition-colors bg-brand-primary"
        onClick={e => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        Dateien auswählen
      </button>
    </div>
  );
}
