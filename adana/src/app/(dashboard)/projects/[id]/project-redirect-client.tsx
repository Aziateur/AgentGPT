"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";

export default function ProjectRedirectClient() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { projects } = useAppStore();

  useEffect(() => {
    if (!id) return;
    const project = projects.find((p) => p.id === id);
    const defaultView = project?.defaultView || "list";
    router.replace(`/projects/${id}/${defaultView}`);
  }, [id, projects, router]);

  return null;
}
