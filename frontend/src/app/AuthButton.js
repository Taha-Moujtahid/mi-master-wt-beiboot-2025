"use client";
import { signIn, signOut, useSession } from "next-auth/react";

export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  if (!session) {
    return (
      <button onClick={() => signIn("keycloak")}>Sign in with Keycloak</button>
    );
  }

  return (
    <div>
      <span>Signed in as {session.user?.email || session.user?.name}</span>
      <button onClick={() => signOut()}>Sign out</button>
    </div>
  );
}
