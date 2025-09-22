"use client";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

export default function Username() {
  return <SessionProvider>
    <UsernameContent />
    </SessionProvider>;
}

function UsernameContent() {
  const { data: session } = useSession();
  if (!session?.user?.name) return null;
  return <div className="mb-4">Welcome, <b>{session.user.name}</b>!</div>;
}
