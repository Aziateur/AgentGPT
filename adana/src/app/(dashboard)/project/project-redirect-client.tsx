"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";

export default function ProjectRedirectClient() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id") as string;
  const router = useRouter();
  const { projects } = useAppStore();

  useEffect(() => {
    if (!id) return;
    const project = projects.find((p) => p.id === id);
    const defaultView = project?.defaultView || "list";
    router.replace(`/project/${defaultView}?id=${id}`);
  }, [id, projects, router]);

  return null;
}
