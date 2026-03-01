import React, { useState, useEffect } from 'react';
import { assetsAPI, serviceRequestsAPI } from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import { 
  Package, 
  Wrench, 
  RotateCcw,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

const StatusBadge = ({ status }) => {
  const config = {
    active: { label: 'Active', class: 'status-active' },
    service_requested: { label: 'Service Requested', class: 'status-service-requested' },
    work_in_progress: { label: 'In Progress', class: 'status-work-in-progress' },
    inactive: { label: 'Inactive', class: 'status-rejected' },
  };
  const c = config[status] || { label: status, class: 'bg-slate-100' };
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const MyAssets = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isServiceOpen, setIsServiceOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [serviceForm, setServiceForm] = useState({
    description: '',
    is_generic: false,
    remarks: '',
  });

  const fetchAssets = async () => {
    try {
      const response = await assetsAPI.getMy();
      setAssets(response.data);
    } catch (err) {
      toast.error('Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleServiceRequest = async () => {
    if (!serviceForm.description) {
      toast.error('Please describe the issue');
      return;
    }

    setIsSubmitting(true);
    try {
      await serviceRequestsAPI.create({
        asset_id: selectedAsset.id,
        description: serviceForm.description,
        is_generic: serviceForm.is_generic,
        remarks: serviceForm.remarks,
      });
      toast.success('Service request submitted');
      setIsServiceOpen(false);
      setServiceForm({ description: '', is_generic: false, remarks: '' });
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnRequest = async (asset) => {
    if (!window.confirm(`Request to return ${asset.name}?`)) return;

    try {
      await assetsAPI.returnAsset(asset.id);
      toast.success('Return request submitted');
      fetchAssets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to submit return request');
    }
  };

  const openServiceDialog = (asset) => {
    setSelectedAsset(asset);
    setIsServiceOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="my-assets-page">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">My Assets</h2>
        <p className="text-slate-500 mt-1">View and manage your assigned equipment</p>
      </div>

      {assets.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No assets assigned yet</p>
            <p className="text-slate-400 text-sm mt-1">Your assigned equipment will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card 
              key={asset.id} 
              className="card-interactive hover-lift"
              data-testid={`my-asset-${asset.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{asset.name}</CardTitle>
                    <CardDescription className="font-mono text-xs mt-1">
                      {asset.asset_id}
                    </CardDescription>
                  </div>
                  <StatusBadge status={asset.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="capitalize">{asset.asset_type.replace('_', ' ')}</span>
                  {asset.is_shared && (
                    <Badge variant="outline" className="text-xs">Shared</Badge>
                  )}
                  {asset.is_returnable && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700">Returnable</Badge>
                  )}
                </div>
                
                {asset.description && (
                  <p className="text-sm text-slate-500">{asset.description}</p>
                )}

                <div className="flex gap-2 pt-2">
                  {asset.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => openServiceDialog(asset)}
                      data-testid={`service-btn-${asset.id}`}
                    >
                      <Wrench className="w-4 h-4 mr-2" />
                      Report Issue
                    </Button>
                  )}
                  
                  {asset.status === 'service_requested' && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <AlertCircle className="w-4 h-4" />
                      Service request pending
                    </div>
                  )}

                  {asset.is_returnable && asset.status === 'active' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReturnRequest(asset)}
                      data-testid={`return-btn-${asset.id}`}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Return
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Request Dialog */}
      <Dialog open={isServiceOpen} onOpenChange={setIsServiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Issue</DialogTitle>
            <DialogDescription>
              Report a problem with {selectedAsset?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Issue Description *</Label>
              <Textarea 
                value={serviceForm.description} 
                onChange={(e) => setServiceForm({...serviceForm, description: e.target.value})}
                placeholder="Describe the issue in detail"
                rows={4}
                data-testid="service-description"
              />
            </div>
            <div className="space-y-2">
              <Label>Additional Remarks</Label>
              <Textarea 
                value={serviceForm.remarks} 
                onChange={(e) => setServiceForm({...serviceForm, remarks: e.target.value})}
                placeholder="Any additional information"
                rows={2}
                data-testid="service-remarks"
              />
            </div>
            {selectedAsset?.is_shared && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_generic"
                  checked={serviceForm.is_generic}
                  onCheckedChange={(checked) => setServiceForm({...serviceForm, is_generic: checked})}
                />
                <Label htmlFor="is_generic" className="text-sm">
                  This is a generic issue (affects all users)
                </Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceOpen(false)}>Cancel</Button>
            <Button onClick={handleServiceRequest} disabled={isSubmitting} data-testid="submit-service">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyAssets;
