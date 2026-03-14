"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getBaseUrl(): Promise<string> {
  const requestHeaders = await headers();
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL;

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  const origin = requestHeaders.get("origin");
  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  if (forwardedHost) {
    const proto = requestHeaders.get("x-forwarded-proto") ?? "https";
    return `${proto}://${forwardedHost}`;
  }

  const host = requestHeaders.get("host");
  if (host) {
    const isLocalHost =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");
    const proto = isLocalHost ? "http" : "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

function getSingleValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeReturnTo(formData: FormData, fallback: string): string {
  const returnTo = getSingleValue(formData, "return_to");
  if (!returnTo || !returnTo.startsWith("/")) {
    return fallback;
  }
  return returnTo;
}

function withQuery(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const url = new URL(path, "http://localhost");
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function normalizeSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TenantRpcRow = {
  id: string;
  name: string;
  slug: string;
};

function pickTenantRow(data: unknown): TenantRpcRow | null {
  if (Array.isArray(data) && data.length > 0 && data[0]) {
    const row = data[0] as Partial<TenantRpcRow>;
    if (typeof row.id === "string" && typeof row.name === "string" && typeof row.slug === "string") {
      return { id: row.id, name: row.name, slug: row.slug };
    }
  }
  return null;
}

type SignupTenantContext = {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: "org_admin" | "learner";
};

async function resolveSignupTenantContext(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  tenantMode: string;
  organizationName: string;
  organizationSlug: string;
}): Promise<{ data: SignupTenantContext | null; error: string | null }> {
  const { supabase, tenantMode, organizationName, organizationSlug } = params;

  if (tenantMode === "join") {
    if (!organizationSlug) {
      return { data: null, error: "Organization slug is required to join a workspace" };
    }

    const { data, error } = await supabase.rpc("resolve_signup_organization", {
      p_slug: organizationSlug,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    const row = pickTenantRow(data);
    if (!row) {
      return { data: null, error: "Organization not found. Check the workspace slug and try again." };
    }

    return {
      data: {
        organizationId: row.id,
        organizationName: row.name,
        organizationSlug: row.slug,
        role: "learner",
      },
      error: null,
    };
  }

  if (!organizationName || organizationName.length < 3) {
    return { data: null, error: "Organization name must be at least 3 characters" };
  }

  const { data, error } = await supabase.rpc("provision_signup_organization", {
    p_name: organizationName,
    p_slug: organizationSlug || null,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  const row = pickTenantRow(data);
  if (!row) {
    return { data: null, error: "Unable to create organization workspace" };
  }

  return {
    data: {
      organizationId: row.id,
      organizationName: row.name,
      organizationSlug: row.slug,
      role: "org_admin",
    },
    error: null,
  };
}

export async function signInAction(formData: FormData) {
  const supabase = await createClient();
  const email = getSingleValue(formData, "email");
  const password = getSingleValue(formData, "password");
  const returnTo = normalizeReturnTo(formData, "/auth/sign-in");
  const mode = getSingleValue(formData, "auth_mode") || "sign-in";

  if (!email || !password) {
    redirect(
      withQuery(returnTo, {
        mode,
        error: "Email and password are required",
      }),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const normalized = error.message.toLowerCase();
    if (
      normalized.includes("email not confirmed") ||
      normalized.includes("email_not_confirmed")
    ) {
      redirect(
        withQuery(returnTo, {
          mode,
          email,
          error:
            "Email not confirmed. Please check your inbox for a confirmation link.",
        }),
      );
    }

    redirect(
      withQuery(returnTo, {
        mode,
        email,
        error: error.message,
      }),
    );
  }

  redirect("/dashboard");
}

export async function signUpAction(formData: FormData) {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();

  const email = getSingleValue(formData, "email");
  const password = getSingleValue(formData, "password");
  const confirmPassword = getSingleValue(formData, "confirm_password");
  const fullName = getSingleValue(formData, "full_name");
  const tenantMode = getSingleValue(formData, "tenant_mode") || "create";
  const organizationName = getSingleValue(formData, "organization_name");
  const organizationSlug = normalizeSlug(getSingleValue(formData, "organization_slug"));
  const returnTo = normalizeReturnTo(formData, "/auth/sign-up");
  const signUpQuery = {
    mode: "sign-up",
    email,
    tenant_mode: tenantMode,
    organization_name: organizationName,
    organization_slug: organizationSlug,
  };

  if (!email || !password) {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: "Email and password are required",
      }),
    );
  }

  if (password.length < 8) {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: "Password must be at least 8 characters",
      }),
    );
  }

  if (password !== confirmPassword) {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: "Passwords do not match",
      }),
    );
  }

  if (tenantMode !== "create" && tenantMode !== "join") {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: "Invalid workspace selection",
      }),
    );
  }

  const { data: tenant, error: tenantError } = await resolveSignupTenantContext({
    supabase,
    tenantMode,
    organizationName,
    organizationSlug,
  });

  if (tenantError || !tenant) {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: tenantError ?? "Unable to resolve organization workspace",
      }),
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
      data: {
        full_name: fullName,
        role: tenant.role,
        organization_id: tenant.organizationId,
        organization_slug: tenant.organizationSlug,
      },
    },
  });

  if (error) {
    redirect(
      withQuery(returnTo, {
        ...signUpQuery,
        error: error.message,
      }),
    );
  }

  if (!data.session) {
    redirect(
      withQuery(returnTo, {
        mode: "sign-in",
        email,
        notice: `Account created for ${tenant.organizationName}. Please confirm your email before signing in.`,
      }),
    );
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function resendConfirmationAction(formData: FormData) {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const email = getSingleValue(formData, "email");
  const returnTo = normalizeReturnTo(formData, "/auth/sign-in");

  if (!email) {
    redirect(
      withQuery(returnTo, {
        mode: "sign-in",
        error: "Email is required to resend confirmation",
      }),
    );
  }

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  });

  if (error) {
    redirect(
      withQuery(returnTo, {
        mode: "sign-in",
        email,
        error: error.message,
      }),
    );
  }

  redirect(
    withQuery(returnTo, {
      mode: "sign-in",
      email,
      notice: "Confirmation email sent. Check your inbox.",
    }),
  );
}

export async function requestPasswordResetAction(formData: FormData) {
  const supabase = await createClient();
  const baseUrl = await getBaseUrl();
  const email = getSingleValue(formData, "email");

  if (!email) {
    redirect("/auth/forgot-password?error=Email%20is%20required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${baseUrl}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    redirect(
      `/auth/forgot-password?error=${encodeURIComponent(error.message)}&email=${encodeURIComponent(email)}`,
    );
  }

  redirect(
    `/auth/sign-in?notice=${encodeURIComponent(
      "Password reset link sent. Check your email.",
    )}&email=${encodeURIComponent(email)}`,
  );
}

export async function resetPasswordAction(formData: FormData) {
  const supabase = await createClient();
  const password = getSingleValue(formData, "password");
  const confirmPassword = getSingleValue(formData, "confirm_password");

  if (!password || !confirmPassword) {
    redirect("/auth/reset-password?error=Both%20password%20fields%20are%20required");
  }

  if (password.length < 8) {
    redirect("/auth/reset-password?error=Password%20must%20be%20at%20least%208%20characters");
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?error=Passwords%20do%20not%20match");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth/sign-in?error=Your%20password%20reset%20session%20expired.%20Please%20request%20a%20new%20link.",
    );
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/auth/sign-in?notice=${encodeURIComponent(
      "Password updated successfully. Please sign in.",
    )}`,
  );
}
