import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { cn, formatDamage } from '@/lib/utils';

/** 보스 하나의 시즌별 딜량 추이 미니 라인차트 (자체 Y축 — 보스마다 기준점이 달라서). */
export function BossTrendChart({
  name,
  color,
  data,
  height = 'h-40',
}: {
  name: string;
  color: string;
  data: { name: string; 딜량: number }[];
  height?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <span className="text-sm font-medium">{name}</span>
      </div>
      <div className={cn('mt-3', height)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              tickFormatter={(v) => formatDamage(v)}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={56}
            />
            <Tooltip
              formatter={(v: number) => formatDamage(v)}
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 12,
                fontSize: 13,
              }}
            />
            <Line
              type="monotone"
              dataKey="딜량"
              stroke={color}
              strokeWidth={2.5}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
