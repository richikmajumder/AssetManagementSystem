import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { consumablesAPI, usersAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
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
  ShoppingCart, 
  Plus, 
  Search, 
  MoreVertical, 
  Check, 
  X,
  Receipt,
  Loader2,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', class: 'status-pending' },
    ordered: { label: 'Ordered', class: 'status-active' },
    rejected: { label: 'Rejected', class: 'status-rejected' },
  };
  const c = config[status] || { label: status, class: 'bg-slate-100' };
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const OrderTypeBadge = ({ type }) => {
  const config = {
    admin_order: { label: 'Admin Order', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    reimbursement: { label: 'Reimbursement', class: 'bg-purple-50 text-purple-700 border-purple-200' },
    admin_direct: { label: 'Direct', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  const c = config[type] || config.admin_order;
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const Consumables = () => {
  const { isAdmin, isAdminOrCoAdmin, canRequest } = useAuth();
  const [consumables, setConsumables] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isDirectOpen, setIsDirectOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    quantity: 1,
    description: '',
    order_type: 'admin_order',
    is_collective: false,
    collective_user_ids: [],
    invoice_base64: null,
  });

  const fetchData = async () => {
    try {
      const [consumablesRes, usersRes] = await Promise.all([
        isAdminOrCoAdmin ? consumablesAPI.getAll() : consumablesAPI.getMy(),
        isAdminOrCoAdmin ? usersAPI.getAll() : Promise.resolve({ data: [] }),
      ]);
      setConsumables(consumablesRes.data);
      setUsers(usersRes.data.filter(u => u.role === 'user'));
    } catch (err) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdminOrCoAdmin]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Please upload a PDF file');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, invoice_base64: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.name || !formData.quantity) {
      toast.error('Please fill required fields');
      return;
    }

    if (formData.order_type === 'reimbursement' && !formData.invoice_base64) {
      toast.error('Please upload invoice for reimbursement');
      return;
    }

    setIsSubmitting(true);
    try {
      await consumablesAPI.create(formData);
      toast.success('Order request submitted');
      setIsRequestOpen(false);
      setFormData({ 
        name: '', quantity: 1, description: '', order_type: 'admin_order', 
        is_collective: false, collective_user_ids: [], invoice_base64: null 
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectAdd = async () => {
    if (!formData.name || !formData.quantity) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await consumablesAPI.createDirect(formData);
      toast.success('Consumable added');
      setIsDirectOpen(false);
      setFormData({ 
        name: '', quantity: 1, description: '', order_type: 'admin_order', 
        is_collective: false, collective_user_ids: [], invoice_base64: null 
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add consumable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await consumablesAPI.update(id, { status });
      toast.success(`Order ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update order');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order?')) return;
    try {
      await consumablesAPI.delete(id);
      toast.success('Order deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete order');
    }
  };

  const filteredConsumables = consumables.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="consumables-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Consumables & Stationery</h2>
          <p className="text-slate-500 mt-1">Manage consumable orders and reimbursements</p>
        </div>
        
        <div className="flex gap-2">
          {isAdminOrCoAdmin && (
            <Dialog open={isDirectOpen} onOpenChange={setIsDirectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="direct-add-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Direct Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Consumable Directly</DialogTitle>
                  <DialogDescription>Add a consumable without request</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Whiteboard Markers"
                      data-testid="direct-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input 
                        type="number"
                        min="1"
                        value={formData.quantity} 
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        data-testid="direct-quantity"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Optional details"
                      data-testid="direct-description"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="direct_collective"
                      checked={formData.is_collective}
                      onCheckedChange={(checked) => setFormData({...formData, is_collective: checked})}
                    />
                    <Label htmlFor="direct_collective" className="text-sm">Collective order (for multiple users)</Label>
                  </div>
                  {formData.is_collective && (
                    <div className="space-y-2">
                      <Label>Select Users</Label>
                      <Select 
                        value={formData.collective_user_ids[0] || ''} 
                        onValueChange={(v) => setFormData({...formData, collective_user_ids: [v]})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDirectOpen(false)}>Cancel</Button>
                  <Button onClick={handleDirectAdd} disabled={isSubmitting} data-testid="confirm-direct-add">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Consumable
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {canRequest && (
            <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
              <DialogTrigger asChild>
                <Button data-testid="request-consumable-btn">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Request Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Consumable/Stationery</DialogTitle>
                  <DialogDescription>Submit an order request or reimbursement</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Order Type *</Label>
                    <Select 
                      value={formData.order_type} 
                      onValueChange={(v) => setFormData({...formData, order_type: v})}
                    >
                      <SelectTrigger data-testid="order-type-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin_order">Request Admin to Order</SelectItem>
                        <SelectItem value="reimbursement">Reimbursement (I already bought)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Item Name *</Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Sticky Notes, Pens"
                      data-testid="request-name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input 
                        type="number"
                        min="1"
                        value={formData.quantity} 
                        onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 1})}
                        data-testid="request-quantity"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Why do you need this?"
                      data-testid="request-description"
                    />
                  </div>
                  {formData.order_type === 'reimbursement' && (
                    <div className="space-y-2">
                      <Label>Invoice PDF *</Label>
                      <Input 
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        data-testid="invoice-upload"
                      />
                      {formData.invoice_base64 && (
                        <p className="text-xs text-green-600">Invoice uploaded</p>
                      )}
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is_collective"
                      checked={formData.is_collective}
                      onCheckedChange={(checked) => setFormData({...formData, is_collective: checked})}
                    />
                    <Label htmlFor="is_collective" className="text-sm">Collective order (for multiple users)</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsRequestOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateRequest} disabled={isSubmitting} data-testid="submit-request">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search orders..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-consumables"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-consumable-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Item Name</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredConsumables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filteredConsumables.map((item) => (
                  <TableRow key={item.id} data-testid={`consumable-${item.id}`}>
                    <TableCell className="font-mono text-xs text-blue-600 font-bold">
                      {item.request_id}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell><OrderTypeBadge type={item.order_type} /></TableCell>
                    <TableCell><StatusBadge status={item.status} /></TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {format(new Date(item.created_at), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      {isAdminOrCoAdmin && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`consumable-actions-${item.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {item.status === 'pending' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'ordered')}>
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Mark Ordered
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(item.id, 'rejected')}>
                                  <X className="w-4 h-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
                              </>
                            )}
                            {item.invoice_base64 && (
                              <DropdownMenuItem onClick={() => window.open(item.invoice_base64, '_blank')}>
                                <Receipt className="w-4 h-4 mr-2" />
                                View Invoice
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(item.id)}
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
    </div>
  );
};

export default Consumables;
