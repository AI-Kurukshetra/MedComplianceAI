"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PassRateChartProps = {
  data: Array<{ label: string; passRate: number }>;
};

export function PassRateChart({ data }: PassRateChartProps) {
  return (
    <div className="surface-card p-4">
      <p className="text-sm font-bold text-slate-900">Pass Rate Trend</p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="passRate" stroke="#1152d4" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
