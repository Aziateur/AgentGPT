"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function ProjectRedirectClient({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/projects/${id}/list`);
  }, [id, router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
    </div>
  );
}
