import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { serviceRequestsAPI, assetsAPI, assetRequestsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
  FileText, 
  Plus, 
  Search, 
  MoreVertical, 
  Check, 
  X,
  Wrench,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

const StatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', class: 'status-pending' },
    approved: { label: 'Approved', class: 'status-active' },
    rejected: { label: 'Rejected', class: 'status-rejected' },
    resolved: { label: 'Resolved', class: 'status-resolved' },
    work_in_progress: { label: 'In Progress', class: 'status-work-in-progress' },
  };
  const c = config[status] || { label: status, class: 'bg-slate-100' };
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const ServiceRequests = () => {
  const { isAdminOrCoAdmin, user, canRequest } = useAuth();
  const [serviceRequests, setServiceRequests] = useState([]);
  const [assetRequests, setAssetRequests] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('service');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssetRequestOpen, setIsAssetRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    asset_id: '',
    description: '',
    is_generic: false,
    remarks: '',
    images: [],
  });

  const [assetRequestForm, setAssetRequestForm] = useState({
    asset_type: '',
    description: '',
    quantity: 1,
  });

  const [actionRemarks, setActionRemarks] = useState('');

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files allowed');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const fetchData = async () => {
    try {
      const [srRes, arRes] = await Promise.all([
        isAdminOrCoAdmin ? serviceRequestsAPI.getAll() : serviceRequestsAPI.getMy(),
        isAdminOrCoAdmin ? assetRequestsAPI.getAll() : assetRequestsAPI.getMy(),
      ]);
      setServiceRequests(srRes.data);
      setAssetRequests(arRes.data);

      if (canRequest) {
        const assetsRes = await assetsAPI.getMy();
        setMyAssets(assetsRes.data);
      }
    } catch (err) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdminOrCoAdmin, canRequest]);

  const handleCreateServiceRequest = async () => {
    if (!formData.asset_id || !formData.description) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await serviceRequestsAPI.create(formData);
      toast.success('Service request created');
      setIsCreateOpen(false);
      setFormData({ asset_id: '', description: '', is_generic: false, remarks: '', images: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAssetRequest = async () => {
    if (!assetRequestForm.asset_type || !assetRequestForm.description) {
      toast.error('Please fill required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await assetRequestsAPI.create(assetRequestForm);
      toast.success('Asset request submitted');
      setIsAssetRequestOpen(false);
      setAssetRequestForm({ asset_type: '', description: '', quantity: 1 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateServiceRequest = async (id, status) => {
    setIsSubmitting(true);
    try {
      await serviceRequestsAPI.update(id, { status, admin_remarks: actionRemarks });
      toast.success(`Request ${status}`);
      setSelectedRequest(null);
      setActionRemarks('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveRequest = async (id) => {
    try {
      await serviceRequestsAPI.resolve(id);
      toast.success('Request marked as resolved');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to resolve request');
    }
  };

  const handleUpdateAssetRequest = async (id, status) => {
    setIsSubmitting(true);
    try {
      await assetRequestsAPI.update(id, status, actionRemarks);
      toast.success(`Request ${status}`);
      setActionRemarks('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServiceRequests = serviceRequests.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAssetRequests = assetRequests.filter(req => {
    const matchesSearch = req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.request_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
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
    <div className="space-y-6 fade-in" data-testid="service-requests-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Requests</h2>
          <p className="text-slate-500 mt-1">Manage service and asset requests</p>
        </div>
        
        {canRequest && (
          <div className="flex gap-2">
            <Dialog open={isAssetRequestOpen} onOpenChange={setIsAssetRequestOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="request-asset-btn">
                  <Plus className="w-4 h-4 mr-2" />
                  Request Asset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request New Asset</DialogTitle>
                  <DialogDescription>Request a new item to be assigned</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Asset Type *</Label>
                    <Select 
                      value={assetRequestForm.asset_type} 
                      onValueChange={(v) => setAssetRequestForm({...assetRequestForm, asset_type: v})}
                    >
                      <SelectTrigger data-testid="asset-request-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pen_drive">Pen Drive</SelectItem>
                        <SelectItem value="book">Book</SelectItem>
                        <SelectItem value="monitor">Monitor</SelectItem>
                        <SelectItem value="keyboard">Keyboard</SelectItem>
                        <SelectItem value="mouse">Mouse</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea 
                      value={assetRequestForm.description} 
                      onChange={(e) => setAssetRequestForm({...assetRequestForm, description: e.target.value})}
                      placeholder="Describe what you need and why"
                      data-testid="asset-request-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity</Label>
                    <Input 
                      type="number"
                      min="1"
                      value={assetRequestForm.quantity} 
                      onChange={(e) => setAssetRequestForm({...assetRequestForm, quantity: parseInt(e.target.value) || 1})}
                      data-testid="asset-request-quantity"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAssetRequestOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateAssetRequest} disabled={isSubmitting} data-testid="submit-asset-request">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="create-service-request-btn">
                  <Wrench className="w-4 h-4 mr-2" />
                  Service Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Service Request</DialogTitle>
                  <DialogDescription>Report an issue with your assigned asset</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Asset *</Label>
                    <Select 
                      value={formData.asset_id} 
                      onValueChange={(v) => setFormData({...formData, asset_id: v})}
                    >
                      <SelectTrigger data-testid="service-request-asset">
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {myAssets.map(asset => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} ({asset.asset_id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Description *</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe the issue in detail"
                      data-testid="service-request-description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Additional Remarks</Label>
                    <Textarea 
                      value={formData.remarks} 
                      onChange={(e) => setFormData({...formData, remarks: e.target.value})}
                      placeholder="Any additional information"
                      data-testid="service-request-remarks"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="is_generic"
                      checked={formData.is_generic}
                      onCheckedChange={(checked) => setFormData({...formData, is_generic: checked})}
                    />
                    <Label htmlFor="is_generic" className="text-sm">
                      Generic issue (affects all users of shared asset)
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateServiceRequest} disabled={isSubmitting} data-testid="submit-service-request">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Submit Request
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="service" data-testid="service-tab">
            Service Requests ({serviceRequests.length})
          </TabsTrigger>
          <TabsTrigger value="asset" data-testid="asset-tab">
            Asset Requests ({assetRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  placeholder="Search requests..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  data-testid="search-requests-input"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40" data-testid="filter-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests Table */}
        <TabsContent value="service">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServiceRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No service requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServiceRequests.map((request) => (
                      <TableRow key={request.id} data-testid={`service-request-${request.id}`}>
                        <TableCell className="font-mono text-xs text-blue-600 font-bold">
                          {request.request_id}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                        <TableCell>
                          {request.is_generic ? (
                            <Badge variant="outline" className="text-xs">Generic</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs bg-slate-50">Personal</Badge>
                          )}
                        </TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" data-testid={`service-actions-${request.id}`}>
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {isAdminOrCoAdmin && request.status === 'pending' && (
                                <>
                                  <DropdownMenuItem onClick={() => handleUpdateServiceRequest(request.id, 'approved')}>
                                    <Check className="w-4 h-4 mr-2 text-green-600" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleUpdateServiceRequest(request.id, 'rejected')}>
                                    <X className="w-4 h-4 mr-2 text-red-600" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              {(request.status === 'approved' || request.status === 'work_in_progress') && (
                                <DropdownMenuItem onClick={() => handleResolveRequest(request.id)}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Mark Resolved
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Asset Requests Table */}
        <TabsContent value="asset">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request ID</TableHead>
                    <TableHead>Asset Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssetRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No asset requests found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssetRequests.map((request) => (
                      <TableRow key={request.id} data-testid={`asset-request-${request.id}`}>
                        <TableCell className="font-mono text-xs text-blue-600 font-bold">
                          {request.request_id}
                        </TableCell>
                        <TableCell className="capitalize">{request.asset_type.replace('_', ' ')}</TableCell>
                        <TableCell className="max-w-xs truncate">{request.description}</TableCell>
                        <TableCell>{request.quantity}</TableCell>
                        <TableCell><StatusBadge status={request.status} /></TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          {isAdminOrCoAdmin && request.status === 'pending' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" data-testid={`asset-request-actions-${request.id}`}>
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleUpdateAssetRequest(request.id, 'approved')}>
                                  <Check className="w-4 h-4 mr-2 text-green-600" />
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateAssetRequest(request.id, 'rejected')}>
                                  <X className="w-4 h-4 mr-2 text-red-600" />
                                  Reject
                                </DropdownMenuItem>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceRequests;
