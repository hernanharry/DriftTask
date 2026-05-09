from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta, timezone
import bcrypt
from jose import JWTError, jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_HOURS = int(os.environ.get('JWT_EXPIRE_HOURS', 168))

app = FastAPI(title="Driftask CRM API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()


# ---------------- MODELS ----------------
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    full_name: str = Field(..., min_length=1, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserPublic(BaseModel):
    id: str
    email: str
    full_name: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    position: Optional[str] = None
    avatar: Optional[str] = None
    notes: Optional[str] = None


class Contact(ContactCreate):
    id: str
    user_id: str
    created_at: datetime


class DealCreate(BaseModel):
    title: str
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    value: float = 0.0
    stage: str = "lead"  # lead | qualified | proposal | negotiation | won | lost
    notes: Optional[str] = None


class Deal(DealCreate):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime


class DealUpdate(BaseModel):
    title: Optional[str] = None
    contact_id: Optional[str] = None
    contact_name: Optional[str] = None
    value: Optional[float] = None
    stage: Optional[str] = None
    notes: Optional[str] = None


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: bool = False
    priority: str = "medium"  # low | medium | high
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None


class Task(TaskCreate):
    id: str
    user_id: str
    created_at: datetime


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None


class NoteCreate(BaseModel):
    content: str
    contact_id: Optional[str] = None
    deal_id: Optional[str] = None


class Note(NoteCreate):
    id: str
    user_id: str
    created_at: datetime


# ---------------- HELPERS ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        payload = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def serialize(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ---------------- AUTH ROUTES ----------------
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(payload: UserRegister):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": payload.email.lower(),
        "password": hash_password(payload.password),
        "full_name": payload.full_name,
        "created_at": datetime.now(timezone.utc),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token({"sub": user_id})
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user_id,
            email=user_doc["email"],
            full_name=user_doc["full_name"],
            created_at=user_doc["created_at"],
        ),
    )


@api_router.post("/auth/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user["id"]})
    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=user["id"],
            email=user["email"],
            full_name=user["full_name"],
            created_at=user["created_at"],
        ),
    )


@api_router.get("/auth/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return UserPublic(**user)


# ---------------- CONTACTS ----------------
@api_router.post("/contacts", response_model=Contact)
async def create_contact(payload: ContactCreate, user=Depends(get_current_user)):
    contact_id = str(uuid.uuid4())
    doc = {
        "id": contact_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc),
        **payload.dict(),
    }
    await db.contacts.insert_one(doc)
    return Contact(**serialize(doc))


@api_router.get("/contacts", response_model=List[Contact])
async def list_contacts(user=Depends(get_current_user)):
    cursor = db.contacts.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return [Contact(**doc) async for doc in cursor]


@api_router.get("/contacts/{contact_id}", response_model=Contact)
async def get_contact(contact_id: str, user=Depends(get_current_user)):
    doc = await db.contacts.find_one({"id": contact_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Contact not found")
    return Contact(**doc)


@api_router.delete("/contacts/{contact_id}")
async def delete_contact(contact_id: str, user=Depends(get_current_user)):
    res = await db.contacts.delete_one({"id": contact_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Contact not found")
    return {"ok": True}


# ---------------- DEALS / PIPELINE ----------------
@api_router.post("/deals", response_model=Deal)
async def create_deal(payload: DealCreate, user=Depends(get_current_user)):
    deal_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    doc = {
        "id": deal_id,
        "user_id": user["id"],
        "created_at": now,
        "updated_at": now,
        **payload.dict(),
    }
    await db.deals.insert_one(doc)
    return Deal(**serialize(doc))


@api_router.get("/deals", response_model=List[Deal])
async def list_deals(user=Depends(get_current_user)):
    cursor = db.deals.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return [Deal(**doc) async for doc in cursor]


@api_router.patch("/deals/{deal_id}", response_model=Deal)
async def update_deal(deal_id: str, payload: DealUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc)
    res = await db.deals.find_one_and_update(
        {"id": deal_id, "user_id": user["id"]},
        {"$set": update},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Deal not found")
    return Deal(**res)


@api_router.delete("/deals/{deal_id}")
async def delete_deal(deal_id: str, user=Depends(get_current_user)):
    res = await db.deals.delete_one({"id": deal_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Deal not found")
    return {"ok": True}


# ---------------- TASKS ----------------
@api_router.post("/tasks", response_model=Task)
async def create_task(payload: TaskCreate, user=Depends(get_current_user)):
    task_id = str(uuid.uuid4())
    doc = {
        "id": task_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc),
        **payload.dict(),
    }
    await db.tasks.insert_one(doc)
    return Task(**serialize(doc))


@api_router.get("/tasks", response_model=List[Task])
async def list_tasks(user=Depends(get_current_user)):
    cursor = db.tasks.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return [Task(**doc) async for doc in cursor]


@api_router.patch("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, payload: TaskUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.dict().items() if v is not None}
    res = await db.tasks.find_one_and_update(
        {"id": task_id, "user_id": user["id"]},
        {"$set": update},
        return_document=True,
        projection={"_id": 0},
    )
    if not res:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**res)


@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user=Depends(get_current_user)):
    res = await db.tasks.delete_one({"id": task_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"ok": True}


# ---------------- NOTES ----------------
@api_router.post("/notes", response_model=Note)
async def create_note(payload: NoteCreate, user=Depends(get_current_user)):
    note_id = str(uuid.uuid4())
    doc = {
        "id": note_id,
        "user_id": user["id"],
        "created_at": datetime.now(timezone.utc),
        **payload.dict(),
    }
    await db.notes.insert_one(doc)
    return Note(**serialize(doc))


@api_router.get("/notes", response_model=List[Note])
async def list_notes(
    contact_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    user=Depends(get_current_user),
):
    query = {"user_id": user["id"]}
    if contact_id:
        query["contact_id"] = contact_id
    if deal_id:
        query["deal_id"] = deal_id
    cursor = db.notes.find(query, {"_id": 0}).sort("created_at", -1)
    return [Note(**doc) async for doc in cursor]


# ---------------- DASHBOARD ----------------
@api_router.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    total_contacts = await db.contacts.count_documents({"user_id": user["id"]})
    total_deals = await db.deals.count_documents({"user_id": user["id"]})
    won_deals = await db.deals.count_documents({"user_id": user["id"], "stage": "won"})
    open_tasks = await db.tasks.count_documents({"user_id": user["id"], "completed": False})

    revenue_cursor = db.deals.find(
        {"user_id": user["id"], "stage": "won"}, {"_id": 0, "value": 1}
    )
    revenue = 0.0
    async for d in revenue_cursor:
        revenue += float(d.get("value") or 0)

    pipeline_cursor = db.deals.find(
        {"user_id": user["id"]}, {"_id": 0, "value": 1, "stage": 1}
    )
    pipeline_value = 0.0
    by_stage = {}
    async for d in pipeline_cursor:
        v = float(d.get("value") or 0)
        pipeline_value += v
        s = d.get("stage", "lead")
        by_stage[s] = by_stage.get(s, 0) + 1

    conversion = round((won_deals / total_deals) * 100, 1) if total_deals else 0.0

    return {
        "total_contacts": total_contacts,
        "total_deals": total_deals,
        "won_deals": won_deals,
        "open_tasks": open_tasks,
        "revenue": revenue,
        "pipeline_value": pipeline_value,
        "conversion_rate": conversion,
        "deals_by_stage": by_stage,
    }


@api_router.get("/")
async def root():
    return {"app": "Driftask CRM", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
