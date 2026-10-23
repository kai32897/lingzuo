import { CURRENT_USER } from "@/data/config";
import { LS_KEYS, readLocal } from "@/lib/storage";
import type { UserSettings } from "@/lib/userContent";

export function currentSettings(): Partial<UserSettings> {
  return readLocal<Partial<UserSettings>>(LS_KEYS.settings, {});
}

export function currentName(): string {
  const name = currentSettings().name?.trim();
  return name || CURRENT_USER.name;
}

export function currentAvatarText(): string {
  return currentName().slice(0, 1) || CURRENT_USER.avatarText;
}
