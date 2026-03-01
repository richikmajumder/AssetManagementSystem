# IDEAL Lab Inventory Management System - PRD

## Original Problem Statement
Build a comprehensive lab inventory management system for IDEAL Lab at IIT Kanpur with:
- Admin, Co-Admin, and User roles with granular permissions
- Asset management with auto-generated IDs in XYZ/ABCD/EF format
- Service request system with image upload (max 4) and 7-day cooldown on rejections
- Consumables/Stationery ordering with reimbursement
- Shared assets with selective user assignment
- User profile photo upload and password change
- Activity logs and notifications
- Landing page with typewriter effect

## User Personas
1. **Admin** - Full control over users, assets, requests, and logs
2. **Co-Admin** - Can manage users/assets but cannot delete or create co-admins
3. **User** - Can view assigned assets, raise service requests, order consumables

## Core Requirements (Static)
- JWT-based authentication
- MongoDB database
- Role-based access control (RBAC)
- Custom asset IDs in XYZ/ABCD/EF format (e.g., CMP/A1B2/XY)
- Default assets assigned on user creation
- Service request workflow with image attachments
- Profile photo upload for all users
- Password change for all users

## What's Been Implemented (v1.1 - March 1, 2026)

### Backend (FastAPI)
- [x] JWT authentication with login/logout
- [x] Password change for all users (self + admin)
- [x] Profile photo upload
- [x] User CRUD with role management and phone number
- [x] Asset CRUD with custom IDs (XYZ/ABCD/EF format)
- [x] Bulk asset assignment for shared assets
- [x] Service requests with image upload (max 4)
- [x] 7-day cooldown on rejected requests
- [x] Consumable orders with reimbursement
- [x] Activity logs for all actions
- [x] Notifications system

### Frontend (React + Tailwind + Shadcn)
- [x] Landing page with typewriter effect and logo
- [x] Login page with dark theme and gold accents
- [x] Admin Dashboard with stats and charts
- [x] User Dashboard with asset overview
- [x] Profile page with photo upload and password change
- [x] Assets page with custom_asset_id column
- [x] Service Requests with image upload (max 4)
- [x] Resolved requests hide action buttons (3 dots)
- [x] Bell notifications with dropdown
- [x] Responsive design (mobile, tablet, desktop)

### Data Initialized
**Admin:**
- admin@ideal.iitk.ac.in / admin

**Real Users (password123):**
1. Richik Majumder (richik24@iitk.ac.in) - MTech EE Y24, Roll: 241040068
2. Pankaj Kumar Barman (pankajb24@iitk.ac.in) - MSR EE Y24
3. Sunil Patel (sunilp24@iitk.ac.in) - PhD EE Y24
4. Anshu Pal (panshu25@iitk.ac.in) - MTech EE Y25
5. Test User (test@iitk.ac.in) - Only cubicle assigned

**Shared Assets:**
- Lab Printer + LAN Cable
- Lab Locker
- Lab Whiteboard
- Lab Server
- Extension Board

## Asset Categories and ID Prefixes
- FRN: Furniture (Chair, Cubicle)
- CMP: Computer Equipment (Monitor, CPU, Mouse, Keyboard)
- PWR: Power Equipment (UPS, Extension)
- ACC: Accessories (Adapter)
- NET: Network Equipment (WiFi Adapter)
- CBL: Cables (HDMI, LAN)
- PRN: Printer
- SRV: Server
- STR: Storage (Locker, Pen Drive, HDD)
- OFC: Office Equipment (Whiteboard)
- BK: Books
- MSC: Miscellaneous

## Next Tasks
1. Email notification integration
2. Bulk asset import via CSV
3. Advanced reporting/analytics
4. Asset QR code generation
5. Mobile app (React Native)

## Technical Architecture
```
Frontend (React) -> FastAPI Backend -> MongoDB
     |                    |
     v                    v
  Shadcn/UI          Motor (async)
  Tailwind CSS       JWT Auth
  React Router       Bcrypt Hashing
```

## Credentials Summary
- **Admin**: admin@ideal.iitk.ac.in / admin
- **All Users**: password123
