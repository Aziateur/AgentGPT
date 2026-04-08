import ProjectRedirectClient from "./project-redirect-client";

export function generateStaticParams() {
  return [
    { id: "project-website" },
    { id: "project-mobile" },
    { id: "project-marketing" },
  ];
}

export default function Page() {
  return <ProjectRedirectClient />;
}
