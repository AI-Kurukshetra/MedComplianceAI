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

export default async function SignInRedirectPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("mode", "sign-in");
  append(query, "error", params.error);
  append(query, "notice", params.notice);
  append(query, "email", params.email);

  redirect(`/?${query.toString()}`);
}
