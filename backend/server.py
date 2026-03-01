from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Literal, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from bson import ObjectId
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'ideal-lab-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="IDEAL Lab Inventory Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserRole(str):
    ADMIN = "admin"
    CO_ADMIN = "co_admin"
    USER = "user"

class AssetStatus(str):
    ACTIVE = "active"
    SERVICE_REQUESTED = "service_requested"
    WORK_IN_PROGRESS = "work_in_progress"
    INACTIVE = "inactive"
    UNASSIGNED = "unassigned"

class RequestStatus(str):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    RESOLVED = "resolved"

class OrderStatus(str):
    PENDING = "pending"
    ORDERED = "ordered"
    REJECTED = "rejected"

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    roll_no: str
    programme: str
    password: str
    role: Literal["admin", "co_admin", "user"] = "user"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    roll_no: Optional[str] = None
    programme: Optional[str] = None
    role: Optional[Literal["admin", "co_admin", "user"]] = None
    is_flagged: Optional[bool] = None
    is_blacklisted: Optional[bool] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    email: str
    roll_no: str
    programme: str
    role: str
    initial_role: str
    is_flagged: bool = False
    is_blacklisted: bool = False
    is_active: bool = True
    created_at: str
    updated_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user: UserResponse

class PasswordChangeRequest(BaseModel):
    user_id: Optional[str] = None
    new_password: str

# Asset Models
class AssetType(str):
    CUBICLE = "cubicle"
    MONITOR = "monitor"
    KEYBOARD = "keyboard"
    CHAIR = "chair"
    CPU = "cpu"
    MOUSE = "mouse"
    SERVER = "server"
    PEN_DRIVE = "pen_drive"
    BOOK = "book"
    OTHER = "other"

class AssetCreate(BaseModel):
    asset_type: str
    name: str
    description: Optional[str] = None
    is_shared: bool = False
    is_returnable: bool = False
    assigned_user_ids: Optional[List[str]] = None

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["active", "service_requested", "work_in_progress", "inactive", "unassigned"]] = None
    is_shared: Optional[bool] = None
    is_returnable: Optional[bool] = None
    assigned_user_ids: Optional[List[str]] = None

class AssetResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    asset_id: str
    asset_type: str
    name: str
    description: Optional[str] = None
    status: str
    is_shared: bool
    is_returnable: bool
    assigned_user_ids: List[str]
    created_at: str
    updated_at: str
    version: int = 1

class UserAssetCreate(BaseModel):
    user_id: str
    asset_type: str
    custom_id: Optional[str] = None

# Service Request Models
class ServiceRequestCreate(BaseModel):
    asset_id: str
    description: str
    is_generic: bool = False
    images: Optional[List[str]] = None
    remarks: Optional[str] = None

class ServiceRequestUpdate(BaseModel):
    status: Optional[Literal["pending", "approved", "rejected", "resolved"]] = None
    admin_remarks: Optional[str] = None

class ServiceRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    request_id: str
    asset_id: str
    user_id: str
    description: str
    status: str
    is_generic: bool
    images: List[str]
    remarks: Optional[str] = None
    admin_remarks: Optional[str] = None
    created_at: str
    updated_at: str

# Consumable/Stationery Models
class ConsumableOrderCreate(BaseModel):
    name: str
    quantity: int
    description: Optional[str] = None
    is_collective: bool = False
    collective_user_ids: Optional[List[str]] = None
    order_type: Literal["admin_order", "reimbursement"] = "admin_order"
    invoice_base64: Optional[str] = None

class ConsumableOrderUpdate(BaseModel):
    status: Optional[Literal["pending", "ordered", "rejected"]] = None
    admin_remarks: Optional[str] = None

class ConsumableOrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    request_id: str
    name: str
    quantity: int
    description: Optional[str] = None
    status: str
    order_type: str
    is_collective: bool
    user_ids: List[str]
    invoice_base64: Optional[str] = None
    admin_remarks: Optional[str] = None
    created_at: str
    updated_at: str

# Asset Request Models (for requesting new items)
class AssetRequestCreate(BaseModel):
    asset_type: str
    description: str
    quantity: int = 1

class AssetRequestResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    request_id: str
    user_id: str
    asset_type: str
    description: str
    quantity: int
    status: str
    admin_remarks: Optional[str] = None
    created_at: str
    updated_at: str

# Notification Model
class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    message: str
    notification_type: str
    related_id: Optional[str] = None
    is_read: bool
    created_at: str

# Activity Log Model
class ActivityLogResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    user_name: str
    user_role: str
    action: str
    entity_type: str
    entity_id: str
    details: dict
    created_at: str

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account deactivated")
        if user.get("is_blacklisted", False):
            raise HTTPException(status_code=403, detail="Account blacklisted")
        
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

async def require_admin_or_coadmin(user: dict = Depends(get_current_user)):
    if user["role"] not in ["admin", "co_admin"]:
        raise HTTPException(status_code=403, detail="Admin or Co-Admin access required")
    return user

async def generate_asset_id(asset_type: str) -> str:
    """Generate unique asset ID like MON-2026001"""
    type_prefix = {
        "cubicle": "CUB", "monitor": "MON", "keyboard": "KBD", "chair": "CHR",
        "cpu": "CPU", "mouse": "MOU", "server": "SRV", "pen_drive": "PD",
        "book": "BK", "other": "OTH"
    }
    prefix = type_prefix.get(asset_type.lower(), "OTH")
    year = datetime.now(timezone.utc).year
    
    # Count existing assets of this type this year
    count = await db.assets.count_documents({"asset_id": {"$regex": f"^{prefix}-{year}"}})
    return f"{prefix}-{year}{str(count + 1).zfill(3)}"

async def generate_request_id(prefix: str = "SR") -> str:
    """Generate unique request ID"""
    year = datetime.now(timezone.utc).year
    count = await db.counters.find_one_and_update(
        {"_id": f"{prefix}_{year}"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    return f"{prefix}-{year}{str(count['seq']).zfill(4)}"

async def log_activity(user_id: str, user_name: str, user_role: str, action: str, 
                       entity_type: str, entity_id: str, details: dict):
    """Log activity for audit trail"""
    log = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "user_name": user_name,
        "user_role": user_role,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "details": details,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.activity_logs.insert_one(log)

async def create_notification(user_id: str, message: str, notification_type: str, related_id: str = None):
    """Create notification for user"""
    notification = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "notification_type": notification_type,
        "related_id": related_id,
        "is_read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)

async def check_cooldown(user_id: str, asset_id: str) -> bool:
    """Check if user is in 7-day cooldown for rejected request"""
    seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    existing = await db.service_requests.find_one({
        "user_id": user_id,
        "asset_id": asset_id,
        "status": "rejected",
        "updated_at": {"$gte": seven_days_ago}
    })
    return existing is None

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    user = await db.users.find_one({"email": request.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account deactivated")
    if user.get("is_blacklisted", False):
        raise HTTPException(status_code=403, detail="Account blacklisted")
    
    token = create_token(user["id"], user["email"], user["role"])
    user_response = {k: v for k, v in user.items() if k != "password"}
    return {"token": token, "user": user_response}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password"}

# ==================== USER MANAGEMENT ENDPOINTS ====================

@api_router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreate, admin: dict = Depends(require_admin_or_coadmin)):
    # Co-admin cannot create co-admin
    if admin["role"] == "co_admin" and user_data.role == "co_admin":
        raise HTTPException(status_code=403, detail="Co-admin cannot create another co-admin")
    
    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    now = datetime.now(timezone.utc).isoformat()
    user_id = str(uuid.uuid4())
    
    user = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "roll_no": user_data.roll_no,
        "programme": user_data.programme,
        "password": hash_password(user_data.password),
        "role": user_data.role,
        "initial_role": user_data.role,
        "is_flagged": False,
        "is_blacklisted": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    
    await db.users.insert_one(user)
    
    # Create default assets for regular users
    if user_data.role == "user":
        default_types = ["cubicle", "monitor", "keyboard", "chair", "cpu", "mouse"]
        for asset_type in default_types:
            asset_id = await generate_asset_id(asset_type)
            asset = {
                "id": str(uuid.uuid4()),
                "asset_id": asset_id,
                "asset_type": asset_type,
                "name": f"{asset_type.capitalize()} - {user_data.name}",
                "description": f"Default {asset_type} assigned to {user_data.name}",
                "status": "active",
                "is_shared": False,
                "is_returnable": False,
                "assigned_user_ids": [user_id],
                "created_at": now,
                "updated_at": now,
                "version": 1
            }
            await db.assets.insert_one(asset)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "CREATE_USER",
                       "user", user_id, {"name": user_data.name, "role": user_data.role})
    
    return {k: v for k, v in user.items() if k != "password"}

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(
    include_inactive: bool = False,
    admin: dict = Depends(require_admin_or_coadmin)
):
    query = {} if include_inactive else {"is_active": True}
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return users

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    # Users can only see themselves, admins can see everyone
    if current_user["role"] == "user" and current_user["id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@api_router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, update: UserUpdate, admin: dict = Depends(require_admin_or_coadmin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Co-admin restrictions
    if admin["role"] == "co_admin":
        # Cannot modify admin or themselves
        if user["role"] == "admin" or user_id == admin["id"]:
            raise HTTPException(status_code=403, detail="Cannot modify this user")
        # Cannot upgrade to co-admin
        if update.role == "co_admin":
            raise HTTPException(status_code=403, detail="Cannot upgrade to co-admin")
    
    # Role change restrictions
    if update.role:
        # Co-admin can only be downgraded if initial role was user
        if user["role"] == "co_admin" and update.role == "user":
            if user["initial_role"] != "user":
                raise HTTPException(status_code=400, detail="Co-admin with initial co-admin role cannot be downgraded")
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    await log_activity(admin["id"], admin["name"], admin["role"], "UPDATE_USER",
                       "user", user_id, update_data)
    
    # Notify user if flagged/blacklisted
    if update.is_flagged is not None or update.is_blacklisted is not None:
        msg = "Your account has been " + ("flagged" if update.is_flagged else "unflagged" if update.is_flagged is False else "blacklisted" if update.is_blacklisted else "unblacklisted")
        await create_notification(user_id, msg, "account_status")
    
    updated = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    return updated

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    """Soft delete - deactivates user and unassigns their assets"""
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Deactivate user
    await db.users.update_one({"id": user_id}, {
        "$set": {"is_active": False, "updated_at": datetime.now(timezone.utc).isoformat()}
    })
    
    # Unassign all non-shared assets
    await db.assets.update_many(
        {"assigned_user_ids": user_id, "is_shared": False},
        {"$pull": {"assigned_user_ids": user_id}, "$set": {"status": "unassigned", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # For shared assets, just remove user from list
    await db.assets.update_many(
        {"assigned_user_ids": user_id, "is_shared": True},
        {"$pull": {"assigned_user_ids": user_id}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    await log_activity(admin["id"], admin["name"], admin["role"], "DELETE_USER",
                       "user", user_id, {"name": user["name"]})
    
    return {"message": "User deactivated and assets unassigned"}

@api_router.post("/users/{user_id}/change-password")
async def change_password(user_id: str, request: PasswordChangeRequest, admin: dict = Depends(require_admin)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one({"id": user_id}, {
        "$set": {"password": hash_password(request.new_password), "updated_at": datetime.now(timezone.utc).isoformat()}
    })
    
    await log_activity(admin["id"], admin["name"], admin["role"], "CHANGE_PASSWORD",
                       "user", user_id, {"user_name": user["name"]})
    
    return {"message": "Password changed successfully"}

# ==================== ASSET ENDPOINTS ====================

@api_router.post("/assets", response_model=AssetResponse)
async def create_asset(asset_data: AssetCreate, admin: dict = Depends(require_admin_or_coadmin)):
    now = datetime.now(timezone.utc).isoformat()
    asset_id = await generate_asset_id(asset_data.asset_type)
    
    asset = {
        "id": str(uuid.uuid4()),
        "asset_id": asset_id,
        "asset_type": asset_data.asset_type,
        "name": asset_data.name,
        "description": asset_data.description,
        "status": "unassigned" if not asset_data.assigned_user_ids else "active",
        "is_shared": asset_data.is_shared,
        "is_returnable": asset_data.is_returnable,
        "assigned_user_ids": asset_data.assigned_user_ids or [],
        "created_at": now,
        "updated_at": now,
        "version": 1
    }
    
    await db.assets.insert_one(asset)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "CREATE_ASSET",
                       "asset", asset["id"], {"asset_id": asset_id, "type": asset_data.asset_type})
    
    return asset

@api_router.get("/assets", response_model=List[AssetResponse])
async def get_assets(
    exclude_consumables: bool = False,
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    admin: dict = Depends(require_admin_or_coadmin)
):
    query = {}
    if exclude_consumables:
        query["asset_type"] = {"$nin": ["consumable", "stationery"]}
    if asset_type:
        query["asset_type"] = asset_type
    if status:
        query["status"] = status
    if user_id:
        query["assigned_user_ids"] = user_id
    
    assets = await db.assets.find(query, {"_id": 0}).to_list(1000)
    return assets

@api_router.get("/assets/my", response_model=List[AssetResponse])
async def get_my_assets(user: dict = Depends(get_current_user)):
    assets = await db.assets.find({"assigned_user_ids": user["id"]}, {"_id": 0}).to_list(1000)
    return assets

@api_router.get("/assets/{asset_id}", response_model=AssetResponse)
async def get_asset(asset_id: str, user: dict = Depends(get_current_user)):
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Users can only see their own assets
    if user["role"] == "user" and user["id"] not in asset.get("assigned_user_ids", []):
        raise HTTPException(status_code=403, detail="Access denied")
    
    return asset

@api_router.patch("/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(asset_id: str, update: AssetUpdate, admin: dict = Depends(require_admin_or_coadmin)):
    # Co-admin cannot delete/significantly modify
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check for assignment conflicts
    if update.assigned_user_ids:
        if not asset["is_shared"]:
            for uid in update.assigned_user_ids:
                existing = await db.assets.find_one({
                    "id": {"$ne": asset_id},
                    "asset_type": asset["asset_type"],
                    "assigned_user_ids": uid,
                    "is_shared": False
                })
                if existing:
                    user = await db.users.find_one({"id": uid}, {"_id": 0})
                    raise HTTPException(
                        status_code=400, 
                        detail=f"This item is already assigned to {user['name'] if user else 'another user'}"
                    )
    
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    update_data["version"] = asset["version"] + 1
    
    await db.assets.update_one({"id": asset_id}, {"$set": update_data})
    
    await log_activity(admin["id"], admin["name"], admin["role"], "UPDATE_ASSET",
                       "asset", asset_id, update_data)
    
    return await db.assets.find_one({"id": asset_id}, {"_id": 0})

@api_router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, admin: dict = Depends(require_admin)):
    """Only admin can delete, and only if asset is unassigned"""
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if asset.get("assigned_user_ids"):
        # Get user names
        user_ids = asset["assigned_user_ids"]
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "name": 1}).to_list(100)
        names = [u["name"] for u in users]
        raise HTTPException(
            status_code=400, 
            detail=f"Asset is assigned to: {', '.join(names)}. Unassign before deletion."
        )
    
    await db.assets.delete_one({"id": asset_id})
    
    await log_activity(admin["id"], admin["name"], admin["role"], "DELETE_ASSET",
                       "asset", asset_id, {"asset_id": asset["asset_id"]})
    
    return {"message": "Asset deleted"}

@api_router.post("/assets/assign")
async def assign_asset(data: UserAssetCreate, admin: dict = Depends(require_admin_or_coadmin)):
    """Assign existing or new asset to user"""
    user = await db.users.find_one({"id": data.user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check for available unassigned asset
    available = await db.assets.find_one({
        "asset_type": data.asset_type,
        "status": "unassigned",
        "is_shared": False
    }, {"_id": 0})
    
    now = datetime.now(timezone.utc).isoformat()
    
    if available:
        # Assign existing asset
        await db.assets.update_one({"id": available["id"]}, {
            "$push": {"assigned_user_ids": data.user_id},
            "$set": {"status": "active", "updated_at": now}
        })
        asset = await db.assets.find_one({"id": available["id"]}, {"_id": 0})
    else:
        # Create new asset
        asset_id = data.custom_id or await generate_asset_id(data.asset_type)
        asset = {
            "id": str(uuid.uuid4()),
            "asset_id": asset_id,
            "asset_type": data.asset_type,
            "name": f"{data.asset_type.capitalize()} - {user['name']}",
            "description": None,
            "status": "active",
            "is_shared": False,
            "is_returnable": False,
            "assigned_user_ids": [data.user_id],
            "created_at": now,
            "updated_at": now,
            "version": 1
        }
        await db.assets.insert_one(asset)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "ASSIGN_ASSET",
                       "asset", asset["id"], {"user_id": data.user_id, "asset_type": data.asset_type})
    
    await create_notification(data.user_id, f"New {data.asset_type} has been assigned to you", "asset_assigned", asset["id"])
    
    return asset

@api_router.post("/assets/{asset_id}/return")
async def return_asset(asset_id: str, user: dict = Depends(get_current_user)):
    """User returns a returnable asset (like book)"""
    asset = await db.assets.find_one({"id": asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if not asset.get("is_returnable"):
        raise HTTPException(status_code=400, detail="This asset is not returnable")
    
    if user["id"] not in asset.get("assigned_user_ids", []):
        raise HTTPException(status_code=403, detail="Asset not assigned to you")
    
    # Create return request
    request_id = await generate_request_id("RET")
    now = datetime.now(timezone.utc).isoformat()
    
    return_request = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "asset_id": asset_id,
        "user_id": user["id"],
        "status": "pending",
        "created_at": now,
        "updated_at": now
    }
    
    await db.return_requests.insert_one(return_request)
    
    # Notify admins
    admins = await db.users.find({"role": {"$in": ["admin", "co_admin"]}, "is_active": True}, {"_id": 0}).to_list(100)
    for admin in admins:
        await create_notification(admin["id"], f"{user['name']} requested to return {asset['name']}", "return_request", return_request["id"])
    
    return {"message": "Return request submitted", "request_id": request_id}

# ==================== SERVICE REQUEST ENDPOINTS ====================

@api_router.post("/service-requests", response_model=ServiceRequestResponse)
async def create_service_request(request: ServiceRequestCreate, user: dict = Depends(get_current_user)):
    # Check if asset exists and user has access
    asset = await db.assets.find_one({"id": request.asset_id}, {"_id": 0})
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    if user["id"] not in asset.get("assigned_user_ids", []):
        raise HTTPException(status_code=403, detail="Asset not assigned to you")
    
    # Check cooldown
    if not await check_cooldown(user["id"], request.asset_id):
        raise HTTPException(status_code=400, detail="You cannot raise another request for this asset. Please wait 7 days after rejection.")
    
    # Co-admin upgraded from user: request goes to main admin only
    request_for_admin = user["role"] == "co_admin" and user["initial_role"] == "user"
    
    request_id = await generate_request_id("SR")
    now = datetime.now(timezone.utc).isoformat()
    
    service_request = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "asset_id": request.asset_id,
        "user_id": user["id"],
        "description": request.description,
        "status": "pending",
        "is_generic": request.is_generic,
        "images": request.images or [],
        "remarks": request.remarks,
        "admin_remarks": None,
        "request_for_admin_only": request_for_admin,
        "created_at": now,
        "updated_at": now
    }
    
    await db.service_requests.insert_one(service_request)
    
    # Update asset status
    await db.assets.update_one({"id": request.asset_id}, {
        "$set": {"status": "service_requested", "updated_at": now}
    })
    
    # Notify admins
    query = {"role": "admin", "is_active": True} if request_for_admin else {"role": {"$in": ["admin", "co_admin"]}, "is_active": True}
    admins = await db.users.find(query, {"_id": 0}).to_list(100)
    for admin in admins:
        await create_notification(admin["id"], f"New service request {request_id} from {user['name']}", "service_request", service_request["id"])
    
    return service_request

@api_router.get("/service-requests", response_model=List[ServiceRequestResponse])
async def get_service_requests(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    admin: dict = Depends(require_admin_or_coadmin)
):
    query = {}
    if status:
        query["status"] = status
    if user_id:
        query["user_id"] = user_id
    
    # Co-admin cannot see requests meant for admin only
    if admin["role"] == "co_admin":
        query["request_for_admin_only"] = {"$ne": True}
    
    requests = await db.service_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.get("/service-requests/my", response_model=List[ServiceRequestResponse])
async def get_my_service_requests(user: dict = Depends(get_current_user)):
    requests = await db.service_requests.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return requests

@api_router.patch("/service-requests/{request_id}", response_model=ServiceRequestResponse)
async def update_service_request(request_id: str, update: ServiceRequestUpdate, admin: dict = Depends(require_admin_or_coadmin)):
    sr = await db.service_requests.find_one({"id": request_id}, {"_id": 0})
    if not sr:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Co-admin cannot handle admin-only requests
    if admin["role"] == "co_admin" and sr.get("request_for_admin_only"):
        raise HTTPException(status_code=403, detail="This request can only be handled by admin")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = now
    
    await db.service_requests.update_one({"id": request_id}, {"$set": update_data})
    
    # Update asset status based on request status
    asset_status_map = {
        "approved": "work_in_progress",
        "rejected": "active",
        "resolved": "active"
    }
    
    if update.status in asset_status_map:
        # For generic requests on shared assets, update for all assigned users
        asset = await db.assets.find_one({"id": sr["asset_id"]}, {"_id": 0})
        new_status = asset_status_map[update.status]
        await db.assets.update_one({"id": sr["asset_id"]}, {"$set": {"status": new_status, "updated_at": now}})
    
    # Notify user
    status_messages = {
        "approved": "Your service request has been approved",
        "rejected": "Your service request has been rejected",
        "resolved": "Your service request has been resolved"
    }
    if update.status in status_messages:
        await create_notification(sr["user_id"], f"{status_messages[update.status]}: {sr['request_id']}", "service_request_update", request_id)
        
        # For generic requests on shared assets, notify all users
        if sr.get("is_generic"):
            asset = await db.assets.find_one({"id": sr["asset_id"]}, {"_id": 0})
            if asset and asset.get("is_shared"):
                for uid in asset.get("assigned_user_ids", []):
                    if uid != sr["user_id"]:
                        await create_notification(uid, f"Service request {sr['request_id']} status updated to {update.status}", "service_request_update", request_id)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "UPDATE_SERVICE_REQUEST",
                       "service_request", request_id, update_data)
    
    return await db.service_requests.find_one({"id": request_id}, {"_id": 0})

@api_router.post("/service-requests/{request_id}/resolve")
async def resolve_service_request(request_id: str, user: dict = Depends(get_current_user)):
    """User or admin can mark request as resolved"""
    sr = await db.service_requests.find_one({"id": request_id}, {"_id": 0})
    if not sr:
        raise HTTPException(status_code=404, detail="Service request not found")
    
    # Only the requester or admin can resolve
    if user["role"] == "user" and sr["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if sr["status"] != "approved" and sr["status"] != "work_in_progress":
        raise HTTPException(status_code=400, detail="Can only resolve approved or in-progress requests")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.service_requests.update_one({"id": request_id}, {
        "$set": {"status": "resolved", "updated_at": now}
    })
    
    await db.assets.update_one({"id": sr["asset_id"]}, {
        "$set": {"status": "active", "updated_at": now}
    })
    
    return {"message": "Service request resolved"}

# ==================== ASSET REQUEST ENDPOINTS (for new items) ====================

@api_router.post("/asset-requests", response_model=AssetRequestResponse)
async def create_asset_request(request: AssetRequestCreate, user: dict = Depends(get_current_user)):
    """User requests for a new asset type"""
    request_id = await generate_request_id("AR")
    now = datetime.now(timezone.utc).isoformat()
    
    asset_request = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "user_id": user["id"],
        "asset_type": request.asset_type,
        "description": request.description,
        "quantity": request.quantity,
        "status": "pending",
        "admin_remarks": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.asset_requests.insert_one(asset_request)
    
    # Notify admins
    admins = await db.users.find({"role": {"$in": ["admin", "co_admin"]}, "is_active": True}, {"_id": 0}).to_list(100)
    for admin in admins:
        await create_notification(admin["id"], f"New asset request {request_id} from {user['name']}", "asset_request", asset_request["id"])
    
    return asset_request

@api_router.get("/asset-requests", response_model=List[AssetRequestResponse])
async def get_asset_requests(status: Optional[str] = None, admin: dict = Depends(require_admin_or_coadmin)):
    query = {}
    if status:
        query["status"] = status
    requests = await db.asset_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.get("/asset-requests/my", response_model=List[AssetRequestResponse])
async def get_my_asset_requests(user: dict = Depends(get_current_user)):
    requests = await db.asset_requests.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
    return requests

@api_router.patch("/asset-requests/{request_id}")
async def update_asset_request(request_id: str, status: str, admin_remarks: Optional[str] = None, admin: dict = Depends(require_admin_or_coadmin)):
    ar = await db.asset_requests.find_one({"id": request_id}, {"_id": 0})
    if not ar:
        raise HTTPException(status_code=404, detail="Asset request not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {"status": status, "updated_at": now}
    if admin_remarks:
        update_data["admin_remarks"] = admin_remarks
    
    await db.asset_requests.update_one({"id": request_id}, {"$set": update_data})
    
    # If approved, assign assets
    if status == "approved":
        for _ in range(ar["quantity"]):
            # Try to find available asset first
            available = await db.assets.find_one({
                "asset_type": ar["asset_type"],
                "status": "unassigned",
                "is_shared": False
            }, {"_id": 0})
            
            if available:
                await db.assets.update_one({"id": available["id"]}, {
                    "$push": {"assigned_user_ids": ar["user_id"]},
                    "$set": {"status": "active", "updated_at": now}
                })
            else:
                # Create new asset
                asset_id = await generate_asset_id(ar["asset_type"])
                user = await db.users.find_one({"id": ar["user_id"]}, {"_id": 0})
                asset = {
                    "id": str(uuid.uuid4()),
                    "asset_id": asset_id,
                    "asset_type": ar["asset_type"],
                    "name": f"{ar['asset_type'].capitalize()} - {user['name'] if user else 'Unknown'}",
                    "description": None,
                    "status": "active",
                    "is_shared": False,
                    "is_returnable": False,
                    "assigned_user_ids": [ar["user_id"]],
                    "created_at": now,
                    "updated_at": now,
                    "version": 1
                }
                await db.assets.insert_one(asset)
    
    # Notify user
    await create_notification(ar["user_id"], f"Your asset request {ar['request_id']} has been {status}", "asset_request_update", request_id)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "UPDATE_ASSET_REQUEST",
                       "asset_request", request_id, {"status": status})
    
    return {"message": f"Asset request {status}"}

# ==================== CONSUMABLE/STATIONERY ENDPOINTS ====================

@api_router.post("/consumables", response_model=ConsumableOrderResponse)
async def create_consumable_order(order: ConsumableOrderCreate, user: dict = Depends(get_current_user)):
    request_id = await generate_request_id("CON")
    now = datetime.now(timezone.utc).isoformat()
    
    user_ids = [user["id"]]
    if order.is_collective and order.collective_user_ids:
        user_ids.extend(order.collective_user_ids)
        user_ids = list(set(user_ids))
    
    consumable = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "name": order.name,
        "quantity": order.quantity,
        "description": order.description,
        "status": "pending",
        "order_type": order.order_type,
        "is_collective": order.is_collective,
        "user_ids": user_ids,
        "invoice_base64": order.invoice_base64,
        "admin_remarks": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.consumables.insert_one(consumable)
    
    # Notify admins
    admins = await db.users.find({"role": {"$in": ["admin", "co_admin"]}, "is_active": True}, {"_id": 0}).to_list(100)
    for admin in admins:
        await create_notification(admin["id"], f"New consumable order {request_id} from {user['name']}", "consumable_order", consumable["id"])
    
    return consumable

@api_router.post("/consumables/direct", response_model=ConsumableOrderResponse)
async def create_direct_consumable(order: ConsumableOrderCreate, admin: dict = Depends(require_admin_or_coadmin)):
    """Admin directly adds consumable without request"""
    request_id = await generate_request_id("CON")
    now = datetime.now(timezone.utc).isoformat()
    
    user_ids = order.collective_user_ids or []
    
    consumable = {
        "id": str(uuid.uuid4()),
        "request_id": request_id,
        "name": order.name,
        "quantity": order.quantity,
        "description": order.description,
        "status": "ordered",
        "order_type": "admin_direct",
        "is_collective": order.is_collective,
        "user_ids": user_ids,
        "invoice_base64": None,
        "admin_remarks": None,
        "created_at": now,
        "updated_at": now
    }
    
    await db.consumables.insert_one(consumable)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "CREATE_CONSUMABLE",
                       "consumable", consumable["id"], {"name": order.name, "quantity": order.quantity})
    
    return consumable

@api_router.get("/consumables", response_model=List[ConsumableOrderResponse])
async def get_consumables(status: Optional[str] = None, admin: dict = Depends(require_admin_or_coadmin)):
    query = {}
    if status:
        query["status"] = status
    consumables = await db.consumables.find(query, {"_id": 0}).to_list(1000)
    return consumables

@api_router.get("/consumables/my", response_model=List[ConsumableOrderResponse])
async def get_my_consumables(user: dict = Depends(get_current_user)):
    consumables = await db.consumables.find({"user_ids": user["id"]}, {"_id": 0}).to_list(1000)
    return consumables

@api_router.patch("/consumables/{order_id}", response_model=ConsumableOrderResponse)
async def update_consumable(order_id: str, update: ConsumableOrderUpdate, admin: dict = Depends(require_admin_or_coadmin)):
    order = await db.consumables.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    now = datetime.now(timezone.utc).isoformat()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = now
    
    await db.consumables.update_one({"id": order_id}, {"$set": update_data})
    
    # Notify users
    for uid in order["user_ids"]:
        await create_notification(uid, f"Your consumable order {order['request_id']} has been {update.status}", "consumable_update", order_id)
    
    await log_activity(admin["id"], admin["name"], admin["role"], "UPDATE_CONSUMABLE",
                       "consumable", order_id, update_data)
    
    return await db.consumables.find_one({"id": order_id}, {"_id": 0})

@api_router.delete("/consumables/{order_id}")
async def delete_consumable(order_id: str, admin: dict = Depends(require_admin)):
    order = await db.consumables.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    await db.consumables.delete_one({"id": order_id})
    
    await log_activity(admin["id"], admin["name"], admin["role"], "DELETE_CONSUMABLE",
                       "consumable", order_id, {"request_id": order["request_id"]})
    
    return {"message": "Consumable order deleted"}

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(unread_only: bool = False, user: dict = Depends(get_current_user)):
    query = {"user_id": user["id"]}
    if unread_only:
        query["is_read"] = False
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return notifications

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    notification = await db.notifications.find_one({"id": notification_id, "user_id": user["id"]}, {"_id": 0})
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.notifications.update_one({"id": notification_id}, {"$set": {"is_read": True}})
    return {"message": "Notification marked as read"}

@api_router.patch("/notifications/read-all")
async def mark_all_notifications_read(user: dict = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user["id"], "is_read": False}, {"$set": {"is_read": True}})
    return {"message": "All notifications marked as read"}

# ==================== ACTIVITY LOG ENDPOINTS ====================

@api_router.get("/activity-logs", response_model=List[ActivityLogResponse])
async def get_activity_logs(
    user_id: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 100,
    admin: dict = Depends(require_admin)
):
    query = {}
    if user_id:
        query["user_id"] = user_id
    if entity_type:
        query["entity_type"] = entity_type
    
    logs = await db.activity_logs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return logs

# ==================== DASHBOARD STATS ENDPOINTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(admin: dict = Depends(require_admin_or_coadmin)):
    """Get overview statistics for admin dashboard"""
    total_users = await db.users.count_documents({"is_active": True})
    total_assets = await db.assets.count_documents({})
    pending_service_requests = await db.service_requests.count_documents({"status": "pending"})
    pending_asset_requests = await db.asset_requests.count_documents({"status": "pending"})
    pending_consumables = await db.consumables.count_documents({"status": "pending"})
    
    # Asset counts by type
    asset_pipeline = [
        {"$group": {"_id": "$asset_type", "count": {"$sum": 1}}}
    ]
    asset_counts = await db.assets.aggregate(asset_pipeline).to_list(100)
    
    # Asset counts by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_counts = await db.assets.aggregate(status_pipeline).to_list(100)
    
    return {
        "total_users": total_users,
        "total_assets": total_assets,
        "pending_service_requests": pending_service_requests,
        "pending_asset_requests": pending_asset_requests,
        "pending_consumables": pending_consumables,
        "asset_by_type": {item["_id"]: item["count"] for item in asset_counts},
        "asset_by_status": {item["_id"]: item["count"] for item in status_counts}
    }

@api_router.get("/dashboard/user-stats")
async def get_user_dashboard_stats(user: dict = Depends(get_current_user)):
    """Get statistics for user dashboard"""
    my_assets = await db.assets.count_documents({"assigned_user_ids": user["id"]})
    my_service_requests = await db.service_requests.count_documents({"user_id": user["id"]})
    pending_requests = await db.service_requests.count_documents({"user_id": user["id"], "status": "pending"})
    my_consumables = await db.consumables.count_documents({"user_ids": user["id"]})
    unread_notifications = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    
    return {
        "my_assets": my_assets,
        "my_service_requests": my_service_requests,
        "pending_requests": pending_requests,
        "my_consumables": my_consumables,
        "unread_notifications": unread_notifications
    }

# ==================== RETURN REQUEST ENDPOINTS ====================

@api_router.get("/return-requests")
async def get_return_requests(status: Optional[str] = None, admin: dict = Depends(require_admin_or_coadmin)):
    query = {}
    if status:
        query["status"] = status
    requests = await db.return_requests.find(query, {"_id": 0}).to_list(1000)
    return requests

@api_router.patch("/return-requests/{request_id}")
async def update_return_request(request_id: str, status: str, admin: dict = Depends(require_admin_or_coadmin)):
    rr = await db.return_requests.find_one({"id": request_id}, {"_id": 0})
    if not rr:
        raise HTTPException(status_code=404, detail="Return request not found")
    
    now = datetime.now(timezone.utc).isoformat()
    
    await db.return_requests.update_one({"id": request_id}, {
        "$set": {"status": status, "updated_at": now}
    })
    
    if status == "approved":
        # Remove user from asset
        await db.assets.update_one({"id": rr["asset_id"]}, {
            "$pull": {"assigned_user_ids": rr["user_id"]},
            "$set": {"status": "unassigned", "updated_at": now}
        })
    
    await create_notification(rr["user_id"], f"Your return request has been {status}", "return_request_update", request_id)
    
    return {"message": f"Return request {status}"}

# ==================== INITIALIZATION ====================

@api_router.get("/")
async def root():
    return {"message": "IDEAL Lab Inventory Management System API"}

@api_router.post("/init")
async def initialize_database():
    """Initialize database with default admin and sample users"""
    # Check if already initialized
    existing_admin = await db.users.find_one({"email": "admin@ideal.iitk.ac.in"})
    if existing_admin:
        return {"message": "Database already initialized"}
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Create admin
    admin = {
        "id": str(uuid.uuid4()),
        "name": "Lab Administrator",
        "email": "admin@ideal.iitk.ac.in",
        "roll_no": "ADMIN001",
        "programme": "Administration",
        "password": hash_password("admin"),
        "role": "admin",
        "initial_role": "admin",
        "is_flagged": False,
        "is_blacklisted": False,
        "is_active": True,
        "created_at": now,
        "updated_at": now
    }
    await db.users.insert_one(admin)
    
    # Create 4 sample users
    sample_users = [
        {"name": "Rahul Sharma", "email": "rahul@iitk.ac.in", "roll_no": "210001", "programme": "BTech CSE"},
        {"name": "Priya Singh", "email": "priya@iitk.ac.in", "roll_no": "210002", "programme": "MTech EE"},
        {"name": "Amit Kumar", "email": "amit@iitk.ac.in", "roll_no": "210003", "programme": "PhD Physics"},
        {"name": "Sneha Patel", "email": "sneha@iitk.ac.in", "roll_no": "210004", "programme": "BTech ME"}
    ]
    
    for user_data in sample_users:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "name": user_data["name"],
            "email": user_data["email"],
            "roll_no": user_data["roll_no"],
            "programme": user_data["programme"],
            "password": hash_password("password123"),
            "role": "user",
            "initial_role": "user",
            "is_flagged": False,
            "is_blacklisted": False,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        await db.users.insert_one(user)
        
        # Create default assets
        default_types = ["cubicle", "monitor", "keyboard", "chair", "cpu", "mouse"]
        for asset_type in default_types:
            asset_id = await generate_asset_id(asset_type)
            asset = {
                "id": str(uuid.uuid4()),
                "asset_id": asset_id,
                "asset_type": asset_type,
                "name": f"{asset_type.capitalize()} - {user_data['name']}",
                "description": f"Default {asset_type} assigned to {user_data['name']}",
                "status": "active",
                "is_shared": False,
                "is_returnable": False,
                "assigned_user_ids": [user_id],
                "created_at": now,
                "updated_at": now,
                "version": 1
            }
            await db.assets.insert_one(asset)
    
    # Create a shared server
    server_id = await generate_asset_id("server")
    user_ids = [u["id"] async for u in db.users.find({"role": "user"}, {"_id": 0, "id": 1})]
    server = {
        "id": str(uuid.uuid4()),
        "asset_id": server_id,
        "asset_type": "server",
        "name": "Lab Server 1",
        "description": "Main computational server for the lab",
        "status": "active",
        "is_shared": True,
        "is_returnable": False,
        "assigned_user_ids": user_ids,
        "created_at": now,
        "updated_at": now,
        "version": 1
    }
    await db.assets.insert_one(server)
    
    return {"message": "Database initialized with admin and 4 sample users"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
