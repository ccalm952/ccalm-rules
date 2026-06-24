import type { RulesPayload } from "@/lib/rules";

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

function headers(password: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    "X-Admin-Password": password,
  };
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchRules(password: string): Promise<RulesPayload> {
  const res = await fetch(`${API_BASE}/rules`, { headers: headers(password) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<RulesPayload>;
}

export async function saveRules(
  password: string,
  payload: Pick<RulesPayload, "direct" | "proxy"> & { message?: string },
): Promise<{ commitUrl?: string }> {
  const res = await fetch(`${API_BASE}/rules`, {
    method: "PUT",
    headers: headers(password),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<{ commitUrl?: string }>;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/health`, { headers: headers(password) });
  return res.ok;
}

export interface Bookmark {
  id: number;
  title: string;
  url: string;
  category: string;
  sortOrder: number;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export type BookmarkInput = Pick<Bookmark, "title" | "url" | "category" | "sortOrder" | "icon">;

export async function fetchBookmarks(password: string): Promise<Bookmark[]> {
  const res = await fetch(`${API_BASE}/bookmarks`, { headers: headers(password) });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Bookmark[]>;
}

export async function createBookmark(password: string, data: BookmarkInput): Promise<Bookmark> {
  const res = await fetch(`${API_BASE}/bookmarks`, {
    method: "POST",
    headers: headers(password),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Bookmark>;
}

export async function updateBookmark(
  password: string,
  id: number,
  data: Partial<BookmarkInput>,
): Promise<Bookmark> {
  const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
    method: "PUT",
    headers: headers(password),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json() as Promise<Bookmark>;
}

export async function deleteBookmark(password: string, id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/bookmarks/${id}`, {
    method: "DELETE",
    headers: headers(password),
  });
  if (!res.ok) throw new Error(await parseError(res));
}
