// features/admin/components/UploadsLineChart.tsx
import {
  ResponsiveContainer, LineChart, Line,
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

export default function UploadsLineChart({ data }: Props) {
  const c = useChartTheme();
  const filled = fillMissingDays(data);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={filled} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
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
          formatter={(value: any) => [value ?? 0, 'Uploads']}
          labelFormatter={formatDate}
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke={c.primary}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}