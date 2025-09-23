"use client";
import {create} from 'zustand';

export const useImageGalleryStore = create((set) => ({
    selectedImages: [],
    currentProjectId: null,
    setCurrentProjectId: (projectId) => set({ currentProjectId: projectId }),
    setSelectedImages: (images) => set({ selectedImages: images }),
    addSelectedImage: (image) => set((state) => ({
        selectedImages: [...state.selectedImages, image]
    })),
    removeSelectedImage: (image) => set((state) => ({
        selectedImages: state.selectedImages.filter(img => img !== image)
    })),
    clearSelectedImages: () => set({ selectedImages: [] }),
}));