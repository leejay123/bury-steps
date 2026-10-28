"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { OverviewPoint } from "./overview-data";

const config = { value: { label: "Clock-ins", color: "var(--foreground)" } } satisfies ChartConfig;

/** The Overview's chart: an area (designs 1 and 4) or bars (2 and 3). */
export function OverviewChart({ data, kind }: { data: OverviewPoint[]; kind: "area" | "bar" }) {
  return (
    <ChartContainer className="aspect-auto h-56 w-full" config={config}>
      {kind === "area" ? (
        <AreaChart data={data} margin={{ left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Area
            dataKey="value"
            fill="var(--color-value)"
            fillOpacity={0.12}
            stroke="var(--color-value)"
            strokeWidth={1.5}
            type="monotone"
          />
        </AreaChart>
      ) : (
        <BarChart data={data} margin={{ left: 4, right: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
          <Bar dataKey="value" fill="var(--color-value)" radius={4} />
        </BarChart>
      )}
    </ChartContainer>
  );
}
