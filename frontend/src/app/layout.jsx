import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from './QueryProvider';
import { Dialog } from '@/components/Dialog';
import { Notification } from "@/components/Notification";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-brand-warm-light`}>
        <QueryProvider>
          <Dialog/>
          <Notification/>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}