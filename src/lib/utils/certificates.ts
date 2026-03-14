import { generateCertNo } from "@/lib/utils/certificate";

export function generateCertificateNumber(userId: string, moduleId: string): string {
  return generateCertNo(userId, moduleId);
}
