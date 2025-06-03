"use client"
import { PhotoIcon } from "@heroicons/react/24/solid"
import { useState } from "react"
import { uploadImage } from "../app/upload/functions";

export default function ImageDropzone({ onUploadSuccess }) {

  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    validateAndSetFile(selected);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    validateAndSetFile(droppedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (file) => {
    if (file) {
      const isValid = ['image/jpeg'].includes(file.type);
      if (!isValid) {
        setError('Nur JPEG erlaubt!');
        setFile(null);
      } else {
        setError(null);
        setFile(file);
        handleUpload(file);
      }
    }
  };

  const handleUpload = async (uploadFile) => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);

    const res = await uploadImage(formData);

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);

    if (onUploadSuccess) {
      onUploadSuccess();
    }
  };

  return (
    <div>
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          Upload erfolgreich!
        </div>
      )}
      <form action={uploadImage}>
        <div className="flex items-center justify-center h-screen"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
            <div className="text-center">
              <PhotoIcon aria-hidden="true" className="mx-auto size-12 text-gray-500" />
              <div className="mt-4 flex text-sm/6 text-gray-400">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-white focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:outline-hidden hover:text-indigo-500"
                >
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs/5 text-gray-400">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
