import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LeaderboardEntry } from '../types';

interface Props {
  data: LeaderboardEntry[];
}

const LeaderboardChart: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 w-full h-80">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Comparativa de Avance</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            tick={{fontSize: 12}} 
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Avance']}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isCurrentUser ? '#7a1cac' : '#cbd5e1'} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LeaderboardChart;