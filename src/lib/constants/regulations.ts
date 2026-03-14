export const REGULATIONS = ["HIPAA", "HITECH", "SOX", "FDA"] as const;

export type Regulation = (typeof REGULATIONS)[number];

export const REGULATION_LABELS: Record<Regulation, string> = {
  HIPAA: "HIPAA",
  HITECH: "HITECH",
  SOX: "SOX",
  FDA: "FDA",
};

export const REGULATION_COLORS: Record<
  Regulation,
  { bg: string; fg: string; dot: string }
> = {
  HIPAA: { bg: "bg-blue-100", fg: "text-blue-700", dot: "bg-blue-600" },
  HITECH: { bg: "bg-purple-100", fg: "text-purple-700", dot: "bg-purple-600" },
  SOX: { bg: "bg-amber-100", fg: "text-amber-700", dot: "bg-amber-600" },
  FDA: { bg: "bg-emerald-100", fg: "text-emerald-700", dot: "bg-emerald-600" },
};
