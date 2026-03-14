import { redirect } from "next/navigation";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function append(
  query: URLSearchParams,
  key: string,
  value: string | string[] | undefined,
) {
  if (!value) return;
  if (Array.isArray(value)) {
    const first = value.find((item) => item.trim());
    if (first) query.set(key, first);
    return;
  }
  query.set(key, value);
}

export default async function SignUpRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("mode", "sign-up");
  append(query, "error", params.error);
  append(query, "notice", params.notice);
  append(query, "email", params.email);
  append(query, "tenant_mode", params.tenant_mode);
  append(query, "organization_name", params.organization_name);
  append(query, "organization_slug", params.organization_slug);

  redirect(`/?${query.toString()}`);
}
