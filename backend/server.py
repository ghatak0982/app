from fastapi import FastAPI, APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
import os
import uuid
import logging
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from apscheduler.schedulers.asyncio import AsyncIOScheduler

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="FleetCare API")
api_router = APIRouter(prefix="/api")

SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'fleetcare-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    hashed_password: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Vehicle(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    registration_number: str
    vehicle_type: str = "Truck"
    owner_name: str = ""
    manufacturer: str = ""
    model: str = ""
    year: int = 2020
    road_tax_expiry: Optional[datetime] = None
    insurance_expiry: Optional[datetime] = None
    puc_expiry: Optional[datetime] = None
    fitness_expiry: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class VehicleCreate(BaseModel):
    registration_number: str

class VehicleBulkCreate(BaseModel):
    registration_numbers: List[str]

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    vehicle_id: str
    title: str
    message: str
    notification_type: str
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if user is None:
        raise credentials_exception
    return User(**user)

async def mock_vehicle_api(registration_number: str) -> dict:
    import random
    base_date = datetime.now(timezone.utc)
    
    manufacturers = ["TATA", "Ashok Leyland", "Mahindra", "Eicher", "BharatBenz"]
    models = ["LPT 1918", "2518", "Blazo X", "Pro 6025", "1617R"]
    
    days_offset_road_tax = random.randint(-30, 90)
    days_offset_insurance = random.randint(-30, 120)
    days_offset_puc = random.randint(-30, 60)
    
    return {
        "registration_number": registration_number.upper(),
        "vehicle_type": "Commercial Vehicle",
        "manufacturer": random.choice(manufacturers),
        "model": random.choice(models),
        "year": random.randint(2015, 2024),
        "owner_name": "Fleet Owner",
        "road_tax_expiry": (base_date + timedelta(days=days_offset_road_tax)).isoformat(),
        "insurance_expiry": (base_date + timedelta(days=days_offset_insurance)).isoformat(),
        "puc_expiry": (base_date + timedelta(days=days_offset_puc)).isoformat(),
        "fitness_expiry": (base_date + timedelta(days=365)).isoformat(),
    }

async def send_email_notification(to_email: str, subject: str, message: str):
    sendgrid_key = os.getenv('SENDGRID_API_KEY')
    sender_email = os.getenv('SENDER_EMAIL', 'noreply@fleetcare.com')
    
    if not sendgrid_key:
        logger.warning("SendGrid API key not configured")
        return
    
    try:
        email_message = Mail(
            from_email=sender_email,
            to_emails=to_email,
            subject=subject,
            html_content=f"<strong>{message}</strong>"
        )
        sg = SendGridAPIClient(sendgrid_key)
        response = sg.send(email_message)
        logger.info(f"Email sent to {to_email}: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")

@api_router.post("/auth/signup", response_model=Token)
async def signup(user_create: UserCreate):
    existing_user = await db.users.find_one({"email": user_create.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_create.email,
        hashed_password=hash_password(user_create.password),
        name=user_create.name
    )
    
    user_dict = user.model_dump()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    await db.users.insert_one(user_dict)
    
    access_token = create_access_token(data={"sub": user.id})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"id": user.id, "email": user.email, "name": user.name}
    )

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email}, {"_id": 0})
    if not user or not verify_password(user_login.password, user['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user['id']})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"id": user['id'], "email": user['email'], "name": user['name']}
    )

class GoogleAuthRequest(BaseModel):
    id_token: str
    email: EmailStr
    name: str
    uid: str

@api_router.post("/auth/google", response_model=Token)
async def google_auth(auth_request: GoogleAuthRequest):
    user = await db.users.find_one({"email": auth_request.email}, {"_id": 0})
    
    if not user:
        new_user = User(
            email=auth_request.email,
            hashed_password=hash_password(str(uuid.uuid4())),
            name=auth_request.name
        )
        user_dict = new_user.model_dump()
        user_dict['created_at'] = user_dict['created_at'].isoformat()
        user_dict['google_id'] = auth_request.uid
        await db.users.insert_one(user_dict)
        user = user_dict
    
    access_token = create_access_token(data={"sub": user['id']})
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={"id": user['id'], "email": user['email'], "name": user['name']}
    )


@api_router.get("/auth/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}

@api_router.post("/vehicles", response_model=Vehicle)
async def add_vehicle(
    vehicle_create: VehicleCreate,
    current_user: User = Depends(get_current_user)
):
    vehicle_data = await mock_vehicle_api(vehicle_create.registration_number)
    
    vehicle = Vehicle(
        user_id=current_user.id,
        registration_number=vehicle_data['registration_number'],
        vehicle_type=vehicle_data['vehicle_type'],
        owner_name=vehicle_data['owner_name'],
        manufacturer=vehicle_data['manufacturer'],
        model=vehicle_data['model'],
        year=vehicle_data['year'],
        road_tax_expiry=datetime.fromisoformat(vehicle_data['road_tax_expiry']),
        insurance_expiry=datetime.fromisoformat(vehicle_data['insurance_expiry']),
        puc_expiry=datetime.fromisoformat(vehicle_data['puc_expiry']),
        fitness_expiry=datetime.fromisoformat(vehicle_data['fitness_expiry'])
    )
    
    vehicle_dict = vehicle.model_dump()
    for key in ['created_at', 'updated_at', 'road_tax_expiry', 'insurance_expiry', 'puc_expiry', 'fitness_expiry']:
        if vehicle_dict[key]:
            vehicle_dict[key] = vehicle_dict[key].isoformat()
    
    await db.vehicles.insert_one(vehicle_dict)
    return vehicle

@api_router.post("/vehicles/bulk", response_model=List[Vehicle])
async def add_vehicles_bulk(
    bulk_create: VehicleBulkCreate,
    current_user: User = Depends(get_current_user)
):
    vehicles = []
    for reg_number in bulk_create.registration_numbers:
        vehicle_data = await mock_vehicle_api(reg_number)
        
        vehicle = Vehicle(
            user_id=current_user.id,
            registration_number=vehicle_data['registration_number'],
            vehicle_type=vehicle_data['vehicle_type'],
            owner_name=vehicle_data['owner_name'],
            manufacturer=vehicle_data['manufacturer'],
            model=vehicle_data['model'],
            year=vehicle_data['year'],
            road_tax_expiry=datetime.fromisoformat(vehicle_data['road_tax_expiry']),
            insurance_expiry=datetime.fromisoformat(vehicle_data['insurance_expiry']),
            puc_expiry=datetime.fromisoformat(vehicle_data['puc_expiry']),
            fitness_expiry=datetime.fromisoformat(vehicle_data['fitness_expiry'])
        )
        
        vehicle_dict = vehicle.model_dump()
        for key in ['created_at', 'updated_at', 'road_tax_expiry', 'insurance_expiry', 'puc_expiry', 'fitness_expiry']:
            if vehicle_dict[key]:
                vehicle_dict[key] = vehicle_dict[key].isoformat()
        
        await db.vehicles.insert_one(vehicle_dict)
        vehicles.append(vehicle)
    
    return vehicles

@api_router.get("/vehicles", response_model=List[Vehicle])
async def get_vehicles(
    current_user: User = Depends(get_current_user),
    search: Optional[str] = None
):
    query = {"user_id": current_user.id}
    if search:
        query["registration_number"] = {"$regex": search, "$options": "i"}
    
    vehicles = await db.vehicles.find(query, {"_id": 0}).to_list(1000)
    
    for vehicle in vehicles:
        for key in ['created_at', 'updated_at', 'road_tax_expiry', 'insurance_expiry', 'puc_expiry', 'fitness_expiry']:

@api_router.put("/vehicles/{vehicle_id}/refresh", response_model=Vehicle)
async def refresh_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user)
):
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "user_id": current_user.id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    vehicle_data = await mock_vehicle_api(vehicle['registration_number'])
    
    update_data = {
        'road_tax_expiry': vehicle_data['road_tax_expiry'],
        'insurance_expiry': vehicle_data['insurance_expiry'],
        'puc_expiry': vehicle_data['puc_expiry'],
        'fitness_expiry': vehicle_data['fitness_expiry'],
        'updated_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.vehicles.update_one(
        {"id": vehicle_id, "user_id": current_user.id},
        {"$set": update_data}
    )
    
    updated_vehicle = await db.vehicles.find_one({"id": vehicle_id}, {"_id": 0})
    for key in ['created_at', 'updated_at', 'road_tax_expiry', 'insurance_expiry', 'puc_expiry', 'fitness_expiry']:
        if updated_vehicle.get(key) and isinstance(updated_vehicle[key], str):
            updated_vehicle[key] = datetime.fromisoformat(updated_vehicle[key])
    
    return Vehicle(**updated_vehicle)

            if vehicle.get(key) and isinstance(vehicle[key], str):
                vehicle[key] = datetime.fromisoformat(vehicle[key])
    
    return [Vehicle(**v) for v in vehicles]

@api_router.get("/vehicles/{vehicle_id}", response_model=Vehicle)
async def get_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user)
):
    vehicle = await db.vehicles.find_one({"id": vehicle_id, "user_id": current_user.id}, {"_id": 0})
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    for key in ['created_at', 'updated_at', 'road_tax_expiry', 'insurance_expiry', 'puc_expiry', 'fitness_expiry']:
        if vehicle.get(key) and isinstance(vehicle[key], str):
            vehicle[key] = datetime.fromisoformat(vehicle[key])
    
    return Vehicle(**vehicle)

@api_router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(
    vehicle_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.vehicles.delete_one({"id": vehicle_id, "user_id": current_user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted successfully"}

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    vehicles = await db.vehicles.find({"user_id": current_user.id}, {"_id": 0}).to_list(1000)
    
    total_vehicles = len(vehicles)
    expiring_this_month = 0
    overdue = {"road_tax": 0, "insurance": 0, "puc": 0}
    
    now = datetime.now(timezone.utc)
    month_end = now + timedelta(days=30)
    
    for vehicle in vehicles:
        for key in ['road_tax_expiry', 'insurance_expiry', 'puc_expiry']:
            if vehicle.get(key):
                expiry_date = datetime.fromisoformat(vehicle[key]) if isinstance(vehicle[key], str) else vehicle[key]
                if expiry_date.tzinfo is None:
                    expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                
                if expiry_date < now:
                    doc_type = key.replace('_expiry', '')
                    overdue[doc_type] = overdue.get(doc_type, 0) + 1
                elif expiry_date <= month_end:
                    expiring_this_month += 1
    
    return {
        "total_vehicles": total_vehicles,
        "expiring_this_month": expiring_this_month,
        "overdue": overdue
    }

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for notif in notifications:
        if isinstance(notif.get('created_at'), str):
            notif['created_at'] = datetime.fromisoformat(notif['created_at'])
    
    return [Notification(**n) for n in notifications]

@api_router.patch("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(get_current_user)
):
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}

async def check_expiries_and_notify():
    logger.info("Running scheduled expiry check...")
    
    try:
        all_vehicles = await db.vehicles.find({}, {"_id": 0}).to_list(10000)
        now = datetime.now(timezone.utc)
        remind_window = now + timedelta(days=15)
        
        for vehicle in all_vehicles:
            user = await db.users.find_one({"id": vehicle['user_id']}, {"_id": 0})
            if not user:
                continue
            
            for doc_type in ['road_tax', 'insurance', 'puc']:
                expiry_key = f"{doc_type}_expiry"
                if vehicle.get(expiry_key):
                    expiry_date = datetime.fromisoformat(vehicle[expiry_key]) if isinstance(vehicle[expiry_key], str) else vehicle[expiry_key]
                    if expiry_date.tzinfo is None:
                        expiry_date = expiry_date.replace(tzinfo=timezone.utc)
                    
                    if now < expiry_date <= remind_window:
                        days_left = (expiry_date - now).days
                        
                        existing_notif = await db.notifications.find_one({
                            "user_id": vehicle['user_id'],
                            "vehicle_id": vehicle['id'],
                            "notification_type": doc_type,
                            "created_at": {"$gte": (now - timedelta(days=7)).isoformat()}
                        })
                        
                        if not existing_notif:
                            notification = Notification(
                                user_id=vehicle['user_id'],
                                vehicle_id=vehicle['id'],
                                title=f"{doc_type.replace('_', ' ').title()} Expiring Soon",
                                message=f"Vehicle {vehicle['registration_number']} {doc_type.replace('_', ' ')} expires in {days_left} days",
                                notification_type=doc_type
                            )
                            
                            notif_dict = notification.model_dump()
                            notif_dict['created_at'] = notif_dict['created_at'].isoformat()
                            await db.notifications.insert_one(notif_dict)
                            
                            await send_email_notification(
                                user['email'],
                                notification.title,
                                notification.message
                            )
        
        logger.info("Expiry check completed")
    except Exception as e:
        logger.error(f"Error in expiry check: {str(e)}")

scheduler = AsyncIOScheduler()
scheduler.add_job(check_expiries_and_notify, 'interval', hours=24)

@app.on_event("startup")
async def startup_event():
    scheduler.start()
    logger.info("Scheduler started")

@app.on_event("shutdown")
async def shutdown_event():
    scheduler.shutdown()
    client.close()
    logger.info("Application shutdown")

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
