import ProjectLayoutClient from "./project-layout-client";


export default function Layout({ children }: { children: React.ReactNode }) {
  return <ProjectLayoutClient>{children}</ProjectLayoutClient>;
}
