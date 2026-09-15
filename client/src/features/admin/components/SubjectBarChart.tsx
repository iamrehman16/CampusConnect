// features/admin/components/SubjectBarChart.tsx
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { useChartTheme } from '../hooks/useChartTheme';
import type { DistributionItem } from '../types/admin.dto';

interface Props { data: DistributionItem[] }

export default function SubjectBarChart({ data }: Props) {
  const c = useChartTheme();

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
        barSize={14}
      >
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{ fontSize: 11, fill: c.textSecondary }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={90}
          tick={{ fontSize: 11, fill: c.textSecondary }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          formatter={(value: any) => [value ?? 0, 'Resources']}
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: 'transparent' }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={c.palette[i % c.palette.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}