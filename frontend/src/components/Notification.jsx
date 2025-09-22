"use client"

import { useNotification } from "@/stores/useNotification";
import { useEffect } from "react";

export const Notification = ()=>{

    const {notifications, removeNotification} = useNotification();

    // Automatically remove notifications after 250ms with fade-out
    useEffect(() => {
        notifications.forEach((notification) => {
            if (!notification._timeoutSet) {
                setTimeout(() => {
                    removeNotification(notification.id);
                }, 2500);
                notification._timeoutSet = true;
            }
        });
        // eslint-disable-next-line
    }, [notifications]);

    return (
        <div className={"flex flex-col fixed top-5 right-5 space-y-2 z-50 position-absolute"}>
            {notifications.map((notification) => (
                <div
                    key={notification.id}
                    className={`notification ${notification.type} h-full bg-white border p-4 shadow-md flex gap-2 items-center justify-between before:content-[''] before:absolute before:w-[4px] before:h-full before:inset-0 before:bg-brand-primary transition-opacity duration-250 opacity-100`}
                    style={{ animation: "fadeOut 2500ms forwards" }}
                >
                    <span>{notification.message}</span>
                </div>
            ))}
            <style>{`
                @keyframes fadeOut {
                    from { opacity: 1; }
                    to { opacity: 0; }
                }
            `}</style>
        </div>
    )
}