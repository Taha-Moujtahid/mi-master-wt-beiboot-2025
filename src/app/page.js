"use client";

import { useEffect, useState, useCallback } from "react";
import ImageList from "../components/image-list";
import ImageDropzone from "../components/image-dropzone";
import IPTCEditor from "@/components/iptc-editor";

export default function Home() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchImages = useCallback(() => {
    fetch("/api/images")
      .then((res) => res.json())
      .then((data) => setImages(data.images || []));
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const files = images.map((imgUrl) => {
    const filename = imgUrl.split("/").pop();
    return {
      source: imgUrl,
      title: filename,
      size: "",
      id: filename,
    };
  });

  return (
    <div>
      {files.length > 0 ? (
        <>
          <ImageList files={files} onImageClick={setSelectedImage} />
          <ImageDropzone onUploadSuccess={fetchImages} />
        </>
      ) : (
        <ImageDropzone onUploadSuccess={fetchImages} />
      )}
      {selectedImage && (
        <IPTCEditor
          file={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDeleteSuccess={fetchImages}
          onSaveSuccess={fetchImages}
        />
      )}
    </div>
  );
}
