"use client";

import { useEffect, useState, useCallback } from "react";
import ImageList from "../components/image-list";
import ImageDropzone from "../components/image-dropzone";
import IPTCEditor from "../components/iptc-editor";
import UploadWithProgress from "../components/upload-with-progress";

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

  const files = images.map((img) => {
    console.log(img)
    return {
      source: img.url,
      title: img.key,
      size: "",
      id: img.url,
    };
  });

  return (
    <div>
      {files.length > 0 && ( //<ImageDropzone onUploadSuccess={fetchImages} />
        <>
          <ImageList files={files} onImageClick={setSelectedImage} />
        </>
      )}
       <UploadWithProgress />
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
