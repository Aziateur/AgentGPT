export interface ProjectTemplateTask {
  sectionIdx: number;
  title: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  sections: string[];
  tasks: ProjectTemplateTask[];
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "marketing-launch",
    name: "Marketing Launch",
    description: "Plan and execute a product marketing launch.",
    icon: "rocket",
    color: "#ec4899",
    sections: ["Planning", "Content", "Launch"],
    tasks: [
      { sectionIdx: 0, title: "Define target audience" },
      { sectionIdx: 0, title: "Set success metrics" },
      { sectionIdx: 0, title: "Align with product team" },
      { sectionIdx: 0, title: "Draft launch timeline" },
      { sectionIdx: 1, title: "Write blog announcement" },
      { sectionIdx: 1, title: "Design social assets" },
      { sectionIdx: 1, title: "Record launch video" },
      { sectionIdx: 1, title: "Prepare press release" },
      { sectionIdx: 2, title: "Publish landing page" },
      { sectionIdx: 2, title: "Send launch email" },
      { sectionIdx: 2, title: "Monitor launch metrics" },
    ],
  },
  {
    id: "engineering-sprint",
    name: "Engineering Sprint",
    description: "Two-week engineering sprint with clear stages.",
    icon: "code",
    color: "#6366f1",
    sections: ["Backlog", "In Progress", "Review", "Done"],
    tasks: [
      { sectionIdx: 0, title: "Groom backlog" },
      { sectionIdx: 0, title: "Plan sprint goal" },
      { sectionIdx: 0, title: "Estimate stories" },
      { sectionIdx: 0, title: "Assign owners" },
      { sectionIdx: 1, title: "Implement feature A" },
      { sectionIdx: 1, title: "Fix critical bug #123" },
      { sectionIdx: 1, title: "Write unit tests" },
      { sectionIdx: 2, title: "Code review pending PRs" },
      { sectionIdx: 2, title: "QA regression" },
      { sectionIdx: 3, title: "Deploy to staging" },
      { sectionIdx: 3, title: "Sprint retrospective" },
    ],
  },
  {
    id: "hiring-pipeline",
    name: "Hiring Pipeline",
    description: "Track candidates through each hiring stage.",
    icon: "users",
    color: "#10b981",
    sections: ["Sourced", "Phone Screen", "Onsite", "Offer"],
    tasks: [
      { sectionIdx: 0, title: "Post job description" },
      { sectionIdx: 0, title: "Source from LinkedIn" },
      { sectionIdx: 0, title: "Review referrals" },
      { sectionIdx: 1, title: "Schedule phone screen - Candidate A" },
      { sectionIdx: 1, title: "Phone screen - Candidate B" },
      { sectionIdx: 2, title: "Onsite - Candidate A" },
      { sectionIdx: 2, title: "Debrief meeting" },
      { sectionIdx: 2, title: "Reference check" },
      { sectionIdx: 3, title: "Draft offer letter" },
      { sectionIdx: 3, title: "Negotiate compensation" },
      { sectionIdx: 3, title: "Send offer" },
    ],
  },
  {
    id: "product-roadmap",
    name: "Product Roadmap",
    description: "Quarterly roadmap with themes and milestones.",
    icon: "map",
    color: "#0ea5e9",
    sections: ["Now", "Next", "Later"],
    tasks: [
      { sectionIdx: 0, title: "Ship onboarding revamp" },
      { sectionIdx: 0, title: "Launch billing v2" },
      { sectionIdx: 0, title: "Fix top 10 bugs" },
      { sectionIdx: 0, title: "Collect NPS feedback" },
      { sectionIdx: 1, title: "Mobile app beta" },
      { sectionIdx: 1, title: "Reporting dashboard v2" },
      { sectionIdx: 1, title: "Integrations marketplace" },
      { sectionIdx: 2, title: "AI assistant" },
      { sectionIdx: 2, title: "Enterprise SSO" },
      { sectionIdx: 2, title: "API webhooks" },
    ],
  },
  {
    id: "event-planning",
    name: "Event Planning",
    description: "Organize an event from kickoff to wrap-up.",
    icon: "calendar",
    color: "#f59e0b",
    sections: ["Logistics", "Promotion", "Day Of"],
    tasks: [
      { sectionIdx: 0, title: "Book venue" },
      { sectionIdx: 0, title: "Finalize date" },
      { sectionIdx: 0, title: "Arrange catering" },
      { sectionIdx: 0, title: "Confirm speakers" },
      { sectionIdx: 1, title: "Design event page" },
      { sectionIdx: 1, title: "Send invitations" },
      { sectionIdx: 1, title: "Social media campaign" },
      { sectionIdx: 2, title: "Set up registration" },
      { sectionIdx: 2, title: "A/V check" },
      { sectionIdx: 2, title: "Collect feedback survey" },
    ],
  },
  {
    id: "bug-intake",
    name: "Bug Intake",
    description: "Triage and resolve incoming bug reports.",
    icon: "bug",
    color: "#ef4444",
    sections: ["New", "Triaged", "Fixing", "Verified"],
    tasks: [
      { sectionIdx: 0, title: "Crash on login (iOS)" },
      { sectionIdx: 0, title: "Slow dashboard load" },
      { sectionIdx: 0, title: "Typo on pricing page" },
      { sectionIdx: 1, title: "Verify duplicate task bug" },
      { sectionIdx: 1, title: "Reproduce file upload error" },
      { sectionIdx: 2, title: "Fix 500 on /api/projects" },
      { sectionIdx: 2, title: "Patch XSS in comments" },
      { sectionIdx: 2, title: "Resolve memory leak" },
      { sectionIdx: 3, title: "Regression test suite" },
      { sectionIdx: 3, title: "Close resolved tickets" },
    ],
  },
];
