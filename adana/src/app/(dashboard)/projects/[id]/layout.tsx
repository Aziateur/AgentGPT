import ProjectLayoutClient from "./project-layout-client";

export function generateStaticParams() {
  return [
    { id: "project-website" },
    { id: "project-mobile" },
    { id: "project-marketing" },
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProjectLayoutClient>{children}</ProjectLayoutClient>;
}
