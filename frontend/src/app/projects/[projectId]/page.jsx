"use client";
import ImageGallery from "@/components/ImageGallery";
import DragAndDropUpload from "@/components/DragAndDropUpload";
import ImageEditor from "@/components/ImageEditor";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProjectsApi } from '@/apis/beiboot-api/api';
import { useNotification } from "@/stores/useNotification";
import { useImageGalleryStore } from "../../../stores/useImageGalleryStore";
import MultiImageEditor from "@/components/MultiImageEditor";

export default function ProjectGalleryPage() {

  const {addNotification} = useNotification();
  const {selectedImages, setSelectedImages} = useImageGalleryStore()

  const params = useParams();
  let projectId = Array.isArray(params.projectId) ? params.projectId[0] : params.projectId;
  if (!projectId) projectId = "";
  const [images, setImages] = useState([]);
  const [projectName, setProjectName] = useState("");
  const minioBaseUrl = process.env.NEXT_PUBLIC_MINIO_URL || "http://localhost:9000/beiboot";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const { data: session, status } = useSession();
  const api = new ProjectsApi();

  const loadImages = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      if (!session?.accessToken) throw new Error("No access token");
      console.log("Loading images for project", projectId);
      const res = await api.projectsControllerGetProjectImages(projectId, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const imgs = typeof res.json === 'function' ? await res.json() : res;
      setImages(imgs);
      console.log("Loaded images", imgs);
    } catch {
      setError("Failed to load images");
    } finally {
      setLoading(false);
    }
  }, [projectId, session?.accessToken]);


  // Fetch project name
  const loadProjectName = useCallback(async () => {
    try {
      if (!session?.accessToken) throw new Error("No access token");
      // Try to get all projects and find the one with the current id
      const res = await api.projectsControllerGetProjects({
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const projects = typeof res.json === 'function' ? await res.json() : res;
      const project = projects.find((p) => String(p.id) === String(projectId));
      setProjectName(project?.name || "");
    } catch {
      setProjectName("");
    }
  }, [projectId, session?.accessToken]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadImages();
      loadProjectName();
    }
  }, [loadImages, loadProjectName, status]);

  const handleUpload = async (files) => {
    setUploading(true);
    setError("");
    try {
      if (!session?.accessToken) throw new Error("No access token");
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("images", file));
      const res = await api.projectsControllerUploadImages(projectId, {
        headers: { Authorization: `Bearer ${session.accessToken}` },
        body: formData,
      });
      if (res.status && res.status >= 400) throw new Error("Upload failed");
      await loadImages();
    } catch {
      setError("Failed to upload images");
    } finally {
      addNotification("success", "Upload completed");
      setUploading(false);
    }
  };

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") return <div>Please sign in.</div>;

  // Delete image handler
  const handleDeleteImage = async (imageId) => {
    setError("");
    try {
      if (!session?.accessToken) throw new Error("No access token");
  const res = await api.projectsControllerDeleteImage(projectId, String(imageId), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      if (res.status && res.status >= 400) throw new Error("Delete failed");
      if(selectedImage && String(selectedImage.id) === String(imageId)){
        setSelectedImage(null);
      }
      await loadImages();
    } catch {
      setError("Failed to delete image");
    }
  };

  return (
    <div className="p-8">
      <ProjectTitle projectName={projectName} />
      <div className="flex gap-8">
        <div className="w-1/3">
          <DragAndDropUpload onUpload={handleUpload} multiple className="mb-4" />
          {uploading && <div className="text-blue-600">Uploading...</div>}
          {error && <div className="text-red-600 mt-2">{error}</div>}
        </div>
        <div className="w-2/3">
          {loading ? (
            <div>Loading images...</div>
          ) : (
            <div className="flex gap-4">
              <ImageGallery images={images} onDeleteImage={handleDeleteImage}/>
              {selectedImages && selectedImages.length > 1 ? (
                <MultiImageEditor />
              ) : (
                <ImageEditor />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectTitle({ projectName }) {
  return (
    <h1 className="text-2xl font-bold mb-4">
      Project: {projectName ? (
        <span className="text-brand-primary">{projectName}</span>
      ) : (
        <span className="text-gray-400">Loading...</span>
      )}
    </h1>
  );
}
