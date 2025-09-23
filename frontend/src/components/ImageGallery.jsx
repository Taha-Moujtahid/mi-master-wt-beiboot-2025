"use client";

import React,  { useState } from "react";
import ImageCard from "./ImageCard";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';

export default function ImageGallery({ images, className = "", onDeleteImage }) {
  
  const { selectedImages, setSelectedImages } = useImageGalleryStore();
  
  if (!images.length) return <div className="text-gray-500">No images found.</div>;
  // Multiselect logic
  const isSelected = (img) => selectedImages.some((i) => i.id === img.id);
  const handleCheckboxChange = (img, checked) => {
    if (checked) {
      setSelectedImages([...selectedImages, img]);
    } else {
      setSelectedImages(selectedImages.filter((i) => i.id !== img.id));
    }
  };

  return (
    <div className={`w-[50%] flex flex-col gap-2 ${className}`}>
      {images.map((img) => (
        <div key={img.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected(img)}
            onChange={e => handleCheckboxChange(img, e.target.checked)}
            className="accent-brand-primary"
          />
          <div className="flex-1">
            <ImageCard
              img={img}
              onClick={()=>{console.log(img.id); setSelectedImages([img])}}
              onDelete={onDeleteImage ? () => onDeleteImage(img.id) : undefined}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
