"use client";

import { useTheme } from "next-themes";

export function BackgroundImage() {
    const { theme } = useTheme();
    
    return (
        <div className="fixed inset-0 z-[-1]">
            <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundAttachment: "fixed",
                }}
            />
            <div className="fixed inset-0 z-0 pointer-events-none bg-slate-50/80 dark:bg-slate-900/90" />
        </div>
    );
}
