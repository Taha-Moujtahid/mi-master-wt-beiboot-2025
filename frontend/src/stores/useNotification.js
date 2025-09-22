import {create} from 'zustand';

export const useNotification = create((set) => ({
    notifications: [],
    addNotification: (type, message) => set((state) => ({
        notifications: [...state.notifications, { id: Date.now(), type, message }]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(notification => notification.id !== id)
    }))
}));