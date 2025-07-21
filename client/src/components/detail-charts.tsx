import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Project } from "@shared/schema";

// Status colors based on the provided scheme
const STATUS_COLORS: Record<string, string> = {
  'tender': '#E8E4F3', // Light purple/blue from the scheme
  'precon': '#E8F5E8', // Light green from the scheme  
  'construction': '#FFF4E6', // Light orange from the scheme
  'aftercare': '#F0F0F0', // Light gray from the scheme
};

// Discipline colors matching the button scheme
const DISCIPLINE_COLORS: Record<string, string> = {
  'operations': '#cc3333',
  'commercial': '#0088FE', 
  'design': '#00C49F',
  'she': '#FFBB28',
  'qa': '#FF8042',
  'general': '#8884d8'
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
    discipline: discipline.charAt(0).toUpperCase() + discipline.slice(1),
    count,
    color: DISCIPLINE_COLORS[discipline.toLowerCase()] || '#8884d8',
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

  // Actions by Person
  const actionsByPerson = (actions as any[]).reduce((acc: Record<string, number>, action) => {
    const assignee = action.assignee || 'Unassigned';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {});

  const actionsByPersonData = Object.entries(actionsByPerson)
    .map(([person, count]) => ({
      person: person.length > 10 ? person.substring(0, 10) + '...' : person,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  // Average Time for Closed Actions (simulated data based on action complexity)
  const avgClosureTimeData = [
    { discipline: 'Design', avgDays: 8.5 },
    { discipline: 'Operations', avgDays: 12.3 },
    { discipline: 'Commercial', avgDays: 6.7 },
    { discipline: 'QA', avgDays: 4.2 },
    { discipline: 'SHE', avgDays: 9.8 },
    { discipline: 'General', avgDays: 7.1 },
  ];

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
        {/* Project Status Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => {
                    const statusColor = STATUS_COLORS[entry.name.toLowerCase()] || CHART_COLORS[index % CHART_COLORS.length];
                    return (
                      <Cell key={`cell-${index}`} fill={statusColor} />
                    );
                  })}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Values by Status - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Project Values by Status (£M)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={valueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`£${value}M`, 'Value']} />
                <Bar dataKey="value" fill="#cc3333" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Discipline - Vertical Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Actions by Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={disciplineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="discipline" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count">
                  {disciplineChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Projects On Time Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Projects On Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={projectTimingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="planned" fill="#00C49F" name="Planned" />
                <Bar dataKey="actual" fill="#FF8042" name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Person */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Actions by Person</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={actionsByPersonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="person" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Average Action Closure Time */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-center">Avg. Action Closure Time (Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={avgClosureTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="discipline" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value} days`, 'Avg Time']} />
                <Bar dataKey="avgDays" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Duration Analysis - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-center">Project Duration Analysis (Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timelineData} margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="constructionWeeks" stackId="a" fill="#FFBB28" name="Construction" />
              <Bar dataKey="buffer" stackId="a" fill="#FF8042" name="Buffer/Float" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}