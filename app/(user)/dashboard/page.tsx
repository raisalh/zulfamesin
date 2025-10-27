"use client";

import { useSession, signOut } from "next-auth/react";
import { Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    router.push("/");

    return null;
  }

  return <></>;
}
