
"use client"

import * as React from "react"
import { format, subDays, eachDayOfInterval, parseISO } from "date-fns"
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"

import {
  ChartContainer,
  ChartConfig,
} from "@/components/ui/chart"
import type { Spending } from "@/lib/types"

interface SpendingLineChartProps {
  spendings: Spending[],
  currencySymbol: string
}

const chartConfig = {
  spending: {
    label: "Spending",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function SpendingLineChart({ spendings, currencySymbol }: SpendingLineChartProps) {
  const chartData = React.useMemo(() => {
    const end = new Date();
    const start = subDays(end, 29); // Last 30 days
    const dateRange = eachDayOfInterval({ start, end });

    const dailyTotals = spendings.reduce((acc, t) => {
      const date = format(parseISO(t.date), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + t.amount;
      return acc;
    }, {} as { [key: string]: number });

    return dateRange.map(date => {
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: format(date, 'MMM d'),
        spending: dailyTotals[formattedDate] || 0,
      }
    });
  }, [spendings]);

  if (spendings.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center h-[250px] text-center p-4">
        <p className="text-muted-foreground">Not enough data for a trend chart.</p>
        <p className="text-sm text-muted-foreground">Log at least two different days of spending to see your trend.</p>
      </div>
    )
  }

  return (
    <div className="h-[250px] w-full">
      <ChartContainer config={chartConfig}>
        <LineChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: 5,
            right: 20,
            left: 10,
            bottom: 40,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value}
            className="text-xs"
            interval={6}
          />
           <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickMargin={5}
            tickFormatter={(value) => {
                const num = Number(value);
                if (num >= 1000) {
                    return `${currencySymbol}${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
                }
                return `${currencySymbol}${num}`;
            }}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                        <span className="font-bold text-muted-foreground">{label}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Spending</span>
                        <span className="font-bold">{currencySymbol}{payload[0].value?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            dataKey="spending"
            type="monotone"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ChartContainer>
    </div>
  )
}
