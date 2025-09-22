"use client";

import React,  { useState } from "react";
import ImageCard from "./ImageCard";
import { useImageGalleryStore } from '@/stores/useImageGalleryStore';

export default function ImageGallery({ images, className = "", onDeleteImage }) {
  
  const { selectedImage, setSelectedImage } = useImageGalleryStore();
  
  if (!images.length) return <div className="text-gray-500">No images found.</div>;
  return (
    <div className={`w-[50%] flex flex-col gap-2 ${className}`}>
      {images.map((img) => (
        <ImageCard
          img={img}
          onClick={()=>{console.log(img.id); setSelectedImage(img)}}
          onDelete={onDeleteImage ? () => onDeleteImage(img.id) : undefined}
        />
      ))}
    </div>
  );
}
