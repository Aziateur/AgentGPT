import OverviewViewClient from "./overview-view";

export function generateStaticParams() {
  return [
    { id: "project-website" },
    { id: "project-mobile" },
    { id: "project-marketing" },
  ];
}

export default function Page() {
  return <OverviewViewClient />;
}
