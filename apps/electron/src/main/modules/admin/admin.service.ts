import argon2 from "argon2";
import { getSharedConfigManager } from "@/main/infrastructure/shared-config-manager";
import type { AdminStatus } from "@mcp_router/shared";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_USERNAME_LENGTH = 64;

export class AdminSessionRequiredError extends Error {
  constructor() {
    super("Admin session required");
    this.name = "AdminSessionRequiredError";
  }
}

let unlocked = false;

function normalizeUsername(username: string): string {
  return username.trim();
}

function assertUsername(username: string): string {
  const value = normalizeUsername(username);
  if (!value || value.length > MAX_USERNAME_LENGTH) {
    throw new Error("Enter a username of 1–64 characters");
  }
  return value;
}

function assertPassword(password: string): string {
  if (
    typeof password !== "string" ||
    password.length < MIN_PASSWORD_LENGTH ||
    password.length > MAX_PASSWORD_LENGTH
  ) {
    throw new Error("Password must be 8–128 characters");
  }
  return password;
}

export function getAdminStatus(): AdminStatus {
  const admin = getSharedConfigManager().getAdmin();
  if (!admin) {
    return { configured: false, unlocked: false };
  }
  return {
    configured: true,
    unlocked,
    username: admin.username,
  };
}

export function requireAdminSession(): void {
  const status = getAdminStatus();
  if (!status.configured || !status.unlocked) {
    throw new AdminSessionRequiredError();
  }
}

export async function setupAdmin(
  username: string,
  password: string,
): Promise<AdminStatus> {
  if (getSharedConfigManager().getAdmin()) {
    throw new Error("Admin is already configured");
  }
  const nextUsername = assertUsername(username);
  const nextPassword = assertPassword(password);
  const passwordHash = await argon2.hash(nextPassword);
  getSharedConfigManager().saveAdmin({
    username: nextUsername,
    passwordHash,
    createdAt: Math.floor(Date.now() / 1000),
  });
  unlocked = true;
  return getAdminStatus();
}

export async function unlockAdmin(
  username: string,
  password: string,
): Promise<AdminStatus> {
  const admin = getSharedConfigManager().getAdmin();
  if (!admin) {
    throw new Error("Admin is not configured");
  }
  const matchesUser = normalizeUsername(username) === admin.username;
  const matchesPassword = await argon2.verify(admin.passwordHash, password);
  if (!matchesUser || !matchesPassword) {
    throw new Error("Invalid username or password");
  }
  unlocked = true;
  return getAdminStatus();
}

export function lockAdmin(): AdminStatus {
  unlocked = false;
  return getAdminStatus();
}

export async function changeAdminPassword(
  currentPassword: string,
  nextPassword: string,
): Promise<AdminStatus> {
  requireAdminSession();
  const admin = getSharedConfigManager().getAdmin();
  if (!admin) {
    throw new Error("Admin is not configured");
  }
  const matchesPassword = await argon2.verify(
    admin.passwordHash,
    currentPassword,
  );
  if (!matchesPassword) {
    throw new Error("Current password is incorrect");
  }
  const hashed = await argon2.hash(assertPassword(nextPassword));
  getSharedConfigManager().saveAdmin({
    ...admin,
    passwordHash: hashed,
  });
  return getAdminStatus();
}
