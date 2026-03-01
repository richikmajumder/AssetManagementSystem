import React, { useState, useEffect } from 'react';
import { activityLogsAPI, usersAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  History, 
  Search, 
  Loader2,
  User,
  Package,
  FileText,
  ShoppingCart
} from 'lucide-react';
import { format } from 'date-fns';

const ActionBadge = ({ action }) => {
  const config = {
    CREATE_USER: { label: 'Create User', class: 'bg-green-50 text-green-700 border-green-200' },
    UPDATE_USER: { label: 'Update User', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    DELETE_USER: { label: 'Delete User', class: 'bg-red-50 text-red-700 border-red-200' },
    CHANGE_PASSWORD: { label: 'Password Change', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    CREATE_ASSET: { label: 'Create Asset', class: 'bg-green-50 text-green-700 border-green-200' },
    UPDATE_ASSET: { label: 'Update Asset', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    DELETE_ASSET: { label: 'Delete Asset', class: 'bg-red-50 text-red-700 border-red-200' },
    ASSIGN_ASSET: { label: 'Assign Asset', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    UPDATE_SERVICE_REQUEST: { label: 'Service Request', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    UPDATE_ASSET_REQUEST: { label: 'Asset Request', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    CREATE_CONSUMABLE: { label: 'Add Consumable', class: 'bg-green-50 text-green-700 border-green-200' },
    UPDATE_CONSUMABLE: { label: 'Update Consumable', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    DELETE_CONSUMABLE: { label: 'Delete Consumable', class: 'bg-red-50 text-red-700 border-red-200' },
  };
  const c = config[action] || { label: action, class: 'bg-slate-100 text-slate-700' };
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const EntityIcon = ({ type }) => {
  const icons = {
    user: User,
    asset: Package,
    service_request: FileText,
    asset_request: FileText,
    consumable: ShoppingCart,
  };
  const Icon = icons[type] || FileText;
  return <Icon className="w-4 h-4 text-slate-400" />;
};

const RoleBadge = ({ role }) => {
  const config = {
    admin: { label: 'Admin', class: 'bg-blue-100 text-blue-700' },
    co_admin: { label: 'Co-Admin', class: 'bg-purple-100 text-purple-700' },
    user: { label: 'User', class: 'bg-slate-100 text-slate-700' },
  };
  const c = config[role] || config.user;
  return <Badge className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState('all');
  const [filterEntity, setFilterEntity] = useState('all');

  const fetchData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        activityLogsAPI.getAll({ limit: 200 }),
        usersAPI.getAll(true),
      ]);
      setLogs(logsRes.data);
      setUsers(usersRes.data.filter(u => u.role !== 'user'));
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser === 'all' || log.user_id === filterUser;
    const matchesEntity = filterEntity === 'all' || log.entity_type === filterEntity;
    return matchesSearch && matchesUser && matchesEntity;
  });

  const formatDetails = (details) => {
    if (!details || Object.keys(details).length === 0) return '-';
    
    const entries = Object.entries(details)
      .filter(([key]) => !['updated_at', 'created_at', 'version'].includes(key))
      .slice(0, 3);
    
    return entries.map(([key, value]) => {
      const displayValue = typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value).slice(0, 30);
      return `${key.replace(/_/g, ' ')}: ${displayValue}`;
    }).join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="activity-logs-page">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Activity Logs</h2>
        <p className="text-slate-500 mt-1">Track all administrative actions</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search logs..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-logs"
              />
            </div>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-full sm:w-48" data-testid="filter-user">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-entity">
                <SelectValue placeholder="Entity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="asset">Assets</SelectItem>
                <SelectItem value="service_request">Service Requests</SelectItem>
                <SelectItem value="asset_request">Asset Requests</SelectItem>
                <SelectItem value="consumable">Consumables</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">Timestamp</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead className="max-w-xs">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} data-testid={`log-${log.id}`}>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{log.user_name}</span>
                        <RoleBadge role={log.user_role} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <ActionBadge action={log.action} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <EntityIcon type={log.entity_type} />
                        <span className="text-sm capitalize">{log.entity_type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-slate-600">
                      {formatDetails(log.details)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogs;
