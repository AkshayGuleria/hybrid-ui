import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import './Analytics.css';

function Analytics() {
  // Sample data for bar chart - Monthly Revenue
  const revenueData = [
    { month: 'Jan', revenue: 4200, expenses: 2400 },
    { month: 'Feb', revenue: 5300, expenses: 2800 },
    { month: 'Mar', revenue: 6100, expenses: 3200 },
    { month: 'Apr', revenue: 5800, expenses: 2900 },
    { month: 'May', revenue: 7200, expenses: 3500 },
    { month: 'Jun', revenue: 8100, expenses: 3800 },
  ];

  // Sample data for bar chart - User Growth
  const userGrowthData = [
    { month: 'Jan', users: 1200 },
    { month: 'Feb', users: 1850 },
    { month: 'Mar', users: 2400 },
    { month: 'Apr', users: 3100 },
    { month: 'May', users: 3800 },
    { month: 'Jun', users: 4500 },
  ];

  // Sample data for doughnut chart - Traffic Sources
  const trafficSourcesData = [
    { name: 'Organic Search', value: 3500, color: '#667eea' },
    { name: 'Direct', value: 2800, color: '#764ba2' },
    { name: 'Social Media', value: 2100, color: '#f093fb' },
    { name: 'Referral', value: 1600, color: '#4facfe' },
    { name: 'Email', value: 1200, color: '#43e97b' },
  ];

  // Sample data for doughnut chart - Product Categories
  const productCategoriesData = [
    { name: 'Electronics', value: 4500, color: '#667eea' },
    { name: 'Clothing', value: 3200, color: '#f093fb' },
    { name: 'Home & Garden', value: 2800, color: '#4facfe' },
    { name: 'Sports', value: 1900, color: '#43e97b' },
    { name: 'Books', value: 1600, color: '#f5576c' },
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>Analytics Dashboard</h1>
        <p>Track your performance metrics and insights</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📈
          </div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">$37.8K</p>
            <span className="stat-change positive">+12.5%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👥
          </div>
          <div className="stat-content">
            <h3>Active Users</h3>
            <p className="stat-value">4,500</p>
            <span className="stat-change positive">+18.2%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            🛒
          </div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">1,234</p>
            <span className="stat-change positive">+8.7%</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            💰
          </div>
          <div className="stat-content">
            <h3>Avg. Order Value</h3>
            <p className="stat-value">$128</p>
            <span className="stat-change negative">-2.3%</span>
          </div>
        </div>
      </div>

      {/* Bar Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#667eea" name="Revenue" />
              <Bar dataKey="expenses" fill="#f5576c" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" fill="#4facfe" name="Users" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Doughnut Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h2>Traffic Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={trafficSourcesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(entry) => entry.name}
              >
                {trafficSourcesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Product Categories</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={productCategoriesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={(entry) => entry.name}
              >
                {productCategoriesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
