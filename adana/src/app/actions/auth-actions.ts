"use server";

import { prisma } from "@/lib/prisma";

// Simple hash for demo purposes (not production-grade)
function simpleHash(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `hashed_${Math.abs(hash).toString(36)}`;
}

function verifyPassword(password: string, hashed: string): boolean {
  return simpleHash(password) === hashed;
}

export async function register(name: string, email: string, password: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "A user with this email already exists" };
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: simpleHash(password),
      },
    });

    return {
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    };
  } catch (error) {
    return { error: "Failed to register user" };
  }
}

export async function login(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Invalid email or password" };
    }

    if (!verifyPassword(password, user.password)) {
      return { error: "Invalid email or password" };
    }

    return {
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar },
    };
  } catch (error) {
    return { error: "Failed to log in" };
  }
}

export async function getCurrentUser() {
  try {
    // DEMO ONLY: In production, this should read from a session/cookie.
    // For demo purposes we return the first user in the DB.
    let user = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!user) {
      user = await seedDemoUser();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
  } catch (error) {
    return null;
  }
}

export async function seedDemoUser() {
  const existing = await prisma.user.findUnique({
    where: { email: "demo@adana.dev" },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      name: "Demo User",
      email: "demo@adana.dev",
      password: simpleHash("demo1234"),
      avatar: null,
    },
  });
}
