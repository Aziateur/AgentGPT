import CalendarViewClient from "./calendar-view";

export function generateStaticParams() {
  return [
    { id: "project-website" },
    { id: "project-mobile" },
    { id: "project-marketing" },
  ];
}

export default function Page() {
  return <CalendarViewClient />;
}
