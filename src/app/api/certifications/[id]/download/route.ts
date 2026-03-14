import { fail } from "@/lib/api/response";
import { getAuthenticatedUser } from "@/lib/api/auth";

function pdfEscape(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildSimplePdf(lines: string[]): string {
  const content = lines
    .map((line, index) => `BT /F1 14 Tf 50 ${760 - index * 24} Td (${pdfEscape(line)}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
    "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    `5 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
  ];

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += `${object}\n`;
  }

  const xrefOffset = body.length;
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let i = 1; i < offsets.length; i += 1) {
    body += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }

  body += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return body;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedUser();

  if (!user) {
    return fail("Unauthorized", 401);
  }

  const { data: cert, error } = await supabase
    .from("certifications")
    .select("id, certificate_no, issued_at, expires_at, training_modules(title, regulation)")
    .eq("organization_id", user.organizationId)
    .eq("user_id", user.id)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return fail(error.message, 400, "FETCH_FAILED");
  }

  if (!cert) {
    return fail("Certification not found", 404, "NOT_FOUND");
  }

  const title = cert.training_modules?.[0]?.title ?? "Compliance Certification";
  const regulation = cert.training_modules?.[0]?.regulation ?? "HIPAA";

  const pdf = buildSimplePdf([
    "MedCompliance AI Certificate",
    `Certificate No: ${cert.certificate_no}`,
    `Title: ${title}`,
    `Regulation: ${regulation}`,
    `Issued: ${new Date(cert.issued_at).toLocaleDateString("en-US")}`,
    `Expires: ${new Date(cert.expires_at).toLocaleDateString("en-US")}`,
  ]);

  return new Response(pdf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=certificate-${cert.certificate_no}.pdf`,
    },
  });
}
