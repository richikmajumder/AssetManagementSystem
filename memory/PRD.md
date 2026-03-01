# IDEAL Lab Inventory Management System - PRD

## Original Problem Statement
Build a comprehensive lab inventory management system for IDEAL Lab at IIT Kanpur with:
- Admin, Co-Admin, and User roles with granular permissions
- Asset management with auto-generated IDs
- Service request system with 7-day cooldown on rejections
- Consumables/Stationery ordering with reimbursement
- Shared assets (servers) and returnable assets (books)
- User flagging, blacklisting, deactivation
- Activity logs and notifications
- Transaction locking for concurrent operations

## User Personas
1. **Admin** - Full control over users, assets, requests, and logs
2. **Co-Admin** - Can manage users/assets but cannot delete or create co-admins
3. **User** - Can view assigned assets, raise service requests, order consumables

## Core Requirements (Static)
- JWT-based authentication
- MongoDB database
- Role-based access control (RBAC)
- Auto-generated asset IDs (e.g., MON-2026001)
- Default assets assigned on user creation
- Service request workflow with status transitions
- Consumable orders with reimbursement option
- Activity logging for audit trail
- Bell notifications

## What's Been Implemented (v1.0 - March 1, 2026)

### Backend (FastAPI)
- [x] JWT authentication with login/logout
- [x] User CRUD with role management
- [x] User flagging, blacklisting, deactivation
- [x] Password change (admin only)
- [x] Asset CRUD with auto-generated IDs
- [x] Asset assignment (auto-assign available or create new)
- [x] Shared assets support
- [x] Returnable assets (books) with return requests
- [x] Service requests with approval workflow
- [x] 7-day cooldown on rejected requests
- [x] Asset requests for new items
- [x] Consumable orders (admin order & reimbursement)
- [x] Direct consumable addition by admin
- [x] Activity logs for all actions
- [x] Notifications system
- [x] Dashboard statistics

### Frontend (React + Tailwind + Shadcn)
- [x] Login page with lab background
- [x] Admin Dashboard with stats and charts
- [x] User Dashboard with asset overview
- [x] Users management page (CRUD, flag, blacklist)
- [x] Assets management page (CRUD, assign, filter)
- [x] Service Requests page (create, approve, reject)
- [x] Consumables page (order, reimburse, direct add)
- [x] My Assets page for users
- [x] Activity Logs page (admin only)
- [x] Bell notifications with dropdown
- [x] Responsive design (mobile, tablet, desktop)

### Data Initialized
- 1 Admin (admin@ideal.iitk.ac.in / admin)
- 4 Sample Users with default assets
- 1 Shared Lab Server

## Prioritized Backlog

### P0 (Critical) - Completed
- [x] Authentication system
- [x] User management
- [x] Asset management
- [x] Service requests
- [x] Dashboard views

### P1 (High Priority) - Future
- [ ] Image upload for service requests
- [ ] PDF invoice download for reimbursements
- [ ] Email notifications integration
- [ ] Bulk asset import/export

### P2 (Medium Priority) - Future
- [ ] Dark mode toggle
- [ ] Asset QR code generation
- [ ] Advanced reporting/analytics
- [ ] Asset depreciation tracking

### P3 (Nice to Have) - Future
- [ ] Mobile app (React Native)
- [ ] Barcode scanner integration
- [ ] Calendar view for maintenance schedules

## Next Tasks
1. Add image upload support for service requests
2. Implement email notification integration
3. Add bulk asset import via CSV
4. Implement advanced filtering and search
5. Add export to PDF/Excel functionality

## Technical Architecture
```
Frontend (React) -> FastAPI Backend -> MongoDB
     |                    |
     v                    v
  Shadcn/UI          Motor (async)
  Tailwind CSS       JWT Auth
  React Router       Bcrypt Hashing
```

## Credentials
- **Admin**: admin@ideal.iitk.ac.in / admin
- **Users**: rahul@iitk.ac.in, priya@iitk.ac.in, amit@iitk.ac.in, sneha@iitk.ac.in / password123
