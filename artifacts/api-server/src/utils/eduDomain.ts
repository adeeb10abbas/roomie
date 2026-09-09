export function isEduDomain(email: string): boolean {
  const domain = email.toLowerCase().split("@")[1] ?? "";
  if (domain.endsWith(".edu")) return true;
  const extra = (process.env.EDU_DOMAIN_ALLOWLIST ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(domain);
}

export function extractDomain(email: string): string {
  return (email.toLowerCase().split("@")[1] ?? "").trim();
}
