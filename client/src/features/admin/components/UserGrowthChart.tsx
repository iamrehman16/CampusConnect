// features/admin/components/UserGrowthChart.tsx
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { useChartTheme } from '../hooks/useChartTheme';
import { fillMissingDays } from '../utils/fillMissingDays';
import type { DailyCount } from '../types/admin.dto';

interface Props { data: DailyCount[] }

const formatDate = (value: unknown) => {
  const d = new Date(String(value));
  return `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
};

export default function UserGrowthChart({ data }: Props) {
  const c = useChartTheme();
  const filled = fillMissingDays(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={filled} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={c.secondary} stopOpacity={0.15} />
            <stop offset="95%" stopColor={c.secondary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={c.gridColor} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 11, fill: c.textSecondary }}
          tickLine={false}
          axisLine={false}
          interval={6}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 11, fill: c.textSecondary }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: any) => [value ?? 0, 'New users']}
          labelFormatter={formatDate}
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke={c.secondary}
          strokeWidth={2}
          fill="url(#growthGradient)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}