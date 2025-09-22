"use client";
import { SessionProvider } from "next-auth/react";

export default function ProjectsLayout({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
