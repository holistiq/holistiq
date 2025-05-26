import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Sample data with multiple points on the same day
const data = [
  { date: new Date("2023-05-08T09:00:00").getTime(), score: 85 },
  { date: new Date("2023-05-08T14:00:00").getTime(), score: 76 },
  { date: new Date("2023-05-11T10:00:00").getTime(), score: 83 },
];

export function LineChartTest() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Line Chart Type Comparison</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Natural Curve (Before)</h2>
          <div className="h-[300px] border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["auto", "auto"]}
                  tickFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleDateString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleString()
                  }
                  formatter={(value) => [value, "Score"]}
                />
                <Legend />
                <Line
                  type="natural"
                  dataKey="score"
                  stroke="#8884d8"
                  strokeWidth={2}
                  dot={{ r: 5, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Linear (After)</h2>
          <div className="h-[300px] border p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  type="number"
                  scale="time"
                  domain={["auto", "auto"]}
                  tickFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleDateString()
                  }
                />
                <YAxis />
                <Tooltip
                  labelFormatter={(timestamp) =>
                    new Date(timestamp).toLocaleString()
                  }
                  formatter={(value) => [value, "Score"]}
                />
                <Legend />
                <Line
                  type="linear"
                  dataKey="score"
                  stroke="#82ca9d"
                  strokeWidth={2}
                  dot={{ r: 5, strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
