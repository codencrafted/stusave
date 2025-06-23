"use client"

import * as React from "react"
import { Pie, PieChart, Cell } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import type { Spending } from "@/lib/types"
import { CATEGORIES } from "@/lib/constants"

interface CategoryPieChartProps {
  spendings: Spending[]
}

export function CategoryPieChart({ spendings }: CategoryPieChartProps) {
  const chartData = React.useMemo(() => {
    if (!spendings.length) return [];

    const categoryTotals = spendings.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
      fill: `var(--color-${category})`
    }));
  }, [spendings]);

  const chartConfig = React.useMemo(() => {
    const config: any = {};
    CATEGORIES.forEach((cat, index) => {
        config[cat.name] = {
            label: `${cat.emoji} ${cat.name}`,
            color: `hsl(var(--chart-${(index % 7) + 1}))`
        }
    });
    return config;
  }, []);

  if (!spendings.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <p className="text-muted-foreground">No spending data yet.</p>
        <p className="text-sm text-muted-foreground">Add a spending to see your spending breakdown.</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <PieChart>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel />}
        />
        <Pie
          data={chartData}
          dataKey="total"
          nameKey="category"
          innerRadius={50}
          strokeWidth={2}
        >
            {chartData.map((entry) => (
                <Cell key={`cell-${entry.category}`} fill={entry.fill} />
            ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="category" />} />
      </PieChart>
    </ChartContainer>
  )
}
