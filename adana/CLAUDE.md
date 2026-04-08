# AI Collaboration Constitution (Adana Project)

## 1. Purpose & Collaboration Philosophy
This document establishes the ground rules for collaboration between the user, Claude Code, and Antigravity. Our goal is to compliment each other, build upon existing work, and never destructively overwrite each other's logic. 
* **Stop and Plan:** Before executing major changes, agents MUST query the user to understand the goal, verify the codebase locally, and propose a coherent, bulleted plan for approval.
* **Never Assume Context:** Use codebase search (`grep`, `view`) to understand the current file state. Another agent or the user might have recently pushed optimizations.
* **Ask Questions:** If an agent is ever unsure about context, tools, or previous implementations, they MUST stop and ask the user for clarification rather than hallucinating solutions.

## 2. Agent Roles & Responsibilities
To prevent overlap and ensure maximum efficiency, responsibilities are split as follows:
* **Antigravity (Agent):** Responsible for ALL database interactions, Schema updates, Supabase configuration, data fetching, and maintaining mock/dummy data files. If data layers need to change, Antigravity handles it.
* **Claude Code:** Responsible for heavy lifting, raw code execution, UI implementation, and executing very complex programmatic redesigns. If a major logic, component, or system rework is required, Claude Code handles it.
* **Tool Specialization:** Agents should prioritize the tools they are best equipped for. Always verify you have access to the needed configurations before acting.

## 3. Data Source & Supabase Context
* **Supabase Environment:** The connected Supabase instance is **Wings Of God (wog)**. It is **NOT** the same account used for previous projects. 
* **Exact Parameters:**
  * **Project ID (Reference ID):** `qrksglxemydjzvpnyzzs`
  * **Supabase URL:** `https://qrksglxemydjzvpnyzzs.supabase.co`
  * **Configured:** The CLI is correctly linked to this reference ID in the `.supabase` configuration and the auth token is managed actively by Antigravity.
* **Verification Required:** When using Supabase tools or querying databases, verify against the `wog` tables. Do not assume previous tables exist.
* **Current App Data Strategy (Adana):** The project is configured as a static demo relying on `src/lib/mock-data.ts`. Next.js static builds succeed strictly because server actions and dynamic DB calls were mocked out. If tasked with reconnecting the backend natively, proceed carefully knowing we are operating against the uniquely provisioned `wog` Supabase environment.

## 4. Core Architectural Rules (UI & Build)
* **Static Export Constraint:** Adana is generating statically for Cloudflare Pages. Do NOT re-introduce Server Actions (`"use server"`) or runtime Node API routes without explicit permission, as this will break `next build`.
* **Client Components:** Pages utilizing dynamic routing with `generateStaticParams` must be standard Server Components. They should fetch parameters and pass them natively down to separated Client Components.

## 5. Agent Handoff Protocol
* **Surgical Edits:** Avoid replacing entire files when possible. Use targeted modifications instead, as another agent may have recently applied minute bug fixes.
* **Handoff Documentation:** If ending a session with an incomplete task or known bug, leave a summarizing comment or update an `.agent-handoff.md` file so the next AI agent can seamlessly continue.
* **Quality Assurance:** An agent's job is not complete until `npx next build` succeeds without runtime error or static prerendering failures.
