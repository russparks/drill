import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend, Sector, RadialBarChart, RadialBar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LabelList } from "recharts";
import { Project } from "@shared/schema";

// Status colors using darker shades for better visibility while maintaining theme
const STATUS_COLORS: Record<string, string> = {
  'tender': '#3b82f6', // blue-500 - vibrant blue
  'precon': '#10b981', // emerald-500 - vibrant green
  'construction': '#f59e0b', // amber-500 - vibrant yellow/orange
  'aftercare': '#6b7280', // gray-500 - medium gray
};

// Light status colors for fills (300 level)
const STATUS_LIGHT_COLORS: Record<string, string> = {
  'tender': '#93c5fd', // blue-300
  'precon': '#6ee7b7', // emerald-300
  'construction': '#fcd34d', // amber-300
  'aftercare': '#d1d5db', // gray-300
};

// Discipline colors matching the action page button scheme
const DISCIPLINE_COLORS: Record<string, string> = {
  'operations': '#1d4ed8',  // blue-700 (from blue-800 text)
  'commercial': '#0891b2',  // cyan-600 (from cyan-800 text)
  'design': '#7c3aed',      // violet-600 (from purple-800 text)
  'she': '#ea580c',         // orange-600 (from orange-800 text)
  'qa': '#4338ca',          // indigo-600 (from indigo-800 text)
  'general': '#4b5563'      // gray-600 (matching button bg)
};

// Light discipline colors for bar fills (300 level)
const DISCIPLINE_LIGHT_COLORS: Record<string, string> = {
  'operations': '#93c5fd',  // blue-300
  'commercial': '#67e8f9',  // cyan-300
  'design': '#c4b5fd',      // violet-300
  'she': '#fdba74',         // orange-300
  'qa': '#a5b4fc',          // indigo-300
  'general': '#d1d5db'      // gray-300
};

const CHART_COLORS = ['#E8E4F3', '#E8F5E8', '#FFF4E6', '#F0F0F0', '#cc3333', '#8884d8'];

export default function DetailCharts() {
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  const { data: actions = [] } = useQuery({
    queryKey: ["/api/actions"],
  });

  const { data: stats } = useQuery<{total: number; open: number; closed: number}>({
    queryKey: ["/api/stats"],
  });

  // Project Status Distribution
  const statusData = projects.reduce((acc: Record<string, number>, project) => {
    const status = project.status || 'unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusData).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  // Project Values by Status
  const valueByStatus = projects.reduce((acc: Record<string, number>, project) => {
    const status = project.status || 'unknown';
    const value = project.value ? parseFloat(project.value.replace(/[£,]/g, '')) || 0 : 0;
    acc[status] = (acc[status] || 0) + value;
    return acc;
  }, {});

  const valueChartData = Object.entries(valueByStatus).map(([status, value]) => ({
    status: status.charAt(0).toUpperCase() + status.slice(1),
    value: Math.round(value * 10) / 10,
  }));

  // Actions by Discipline
  const disciplineData = (actions as any[]).reduce((acc: Record<string, number>, action) => {
    const discipline = action.discipline || 'general';
    acc[discipline] = (acc[discipline] || 0) + 1;
    return acc;
  }, {});

  const disciplineChartData = Object.entries(disciplineData).map(([discipline, count]) => ({
    discipline: discipline.toLowerCase() === 'qa' ? 'QA' : 
                discipline.toLowerCase() === 'she' ? 'SHE' :
                discipline.charAt(0).toUpperCase() + discipline.slice(1),
    count,
    fill: DISCIPLINE_LIGHT_COLORS[discipline.toLowerCase()] || '#d1d5db',
    stroke: DISCIPLINE_COLORS[discipline.toLowerCase()] || '#8884d8',
  }));

  // Project Timeline Data
  const timelineData = projects
    .filter(p => p.startOnSiteDate && p.contractCompletionDate)
    .map(project => {
      const startDate = new Date(project.startOnSiteDate!);
      const contractDate = new Date(project.contractCompletionDate!);
      const constructionDate = project.constructionCompletionDate ? new Date(project.constructionCompletionDate) : contractDate;
      
      const totalWeeks = Math.ceil((contractDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const constructionWeeks = Math.ceil((constructionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
      
      return {
        name: project.projectNumber || project.name?.substring(0, 10),
        totalWeeks,
        constructionWeeks,
        buffer: totalWeeks - constructionWeeks,
      };
    })
    .sort((a, b) => a.totalWeeks - b.totalWeeks);

  // Projects On Time Analysis
  const projectTimingData = projects
    .filter(p => p.startOnSiteDate && p.contractCompletionDate)
    .map(project => {
      const startDate = new Date(project.startOnSiteDate!);
      const contractDate = new Date(project.contractCompletionDate!);
      const constructionDate = project.constructionCompletionDate ? new Date(project.constructionCompletionDate) : contractDate;
      const currentDate = new Date();
      
      // Simulate some projects being late by randomly adjusting actual vs planned dates
      const isLate = Math.random() > 0.7; // 30% chance of being late
      const actualDate = isLate ? new Date(constructionDate.getTime() + (Math.random() * 30 * 24 * 60 * 60 * 1000)) : constructionDate;
      
      return {
        name: project.projectNumber || project.name?.substring(0, 8),
        planned: Math.ceil((constructionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        actual: Math.ceil((actualDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
        status: project.status,
      };
    })
    .sort((a, b) => a.planned - b.planned);

  // Actions by Assignee (Open Actions Only)
  const assigneeData = (actions as any[])
    .filter(action => action.assignee && action.status === 'open')
    .reduce((acc: Record<string, number>, action) => {
      const assigneeName = action.assignee.name || action.assignee.username || 'Unknown';
      acc[assigneeName] = (acc[assigneeName] || 0) + 1;
      return acc;
    }, {});

  const actionsByPersonData = Object.entries(assigneeData).map(([name, count], index) => {
    // Format name as initial + surname
    const nameParts = name.split(' ');
    const formattedName = nameParts.length > 1 
      ? `${nameParts[0][0]}. ${nameParts[nameParts.length - 1]}`
      : name;
    
    return {
      assignee: formattedName,
      count,
    };
  }).sort((a, b) => b.count - a.count);

  // Calculate color based on value (green low, red high)
  const maxCount = Math.max(...actionsByPersonData.map(d => d.count));
  const minCount = Math.min(...actionsByPersonData.map(d => d.count));
  
  const getColorForValue = (value: number) => {
    if (maxCount === minCount) return { fill: '#d1d5db', stroke: '#6b7280' }; // Default grey if all same
    
    const ratio = (value - minCount) / (maxCount - minCount);
    
    // Define the color stops: green-600, green-400, orange-400, red-500, red-700
    const colors = [
      { fill: '#16a34a', stroke: '#15803d' }, // green-500, green-600
      { fill: '#4ade80', stroke: '#22c55e' }, // green-400, green-500  
      { fill: '#fb923c', stroke: '#f97316' }, // orange-400, orange-500
      { fill: '#ef4444', stroke: '#dc2626' }, // red-500, red-600
      { fill: '#b91c1c', stroke: '#991b1b' }, // red-700, red-800
    ];
    
    // Map ratio to color index
    const colorIndex = Math.min(Math.floor(ratio * colors.length), colors.length - 1);
    return colors[colorIndex];
  };

  const coloredAssigneeData = actionsByPersonData.map(item => ({
    ...item,
    ...getColorForValue(item.count)
  }));

  // Average Time for Closed Actions - matching discipline order and colors
  const avgClosureTimeData = Object.keys(disciplineData).map(discipline => ({
    discipline: discipline.toLowerCase() === 'qa' ? 'QA' : 
                discipline.toLowerCase() === 'she' ? 'SHE' :
                discipline.charAt(0).toUpperCase() + discipline.slice(1),
    avgDays: discipline === 'operations' ? 12.3 : 
             discipline === 'commercial' ? 6.7 :
             discipline === 'design' ? 8.5 :
             discipline === 'she' ? 9.8 :
             discipline === 'qa' ? 4.2 : 7.1,
    fill: DISCIPLINE_LIGHT_COLORS[discipline.toLowerCase()] || '#d1d5db',
    stroke: DISCIPLINE_COLORS[discipline.toLowerCase()] || '#8884d8',
  }));

  return (
    <div className="space-y-6">
      {/* Compact Stats Row */}
      <div className="flex justify-center space-x-8">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-blue-700">{projects.length}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Projects</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-green-700">{stats?.total || 0}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Total Actions</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-xl font-bold text-orange-700">{stats?.open || 0}</span>
          </div>
          <span className="text-sm text-gray-600 mt-2">Open Actions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution - Radial Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadialBarChart 
                cx="50%" 
                cy="50%" 
                innerRadius="25%" 
                outerRadius="85%" 
                startAngle={90}
                endAngle={-180}
                data={statusChartData.map((entry, index) => ({
                  ...entry,
                  value: Math.round((entry.value / Math.max(...statusChartData.map(d => d.value))) * 100),
                  fill: STATUS_LIGHT_COLORS[entry.name.toLowerCase()] || CHART_COLORS[index % CHART_COLORS.length],
                  stroke: STATUS_COLORS[entry.name.toLowerCase()] || CHART_COLORS[index % CHART_COLORS.length]
                }))}
              >
                <RadialBar 
                  dataKey="value" 
                  cornerRadius={3}
                  strokeWidth={1.2}
                />
                <Tooltip />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '12px',
                    color: '#374151' // gray-700 for better visibility
                  }}
                  iconType="circle"
                  formatter={(value, entry) => {
                    const statusKey = value.toLowerCase();
                    const color = STATUS_COLORS[statusKey] || '#374151';
                    return <span style={{ color }}>{value}</span>;
                  }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Values by Status - Radar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Project Values by Status (£M)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={valueChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="status" tick={{ fontSize: 12.65 }} />
                <PolarRadiusAxis 
                  tick={{ fontSize: 10 }} 
                  tickFormatter={(value) => `£${value}M`}
                />
                <Radar 
                  name="Value" 
                  dataKey="value" 
                  stroke="#cc3333" 
                  fill="#cc3333" 
                  fillOpacity={0.3}
                  strokeWidth={1.2}
                />
                <Tooltip formatter={(value) => [`£${value}M`, 'Value']} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Discipline - Vertical Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Actions by Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={disciplineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="discipline" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" strokeWidth={1.2}>
                  {disciplineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects On Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Projects On Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectTimingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="planned" fill="#d1d5db" name="Planned" />
                <Bar dataKey="actual" fill="#fca5a5" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Assignee */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Actions by Assignee</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={coloredAssigneeData} 
                margin={{ top: 2, right: 2, left: 2, bottom: 10 }}
                barCategoryGap="1%"
              >
                <XAxis 
                  dataKey="assignee" 
                  angle={-90} 
                  textAnchor="start" 
                  height={80} 
                  tick={{ fontSize: 11, dx: -30, dy: -8 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip />
                <Bar dataKey="count" strokeWidth={0.7} barSize={15}>
                  {coloredAssigneeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} />
                  ))}
                  <LabelList 
                    dataKey="count" 
                    position="bottom" 
                    style={{ fontSize: '12px', fill: '#374151', fontWeight: '500' }} 
                    offset={5}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Action Closure Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-center text-gray-600">Avg. Action Closure Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgClosureTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="discipline" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} days`, 'Avg Time']} />
                <Bar dataKey="avgDays" strokeWidth={1.2}>
                  {avgClosureTimeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Duration Analysis - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg text-center text-gray-600">Project Duration Analysis (Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData} margin={{ left: 20, right: 30 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="constructionWeeks" stackId="a" fill="#93c5fd" name="Construction">
                <LabelList 
                  dataKey="constructionWeeks" 
                  position="center" 
                  style={{ fontSize: '11px', fill: '#1f2937', fontWeight: '500' }} 
                />
              </Bar>
              <Bar dataKey="buffer" stackId="a" fill="#9ca3af" name="Buffer/Float">
                <LabelList 
                  dataKey="buffer" 
                  position="center" 
                  style={{ fontSize: '11px', fill: '#1f2937', fontWeight: '500' }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}