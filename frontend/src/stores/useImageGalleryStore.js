"use client";
import {create} from 'zustand';

export const useImageGalleryStore = create((set) => ({
    selectedImage: null,
    currentProjectId: null,
    setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),
    setSelectedImage: (image) => set({ selectedImage: image }),
    clearSelectedImage: () => set({ selectedImage: null }),
}));