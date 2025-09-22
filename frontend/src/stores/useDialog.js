import {create} from 'zustand';

export const useDialog = create((set) => ({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    onCancel: null,
    openDialog: (title, message, onConfirm, onCancel) => set(() => ({
        isOpen: true,
        title,
        message,
        onConfirm,
        onCancel
    })),
    closeDialog: () => set(() => ({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        onCancel: null
    }))
}));

