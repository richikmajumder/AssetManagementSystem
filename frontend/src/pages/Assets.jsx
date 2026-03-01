import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { assetsAPI, usersAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '../components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Textarea } from '../components/ui/textarea';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  UserPlus,
  Loader2,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: { label: 'Active', class: 'status-active' },
    service_requested: { label: 'Service Requested', class: 'status-service-requested' },
    work_in_progress: { label: 'In Progress', class: 'status-work-in-progress' },
    inactive: { label: 'Inactive', class: 'status-rejected' },
    unassigned: { label: 'Unassigned', class: 'status-unassigned' },
    coming_soon: { label: 'Coming Soon', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const config = statusConfig[status] || { label: status, class: 'bg-slate-100' };
  return <Badge variant="outline" className={`${config.class} text-xs`}>{config.label}</Badge>;
};

const ASSET_TYPES = [
  { value: 'chair', label: 'Chair' },
  { value: 'cubicle', label: 'Cubicle' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'cpu', label: 'CPU' },
  { value: 'mouse', label: 'Mouse' },
  { value: 'keyboard', label: 'Keyboard' },
  { value: 'ups', label: 'UPS' },
  { value: 'adapter', label: 'Adapter' },
  { value: 'wifi_adapter', label: 'WiFi Adapter' },
  { value: 'hdmi_cable', label: 'HDMI Cable' },
  { value: 'lan_cable', label: 'LAN Cable' },
  { value: 'printer', label: 'Printer' },
  { value: 'server', label: 'Server' },
  { value: 'locker', label: 'Locker' },
  { value: 'whiteboard', label: 'Whiteboard' },
  { value: 'extension', label: 'Extension Board' },
  { value: 'book', label: 'Book' },
  { value: 'storage', label: 'Storage (Pen Drive, HDD, etc.)' },
  { value: 'miscellaneous', label: 'Miscellaneous' },
];

const Assets = () => {
  const { isAdmin, isAdminOrCoAdmin } = useAuth();
  const [assets, setAssets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    asset_type: '',
    name: '',
    description: '',
    custom_asset_id: '',
    is_shared: false,
    is_returnable: false,
    assigned_user_ids: [],
    status: 'unassigned',
  });

  const [assignData, setAssignData] = useState({
    user_id: '',
    asset_type: '',
  });

  const [bulkAssignData, setBulkAssignData] = useState({
    asset_id: '',
    user_ids: [],
  });

  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [assetsRes, usersRes] = await Promise.all([
        assetsAPI.getAll({ exclude_consumables: true }),
        usersAPI.getAll(),
      ]);
      setAssets(assetsRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'user'));
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAsset = async () => {
    if (!formData.asset_type || !formData.name) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await assetsAPI.create(formData);
      toast.success('Asset created successfully');
      setIsAddOpen(false);
      setFormData({ asset_type: '', name: '', description: '', custom_asset_id: '', is_shared: false, is_returnable: false, assigned_user_ids: [], status: 'unassigned' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAsset = async () => {
    if (!selectedAsset) return;

    setIsSubmitting(true);
    try {
      await assetsAPI.update(selectedAsset.id, {
        name: formData.name,
        description: formData.description,
        custom_asset_id: formData.custom_asset_id,
        is_shared: formData.is_shared,
        is_returnable: formData.is_returnable,
        status: formData.status,
        assigned_user_ids: formData.assigned_user_ids,
      });
      toast.success('Asset updated successfully');
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkAssign = async (action) => {
    if (!bulkAssignData.asset_id || bulkAssignData.user_ids.length === 0) {
      toast.error('Please select asset and users');
      return;
    }

    setIsSubmitting(true);
    try {
      await assetsAPI.bulkAssign({
        asset_id: bulkAssignData.asset_id,
        user_ids: bulkAssignData.user_ids,
        action: action,
      });
      toast.success(`Users ${action}ed successfully`);
      setIsBulkAssignOpen(false);
      setBulkAssignData({ asset_id: '', user_ids: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAsset = async (asset) => {
    if (!window.confirm(`Delete asset ${asset.asset_id}?`)) return;

    try {
      await assetsAPI.delete(asset.id);
      toast.success('Asset deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const handleAssignAsset = async () => {
    if (!assignData.user_id || !assignData.asset_type) {
      toast.error('Please select user and asset type');
      return;
    }

    setIsSubmitting(true);
    try {
      await assetsAPI.assign(assignData);
      toast.success('Asset assigned successfully');
      setIsAssignOpen(false);
      setAssignData({ user_id: '', asset_type: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (asset) => {
    setSelectedAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description || '',
      custom_asset_id: asset.custom_asset_id || '',
      is_shared: asset.is_shared,
      is_returnable: asset.is_returnable,
      status: asset.status,
      assigned_user_ids: asset.assigned_user_ids || [],
    });
    setIsEditOpen(true);
  };

  const openBulkAssignDialog = (asset) => {
    setBulkAssignData({
      asset_id: asset.id,
      user_ids: asset.assigned_user_ids || [],
    });
    setSelectedAsset(asset);
    setIsBulkAssignOpen(true);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.custom_asset_id && asset.custom_asset_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getAllUsers = () => {
    return users;
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="assets-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Assets</h2>
          <p className="text-slate-500 mt-1">Manage lab equipment and inventory</p>
        </div>
        
        {isAdminOrCoAdmin && (
          <div className="flex gap-2">
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="assign-asset-btn">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Assign Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Asset to User</DialogTitle>
                  <DialogDescription>
                    Assign an existing or new asset to a user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>User</Label>
                    <Select value={assignData.user_id} onValueChange={(v) => setAssignData({...assignData, user_id: v})}>
                      <SelectTrigger data-testid="assign-user-select">
                        <SelectValue placeholder="Select user" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map(user => (
                          <SelectItem key={user.id} value={user.id}>{user.name} ({user.roll_no})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Type</Label>
                    <Select value={assignData.asset_type} onValueChange={(v) => setAssignData({...assignData, asset_type: v})}>
                      <SelectTrigger data-testid="assign-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
                  <Button onClick={handleAssignAsset} disabled={isSubmitting} data-testid="confirm-assign-btn">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Assign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button data-testid="add-asset-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Asset</DialogTitle>
                  <DialogDescription>
                    Create a new asset in the inventory
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Asset Type *</Label>
                    <Select value={formData.asset_type} onValueChange={(v) => setFormData({...formData, asset_type: v})}>
                      <SelectTrigger data-testid="add-type-select">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Name *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Asset name"
                      data-testid="add-name-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Optional description"
                      data-testid="add-description-input"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_shared"
                        checked={formData.is_shared}
                        onCheckedChange={(checked) => setFormData({...formData, is_shared: checked})}
                      />
                      <Label htmlFor="is_shared" className="text-sm">Shared Asset</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="is_returnable"
                        checked={formData.is_returnable}
                        onCheckedChange={(checked) => setFormData({...formData, is_returnable: checked})}
                      />
                      <Label htmlFor="is_returnable" className="text-sm">Returnable</Label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddAsset} disabled={isSubmitting} data-testid="confirm-add-btn">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Asset
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search assets..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-assets-input"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-type-select">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {ASSET_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-status-select">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="service_requested">Service Requested</SelectItem>
                <SelectItem value="work_in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset ID</TableHead>
                <TableHead>Custom ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => (
                  <TableRow key={asset.id} data-testid={`asset-row-${asset.id}`}>
                    <TableCell className="font-mono text-xs text-slate-500">{asset.asset_id}</TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-600">{asset.custom_asset_id || '-'}</TableCell>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell className="capitalize">{asset.asset_type.replace('_', ' ')}</TableCell>
                    <TableCell><StatusBadge status={asset.status} /></TableCell>
                    <TableCell>
                      {asset.assigned_user_ids?.length > 0 
                        ? asset.assigned_user_ids.map(uid => getUserName(uid)).join(', ')
                        : <span className="text-slate-400">Unassigned</span>
                      }
                    </TableCell>
                    <TableCell>
                      {isAdminOrCoAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`asset-actions-${asset.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(asset)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {asset.is_shared && (
                              <DropdownMenuItem onClick={() => openBulkAssignDialog(asset)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Manage Users
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem 
                                className="text-red-600" 
                                onClick={() => handleDeleteAsset(asset)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>Update asset details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                data-testid="edit-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                data-testid="edit-description-input"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                <SelectTrigger data-testid="edit-status-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit_is_shared"
                  checked={formData.is_shared}
                  onCheckedChange={(checked) => setFormData({...formData, is_shared: checked})}
                />
                <Label htmlFor="edit_is_shared" className="text-sm">Shared Asset</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit_is_returnable"
                  checked={formData.is_returnable}
                  onCheckedChange={(checked) => setFormData({...formData, is_returnable: checked})}
                />
                <Label htmlFor="edit_is_returnable" className="text-sm">Returnable</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditAsset} disabled={isSubmitting} data-testid="confirm-edit-btn">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assets;
