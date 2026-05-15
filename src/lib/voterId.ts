import { nanoid } from "nanoid";

const VOTER_KEY = "pokrr:voterId";
const NAME_KEY = "pokrr:name";

export function getOrCreateVoterId(): string {
  if (typeof window === "undefined") return "";
  let id = window.localStorage.getItem(VOTER_KEY);
  if (!id) {
    id = nanoid(16);
    window.localStorage.setItem(VOTER_KEY, id);
  }
  return id;
}

export function getStoredName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

export function storeName(name: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NAME_KEY, name);
}
