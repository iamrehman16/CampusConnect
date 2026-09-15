// features/admin/components/ApprovalDonut.tsx
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChartTheme } from '../hooks/useChartTheme';
import type { ApprovalFunnel } from '../types/admin.dto';

interface Props { data: ApprovalFunnel }

export default function ApprovalDonut({ data }: Props) {
  const c = useChartTheme();

  const segments = [
    { name: 'Approved', value: data.approved, color: c.secondary },
    { name: 'Pending',  value: data.pending,  color: c.warning  },
    { name: 'Rejected', value: data.rejected, color: c.error    },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={segments}
          cx="50%"
          cy="45%"
          innerRadius="55%"
          outerRadius="75%"
          paddingAngle={3}
          dataKey="value"
        >
          {segments.map((s) => (
            <Cell key={s.name} fill={s.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: any, name: any) => [value ?? 0, name]}
          contentStyle={{
            background: c.tooltipBg,
            border: `1px solid ${c.tooltipBorder}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: c.textSecondary }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}