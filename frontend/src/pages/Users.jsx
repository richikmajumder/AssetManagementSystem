import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../lib/api';
import { Card, CardContent } from '../components/ui/card';
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
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '../components/ui/dropdown-menu';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Shield,
  ShieldOff,
  Ban,
  Flag,
  FlagOff,
  Key,
  Loader2,
  UserX,
  UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

const RoleBadge = ({ role }) => {
  const config = {
    admin: { label: 'Admin', class: 'bg-blue-100 text-blue-700 border-blue-200' },
    co_admin: { label: 'Co-Admin', class: 'bg-purple-100 text-purple-700 border-purple-200' },
    user: { label: 'User', class: 'bg-slate-100 text-slate-700 border-slate-200' },
  };
  const c = config[role] || config.user;
  return <Badge variant="outline" className={`${c.class} text-xs`}>{c.label}</Badge>;
};

const StatusIndicator = ({ user }) => {
  if (user.is_blacklisted) {
    return <Badge variant="destructive" className="text-xs">Blacklisted</Badge>;
  }
  if (user.is_flagged) {
    return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">Flagged</Badge>;
  }
  if (!user.is_active) {
    return <Badge variant="outline" className="bg-slate-100 text-slate-500 text-xs">Inactive</Badge>;
  }
  return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">Active</Badge>;
};

const Users = () => {
  const { isAdmin, isCoAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roll_no: '',
    programme: '',
    password: '',
    role: 'user',
  });

  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async () => {
    try {
      const response = await usersAPI.getAll(true);
      setUsers(response.data);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    if (!formData.name || !formData.email || !formData.roll_no || !formData.programme || !formData.password) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.create(formData);
      toast.success('User created successfully');
      setIsAddOpen(false);
      setFormData({ name: '', email: '', roll_no: '', programme: '', password: '', role: 'user' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      await usersAPI.update(userId, updates);
      toast.success('User updated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Deactivate user ${user.name}? Their assets will be unassigned.`)) return;

    try {
      await usersAPI.delete(user.id);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await usersAPI.changePassword(selectedUser.id, newPassword);
      toast.success('Password changed successfully');
      setIsPasswordOpen(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      roll_no: user.roll_no,
      programme: user.programme,
      role: user.role,
    });
    setIsEditOpen(true);
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await usersAPI.update(selectedUser.id, {
        name: formData.name,
        email: formData.email,
        roll_no: formData.roll_no,
        programme: formData.programme,
        role: formData.role,
      });
      toast.success('User updated');
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canModifyRole = (targetUser) => {
    if (isAdmin) {
      // Admin can change anyone's role
      return true;
    }
    if (isCoAdmin) {
      // Co-admin cannot change admin or other co-admin roles
      return targetUser.role === 'user';
    }
    return false;
  };

  const canDowngrade = (targetUser) => {
    // Can only downgrade co_admin to user if initial_role was user
    if (targetUser.role === 'co_admin') {
      return targetUser.initial_role === 'user';
    }
    return false;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.roll_no.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in" data-testid="users-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Users</h2>
          <p className="text-slate-500 mt-1">Manage lab users and permissions</p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-user-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new lab user account</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Full name"
                  data-testid="add-user-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="user@iitk.ac.in"
                  data-testid="add-user-email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Roll No *</Label>
                  <Input 
                    value={formData.roll_no} 
                    onChange={(e) => setFormData({...formData, roll_no: e.target.value})}
                    placeholder="210001"
                    data-testid="add-user-roll"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Programme *</Label>
                  <Input 
                    value={formData.programme} 
                    onChange={(e) => setFormData({...formData, programme: e.target.value})}
                    placeholder="BTech CSE"
                    data-testid="add-user-programme"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input 
                  type="password"
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  data-testid="add-user-password"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({...formData, role: v})}>
                  <SelectTrigger data-testid="add-user-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    {isAdmin && <SelectItem value="co_admin">Co-Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAddUser} disabled={isSubmitting} data-testid="confirm-add-user">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search users..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="search-users-input"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full sm:w-40" data-testid="filter-role-select">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="co_admin">Co-Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-400">
                    <UsersIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`user-row-${user.id}`}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-slate-600">{user.email}</TableCell>
                    <TableCell className="font-mono text-xs">{user.roll_no}</TableCell>
                    <TableCell>{user.programme}</TableCell>
                    <TableCell><RoleBadge role={user.role} /></TableCell>
                    <TableCell><StatusIndicator user={user} /></TableCell>
                    <TableCell>
                      {user.id !== currentUser?.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`user-actions-${user.id}`}>
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Details
                            </DropdownMenuItem>
                            
                            {isAdmin && (
                              <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsPasswordOpen(true); }}>
                                <Key className="w-4 h-4 mr-2" />
                                Change Password
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Role management */}
                            {canModifyRole(user) && user.role === 'user' && isAdmin && (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'co_admin' })}>
                                <Shield className="w-4 h-4 mr-2" />
                                Upgrade to Co-Admin
                              </DropdownMenuItem>
                            )}

                            {canModifyRole(user) && user.role === 'co_admin' && canDowngrade(user) && isAdmin && (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { role: 'user' })}>
                                <ShieldOff className="w-4 h-4 mr-2" />
                                Downgrade to User
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuSeparator />

                            {/* Flag/Unflag */}
                            {user.is_flagged ? (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { is_flagged: false })}>
                                <FlagOff className="w-4 h-4 mr-2" />
                                Unflag User
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { is_flagged: true })}>
                                <Flag className="w-4 h-4 mr-2 text-amber-600" />
                                Flag User
                              </DropdownMenuItem>
                            )}

                            {/* Blacklist/Unblacklist */}
                            {isAdmin && (
                              user.is_blacklisted ? (
                                <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { is_blacklisted: false })}>
                                  <UserCheck className="w-4 h-4 mr-2" />
                                  Remove Blacklist
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleUpdateUser(user.id, { is_blacklisted: true })}>
                                  <Ban className="w-4 h-4 mr-2 text-red-600" />
                                  Blacklist User
                                </DropdownMenuItem>
                              )
                            )}

                            {/* Delete/Deactivate */}
                            {isAdmin && user.is_active && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600"
                                  onClick={() => handleDeleteUser(user)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Deactivate User
                                </DropdownMenuItem>
                              </>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                data-testid="edit-user-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email"
                value={formData.email} 
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                data-testid="edit-user-email"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Roll No</Label>
                <Input 
                  value={formData.roll_no} 
                  onChange={(e) => setFormData({...formData, roll_no: e.target.value})}
                  data-testid="edit-user-roll"
                />
              </div>
              <div className="space-y-2">
                <Label>Programme</Label>
                <Input 
                  value={formData.programme} 
                  onChange={(e) => setFormData({...formData, programme: e.target.value})}
                  data-testid="edit-user-programme"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={isSubmitting} data-testid="confirm-edit-user">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input 
                type="password"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                data-testid="new-password-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={isSubmitting} data-testid="confirm-password-change">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
