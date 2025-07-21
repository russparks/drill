import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Project } from "@shared/schema";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#cc3333', '#8884d8'];

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

  // Monthly Project Starts
  const monthlyStarts = projects
    .filter(p => p.startOnSiteDate)
    .reduce((acc: Record<string, number>, project) => {
      const month = new Date(project.startOnSiteDate!).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

  const monthlyStartsData = Object.entries(monthlyStarts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stats Cards */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Open Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats?.open || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
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
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Values by Status - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Values by Status (£M)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip formatter={(value) => [`£${value}M`, 'Value']} />
                <Bar dataKey="value" fill="#cc3333" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions by Discipline - Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Actions by Discipline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={disciplineChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="discipline" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Project Starts - Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Start Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyStartsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#00C49F" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Project Duration Analysis - Stacked Bar */}
      <Card>
        <CardHeader>
          <CardTitle>Project Duration Analysis (Weeks)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={timelineData} margin={{ left: 20, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
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