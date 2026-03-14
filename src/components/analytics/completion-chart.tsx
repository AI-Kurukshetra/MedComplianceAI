"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CompletionChartProps = {
  data: Array<{ regulation: string; completionPct: number }>;
};

export function CompletionChart({ data }: CompletionChartProps) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm font-bold text-slate-900">Completion by Regulation</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="regulation" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="completionPct" fill="#1152d4" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
