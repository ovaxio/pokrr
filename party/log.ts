export function log(event: string, data: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), event, ...data }));
}

export function truncId(id: string | null | undefined): string {
  return id ? id.slice(0, 8) : "—";
}
