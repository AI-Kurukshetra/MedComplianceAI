export function generateCertNo(userId: string, moduleId: string): string {
  const datePart = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const userPart = userId.replaceAll("-", "").slice(0, 8).toUpperCase();
  const modulePart = moduleId.replaceAll("-", "").slice(0, 8).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CERT-${datePart}-${userPart}-${modulePart}-${rand}`;
}
