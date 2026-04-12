import { supabase } from "@/lib/supabase";
import type {
  GoalExt,
  PortfolioExt,
  TeamExt,
  TeamMemberExt,
  ProjectMemberExt,
  ProjectStatusUpdateExt,
  GoalContribution,
} from "@/types";

type SetFn = (partial: any) => void;
type GetFn = () => any;

// ---------- Goals Slice ----------

export function createGoalsSlice(set: SetFn, get: GetFn) {
  return {
    createGoal: async (
      data: Partial<GoalExt> & { name: string }
    ): Promise<GoalExt> => {
      const now = new Date().toISOString();
      const goal: GoalExt = {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        description: data.description ?? null,
        ownerId: data.ownerId ?? null,
        parentId: data.parentId ?? null,
        timePeriod: data.timePeriod ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        metricType: data.metricType ?? "percentage",
        metricTarget: data.metricTarget ?? null,
        metricCurrent: data.metricCurrent ?? 0,
        status: data.status ?? "on_track",
        weight: data.weight ?? 1,
        progress: data.progress ?? 0,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      set({ goalsExt: [...(get().goalsExt as GoalExt[]), goal] });
      try {
        await supabase.from("goals").insert({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          owner_id: goal.ownerId,
          parent_id: goal.parentId,
          time_period: goal.timePeriod,
          start_date: goal.startDate,
          end_date: goal.endDate,
          metric_type: goal.metricType,
          metric_target: goal.metricTarget,
          metric_current: goal.metricCurrent,
          status: goal.status,
          weight: goal.weight,
          progress: goal.progress,
          created_at: goal.createdAt,
          updated_at: goal.updatedAt,
        });
      } catch (err) {
        console.error("createGoal failed", err);
      }
      return goal;
    },

    updateGoal: async (id: string, updates: Partial<GoalExt>) => {
      const prev = get().goalsExt as GoalExt[];
      const now = new Date().toISOString();
      set({
        goalsExt: prev.map((g) =>
          g.id === id ? { ...g, ...updates, updatedAt: now } : g
        ),
      });
      const dbUpdates: Record<string, any> = { updated_at: now };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      if (updates.timePeriod !== undefined)
        dbUpdates.time_period = updates.timePeriod;
      if (updates.startDate !== undefined)
        dbUpdates.start_date = updates.startDate;
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
      if (updates.metricType !== undefined)
        dbUpdates.metric_type = updates.metricType;
      if (updates.metricTarget !== undefined)
        dbUpdates.metric_target = updates.metricTarget;
      if (updates.metricCurrent !== undefined)
        dbUpdates.metric_current = updates.metricCurrent;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      try {
        await supabase.from("goals").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateGoal failed", err);
      }
    },

    deleteGoal: async (id: string) => {
      const prev = get().goalsExt as GoalExt[];
      set({ goalsExt: prev.filter((g) => g.id !== id) });
      try {
        await supabase.from("goal_contributions").delete().eq("goal_id", id);
        await supabase.from("goals").delete().eq("id", id);
      } catch (err) {
        console.error("deleteGoal failed", err);
      }
    },

    linkGoalToProject: async (goalId: string, projectId: string) => {
      const prev = (get().goalContributions as GoalContribution[]) ?? [];
      if (
        prev.some((c) => c.goalId === goalId && c.projectId === projectId)
      ) {
        return;
      }
      const now = new Date().toISOString();
      const contribution: GoalContribution = {
        id: crypto.randomUUID(),
        goalId,
        projectId,
        portfolioId: null,
        taskId: null,
        createdAt: now,
      };
      set({ goalContributions: [...prev, contribution] });
      try {
        await supabase.from("goal_contributions").insert({
          id: contribution.id,
          goal_id: contribution.goalId,
          project_id: contribution.projectId,
          portfolio_id: contribution.portfolioId,
          task_id: contribution.taskId,
          created_at: contribution.createdAt,
        });
      } catch (err) {
        console.error("linkGoalToProject failed", err);
      }
    },

    unlinkGoalFromProject: async (goalId: string, projectId: string) => {
      const prev = (get().goalContributions as GoalContribution[]) ?? [];
      set({
        goalContributions: prev.filter(
          (c) => !(c.goalId === goalId && c.projectId === projectId)
        ),
      });
      try {
        await supabase
          .from("goal_contributions")
          .delete()
          .eq("goal_id", goalId)
          .eq("project_id", projectId);
      } catch (err) {
        console.error("unlinkGoalFromProject failed", err);
      }
    },
  };
}

// ---------- Portfolios Slice ----------

export function createPortfoliosSlice(set: SetFn, get: GetFn) {
  return {
    createPortfolio: async (
      data: Partial<PortfolioExt> & { name: string }
    ): Promise<PortfolioExt> => {
      const now = new Date().toISOString();
      const portfolio: PortfolioExt = {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        description: data.description ?? null,
        color: data.color ?? "#4c6ef5",
        ownerId: data.ownerId ?? null,
        parentId: data.parentId ?? null,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
        projectIds: data.projectIds ?? [],
      };
      set({
        portfoliosExt: [...(get().portfoliosExt as PortfolioExt[]), portfolio],
      });
      try {
        await supabase.from("portfolios").insert({
          id: portfolio.id,
          name: portfolio.name,
          description: portfolio.description,
          color: portfolio.color,
          owner_id: portfolio.ownerId,
          parent_id: portfolio.parentId,
          created_at: portfolio.createdAt,
          updated_at: portfolio.updatedAt,
        });
      } catch (err) {
        console.error("createPortfolio failed", err);
      }
      return portfolio;
    },

    updatePortfolio: async (id: string, updates: Partial<PortfolioExt>) => {
      const prev = get().portfoliosExt as PortfolioExt[];
      const now = new Date().toISOString();
      set({
        portfoliosExt: prev.map((p) =>
          p.id === id ? { ...p, ...updates, updatedAt: now } : p
        ),
      });
      const dbUpdates: Record<string, any> = { updated_at: now };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
      if (updates.parentId !== undefined) dbUpdates.parent_id = updates.parentId;
      try {
        await supabase.from("portfolios").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updatePortfolio failed", err);
      }
    },

    deletePortfolio: async (id: string) => {
      const prev = get().portfoliosExt as PortfolioExt[];
      const prevLinks =
        (get().portfolioProjects as {
          portfolioId: string;
          projectId: string;
          position: number;
          createdAt: string;
        }[]) ?? [];
      set({
        portfoliosExt: prev.filter((p) => p.id !== id),
        portfolioProjects: prevLinks.filter((l) => l.portfolioId !== id),
      });
      try {
        await supabase
          .from("portfolio_projects")
          .delete()
          .eq("portfolio_id", id);
        await supabase.from("portfolios").delete().eq("id", id);
      } catch (err) {
        console.error("deletePortfolio failed", err);
      }
    },

    addProjectToPortfolio: async (portfolioId: string, projectId: string) => {
      const prev =
        (get().portfolioProjects as {
          portfolioId: string;
          projectId: string;
          position: number;
          createdAt: string;
        }[]) ?? [];
      if (
        prev.some(
          (l) => l.portfolioId === portfolioId && l.projectId === projectId
        )
      ) {
        return;
      }
      const now = new Date().toISOString();
      const position = prev.filter((l) => l.portfolioId === portfolioId).length;
      const link = { portfolioId, projectId, position, createdAt: now };
      set({ portfolioProjects: [...prev, link] });
      try {
        await supabase.from("portfolio_projects").insert({
          portfolio_id: portfolioId,
          project_id: projectId,
          position,
          created_at: now,
        });
      } catch (err) {
        console.error("addProjectToPortfolio failed", err);
      }
    },

    removeProjectFromPortfolio: async (
      portfolioId: string,
      projectId: string
    ) => {
      const prev =
        (get().portfolioProjects as {
          portfolioId: string;
          projectId: string;
          position: number;
          createdAt: string;
        }[]) ?? [];
      set({
        portfolioProjects: prev.filter(
          (l) => !(l.portfolioId === portfolioId && l.projectId === projectId)
        ),
      });
      try {
        await supabase
          .from("portfolio_projects")
          .delete()
          .eq("portfolio_id", portfolioId)
          .eq("project_id", projectId);
      } catch (err) {
        console.error("removeProjectFromPortfolio failed", err);
      }
    },
  };
}

// ---------- Teams Slice ----------

export function createTeamsSlice(set: SetFn, get: GetFn) {
  return {
    createTeam: async (
      data: Partial<TeamExt> & { name: string }
    ): Promise<TeamExt> => {
      const now = new Date().toISOString();
      const team: TeamExt = {
        id: data.id ?? crypto.randomUUID(),
        name: data.name,
        description: data.description ?? null,
        ownerId: data.ownerId ?? null,
        createdAt: data.createdAt ?? now,
        updatedAt: data.updatedAt ?? now,
      };
      set({ teams: [...(get().teams as TeamExt[]), team] });
      try {
        await supabase.from("teams").insert({
          id: team.id,
          name: team.name,
          description: team.description,
          owner_id: team.ownerId,
          created_at: team.createdAt,
          updated_at: team.updatedAt,
        });
      } catch (err) {
        console.error("createTeam failed", err);
      }
      return team;
    },

    updateTeam: async (id: string, updates: Partial<TeamExt>) => {
      const prev = get().teams as TeamExt[];
      const now = new Date().toISOString();
      set({
        teams: prev.map((t) =>
          t.id === id ? { ...t, ...updates, updatedAt: now } : t
        ),
      });
      const dbUpdates: Record<string, any> = { updated_at: now };
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.description !== undefined)
        dbUpdates.description = updates.description;
      if (updates.ownerId !== undefined) dbUpdates.owner_id = updates.ownerId;
      try {
        await supabase.from("teams").update(dbUpdates).eq("id", id);
      } catch (err) {
        console.error("updateTeam failed", err);
      }
    },

    deleteTeam: async (id: string) => {
      const prev = get().teams as TeamExt[];
      const prevMembers = (get().teamMembers as TeamMemberExt[]) ?? [];
      set({
        teams: prev.filter((t) => t.id !== id),
        teamMembers: prevMembers.filter((m) => m.teamId !== id),
      });
      try {
        await supabase.from("team_members").delete().eq("team_id", id);
        await supabase.from("teams").delete().eq("id", id);
      } catch (err) {
        console.error("deleteTeam failed", err);
      }
    },

    addTeamMember: async (
      teamId: string,
      userId: string,
      role: string = "member"
    ) => {
      const prev = (get().teamMembers as TeamMemberExt[]) ?? [];
      if (prev.some((m) => m.teamId === teamId && m.userId === userId)) {
        return;
      }
      const now = new Date().toISOString();
      const member: TeamMemberExt = {
        teamId,
        userId,
        role,
        createdAt: now,
      };
      set({ teamMembers: [...prev, member] });
      try {
        await supabase.from("team_members").insert({
          team_id: teamId,
          user_id: userId,
          role,
          created_at: now,
        });
      } catch (err) {
        console.error("addTeamMember failed", err);
      }
    },

    removeTeamMember: async (teamId: string, userId: string) => {
      const prev = (get().teamMembers as TeamMemberExt[]) ?? [];
      set({
        teamMembers: prev.filter(
          (m) => !(m.teamId === teamId && m.userId === userId)
        ),
      });
      try {
        await supabase
          .from("team_members")
          .delete()
          .eq("team_id", teamId)
          .eq("user_id", userId);
      } catch (err) {
        console.error("removeTeamMember failed", err);
      }
    },

    addProjectMember: async (
      projectId: string,
      userId: string,
      role: string = "member"
    ) => {
      const prev = (get().projectMembers as ProjectMemberExt[]) ?? [];
      if (prev.some((m) => m.projectId === projectId && m.userId === userId)) {
        return;
      }
      const now = new Date().toISOString();
      const member: ProjectMemberExt = {
        projectId,
        userId,
        role,
        createdAt: now,
      };
      set({ projectMembers: [...prev, member] });
      try {
        await supabase.from("project_members").insert({
          project_id: projectId,
          user_id: userId,
          role,
          created_at: now,
        });
      } catch (err) {
        console.error("addProjectMember failed", err);
      }
    },

    removeProjectMember: async (projectId: string, userId: string) => {
      const prev = (get().projectMembers as ProjectMemberExt[]) ?? [];
      set({
        projectMembers: prev.filter(
          (m) => !(m.projectId === projectId && m.userId === userId)
        ),
      });
      try {
        await supabase
          .from("project_members")
          .delete()
          .eq("project_id", projectId)
          .eq("user_id", userId);
      } catch (err) {
        console.error("removeProjectMember failed", err);
      }
    },

    postProjectStatus: async (
      projectId: string,
      status: string,
      text?: string
    ) => {
      const now = new Date().toISOString();
      const currentUser = get().currentUser;
      const authorId = currentUser?.id ?? null;
      const update: ProjectStatusUpdateExt = {
        id: crypto.randomUUID(),
        projectId,
        authorId,
        status,
        text: text ?? null,
        createdAt: now,
      };
      const prev =
        (get().projectStatusUpdates as ProjectStatusUpdateExt[]) ?? [];
      set({ projectStatusUpdates: [...prev, update] });
      try {
        await supabase.from("project_status_updates").insert({
          id: update.id,
          project_id: update.projectId,
          author_id: update.authorId,
          status: update.status,
          text: update.text,
          created_at: update.createdAt,
        });
      } catch (err) {
        console.error("postProjectStatus failed", err);
      }
      return update;
    },
  };
}
