"use client";

import React from "react";
import 'material-symbols';
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';


const ImageWithDelete = ({ img, onClick, onDelete, className = "" }) => {
  
  const { selectedImage } = useImageGalleryStore();
  const isActive = selectedImage?.id === img.id;
  
  // Helper to format ISO date string to DD.MM.YYYY
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
   <div
  className={`w-full h-[64px] relative group flex border-2 bg-white ${
    isActive && "border-brand-primary"
  } ${className}`}
  onClick={onClick}
>
  <img
    src={img.url}
    alt={img.alt || "Image"}
    className="w-[64px] h-auto inline-block bg-dark object-contain"
  />
  <div className="flex-1 flex items-center justify-between min-w-0">
    {/* <-- min-w-0 ist wichtig, damit truncate in Flexbox funktioniert */}
    <div className="flex-1 p-2 flex flex-col h-[64px] min-w-0">
      <p
        className="truncate text-sm font-medium"
        title={img.filename}
      >
        {img.filename}
      </p>
      {img.createdAt && (
        <span className="text-gray-500 text-xs">
          {formatDate(img.createdAt)}
        </span>
      )}
    </div>

    <div className="flex gap-2 shrink-0">
      <button
        type="button"
        onClick={() => alert("Edit image")}
        className="group-hover:opacity-100 opacity-0 transition-opacity cursor-pointer"
        aria-label="Edit image"
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontVariationSettings:
              '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 25',
            fontSize: 25,
            color: "#000",
            display: "block",
          }}
        >
          edit
        </span>
      </button>
      <a
        href={img.url}
        download={img.filename || "image"}
        className="group-hover:opacity-100 opacity-0 transition-opacity cursor-pointer"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span
          className="material-symbols-outlined"
          style={{
            fontVariationSettings:
              '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 25',
            fontSize: 25,
            color: "#000",
            display: "block",
          }}
        >
          download
        </span>
      </a>
      {onDelete && (
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete image"
          className="group-hover:opacity-100 opacity-0 transition-opacity cursor-pointer"
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontVariationSettings:
                '"FILL" 0, "wght" 200, "GRAD" 0, "opsz" 25',
              fontSize: 25,
              color: "#000",
              display: "block",
            }}
          >
            delete
          </span>
        </button>
      )}
    </div>
  </div>
</div>

  );
};

export default ImageWithDelete;
