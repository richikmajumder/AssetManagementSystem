import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI, assetsAPI, serviceRequestsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { 
  Package, 
  Users, 
  FileText, 
  ShoppingCart, 
  AlertCircle,
  CheckCircle,
  Clock,
  Wrench,
  ArrowRight,
  Loader2,
  Server,
  Monitor,
  Keyboard,
  Mouse
} from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, description, color = 'blue', href }) => (
  <Card className="card-interactive hover-lift" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold mt-2 text-slate-900">{value}</p>
          {description && (
            <p className="text-xs text-slate-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl bg-${color}-100`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
      {href && (
        <Link to={href} className="inline-flex items-center gap-1 text-sm text-blue-600 mt-4 hover:underline">
          View details <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </CardContent>
  </Card>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { label: 'Active', class: 'status-active' },
    pending: { label: 'Pending', class: 'status-pending' },
    approved: { label: 'Approved', class: 'status-active' },
    rejected: { label: 'Rejected', class: 'status-rejected' },
    service_requested: { label: 'Service Requested', class: 'status-service-requested' },
    work_in_progress: { label: 'In Progress', class: 'status-work-in-progress' },
    resolved: { label: 'Resolved', class: 'status-resolved' },
    unassigned: { label: 'Unassigned', class: 'status-unassigned' },
  };

  const config = statusConfig[status] || { label: status, class: 'bg-slate-100' };

  return (
    <Badge variant="outline" className={`${config.class} text-xs`}>
      {config.label}
    </Badge>
  );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await dashboardAPI.getStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const assetTypes = [
    { key: 'monitor', label: 'Monitors', icon: Monitor },
    { key: 'cpu', label: 'CPUs', icon: Package },
    { key: 'keyboard', label: 'Keyboards', icon: Keyboard },
    { key: 'mouse', label: 'Mice', icon: Mouse },
    { key: 'server', label: 'Servers', icon: Server },
  ];

  return (
    <div className="space-y-6 fade-in" data-testid="admin-dashboard">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
        <p className="text-slate-500 mt-1">Monitor and manage lab inventory</p>
      </div>

      {/* Key Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Users" 
          value={stats?.total_users || 0}
          icon={Users}
          color="blue"
          href="/users"
        />
        <StatCard 
          title="Total Assets" 
          value={stats?.total_assets || 0}
          icon={Package}
          color="emerald"
          href="/assets"
        />
        <StatCard 
          title="Pending Requests" 
          value={(stats?.pending_service_requests || 0) + (stats?.pending_asset_requests || 0)}
          icon={Clock}
          color="amber"
          href="/service-requests"
        />
        <StatCard 
          title="Pending Orders" 
          value={stats?.pending_consumables || 0}
          icon={ShoppingCart}
          color="purple"
          href="/consumables"
        />
      </div>

      {/* Asset Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets by Type</CardTitle>
            <CardDescription>Distribution of lab equipment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {assetTypes.map(({ key, label, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-500" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-lg font-bold text-slate-900">
                    {stats?.asset_by_type?.[key] || 0}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets by Status</CardTitle>
            <CardDescription>Current status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats?.asset_by_status || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <StatusBadge status={status} />
                  <span className="text-lg font-bold text-slate-900">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild data-testid="quick-add-user">
            <Link to="/users?action=add">
              <Users className="w-4 h-4 mr-2" />
              Add User
            </Link>
          </Button>
          <Button asChild variant="outline" data-testid="quick-add-asset">
            <Link to="/assets?action=add">
              <Package className="w-4 h-4 mr-2" />
              Add Asset
            </Link>
          </Button>
          <Button asChild variant="outline" data-testid="quick-view-requests">
            <Link to="/service-requests?status=pending">
              <FileText className="w-4 h-4 mr-2" />
              View Pending Requests
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [assets, setAssets] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, assetsRes, requestsRes] = await Promise.all([
          dashboardAPI.getUserStats(),
          assetsAPI.getMy(),
          serviceRequestsAPI.getMy(),
        ]);
        setStats(statsRes.data);
        setAssets(assetsRes.data);
        setRequests(requestsRes.data);
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const recentRequests = requests.slice(0, 5);

  return (
    <div className="space-y-6 fade-in" data-testid="user-dashboard">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Dashboard</h2>
        <p className="text-slate-500 mt-1">View your assigned assets and requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="My Assets" 
          value={stats?.my_assets || 0}
          icon={Package}
          color="blue"
          href="/my-assets"
        />
        <StatCard 
          title="Service Requests" 
          value={stats?.my_service_requests || 0}
          icon={FileText}
          color="emerald"
          href="/service-requests"
        />
        <StatCard 
          title="Pending" 
          value={stats?.pending_requests || 0}
          icon={Clock}
          color="amber"
        />
        <StatCard 
          title="Consumable Orders" 
          value={stats?.my_consumables || 0}
          icon={ShoppingCart}
          color="purple"
          href="/consumables"
        />
      </div>

      {/* My Assets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">My Assigned Assets</CardTitle>
            <CardDescription>Equipment assigned to you</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/my-assets">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No assets assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {assets.slice(0, 6).map((asset) => (
                <div 
                  key={asset.id} 
                  className="p-4 border border-slate-200 rounded-lg hover:border-blue-200 transition-colors"
                  data-testid={`asset-card-${asset.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{asset.name}</p>
                      <p className="asset-id mt-1">{asset.asset_id}</p>
                    </div>
                    <StatusBadge status={asset.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-2 capitalize">{asset.asset_type}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Requests */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Recent Requests</CardTitle>
            <CardDescription>Your service request history</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/service-requests">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No requests yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  data-testid={`request-${request.id}`}
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{request.description}</p>
                    <p className="request-id mt-1">{request.request_id}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  const { isAdminOrCoAdmin } = useAuth();
  
  return isAdminOrCoAdmin ? <AdminDashboard /> : <UserDashboard />;
};

export default Dashboard;
