from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, date
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_SERVICE_KEY']

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserProfile(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    currency_preference: str = 'BRL'

class AccountCreate(BaseModel):
    name: str
    account_type: str
    balance: float = 0
    icon: Optional[str] = 'wallet'
    color: Optional[str] = '#10b981'

class Account(BaseModel):
    id: str
    user_id: str
    name: str
    account_type: str
    balance: float
    icon: Optional[str]
    color: Optional[str]
    created_at: str

class CategoryCreate(BaseModel):
    name: str
    icon: Optional[str] = 'circle'
    color: Optional[str] = '#64748b'
    tx_type: str

class Category(BaseModel):
    id: str
    user_id: str
    name: str
    icon: Optional[str]
    color: Optional[str]
    tx_type: str
    is_default: bool

class TransactionCreate(BaseModel):
    account_id: str
    category_id: Optional[str] = None
    amount: float
    tx_date: str
    description: Optional[str] = None
    tx_type: str
    is_recurring: bool = False

class Transaction(BaseModel):
    id: str
    user_id: str
    account_id: str
    category_id: Optional[str]
    amount: float
    tx_date: str
    description: Optional[str]
    tx_type: str
    is_recurring: bool
    created_at: str

class BudgetCreate(BaseModel):
    category_id: str
    limit_amount: float
    period_month: int
    period_year: int

class Budget(BaseModel):
    id: str
    user_id: str
    category_id: str
    limit_amount: float
    period_month: int
    period_year: int
    spent_amount: float

# ============ AUTH DEPENDENCY ============

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace('Bearer ', '')
    
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        logger.error(f"Auth error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Personal Finance Manager API", "status": "online"}

# --- ACCOUNTS ---

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('accounts').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching accounts: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/accounts", response_model=Account)
async def create_account(account: AccountCreate, user_id: str = Depends(get_current_user)):
    try:
        data = account.model_dump()
        data['user_id'] = user_id
        response = supabase.table('accounts').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/accounts/{account_id}", response_model=Account)
async def update_account(account_id: str, account: AccountCreate, user_id: str = Depends(get_current_user)):
    try:
        data = account.model_dump()
        response = supabase.table('accounts').update(data).eq('id', account_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Account not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('accounts').delete().eq('id', account_id).eq('user_id', user_id).execute()
        return {"message": "Account deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- CATEGORIES ---

@api_router.get("/categories", response_model=List[Category])
async def get_categories(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('categories').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching categories: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate, user_id: str = Depends(get_current_user)):
    try:
        data = category.model_dump()
        data['user_id'] = user_id
        data['is_default'] = False
        response = supabase.table('categories').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating category: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- TRANSACTIONS ---

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 100,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    try:
        query = supabase.table('transactions').select('*').eq('user_id', user_id)
        
        if start_date:
            query = query.gte('tx_date', start_date)
        if end_date:
            query = query.lte('tx_date', end_date)
        
        response = query.order('tx_date', desc=True).range(offset, offset + limit - 1).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching transactions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, user_id: str = Depends(get_current_user)):
    try:
        data = transaction.model_dump()
        data['user_id'] = user_id
        response = supabase.table('transactions').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating transaction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: TransactionCreate, user_id: str = Depends(get_current_user)):
    try:
        data = transaction.model_dump()
        response = supabase.table('transactions').update(data).eq('id', transaction_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Transaction not found")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating transaction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('transactions').delete().eq('id', transaction_id).eq('user_id', user_id).execute()
        return {"message": "Transaction deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting transaction: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- BUDGETS ---

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('budgets').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Error fetching budgets: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/budgets", response_model=Budget)
async def create_budget(budget: BudgetCreate, user_id: str = Depends(get_current_user)):
    try:
        data = budget.model_dump()
        data['user_id'] = user_id
        data['spent_amount'] = 0
        response = supabase.table('budgets').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Error creating budget: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- STATS & REPORTS ---

@api_router.get("/stats/summary")
async def get_summary(user_id: str = Depends(get_current_user)):
    try:
        # Get total balance from all accounts
        accounts_response = supabase.table('accounts').select('balance').eq('user_id', user_id).execute()
        total_balance = sum(acc['balance'] for acc in accounts_response.data)
        
        # Get current month transactions
        from datetime import datetime
        current_month = datetime.now().strftime('%Y-%m')
        
        transactions_response = supabase.table('transactions').select('amount, tx_type').eq('user_id', user_id).gte('tx_date', f'{current_month}-01').execute()
        
        total_income = sum(t['amount'] for t in transactions_response.data if t['tx_type'] == 'income')
        total_expenses = sum(t['amount'] for t in transactions_response.data if t['tx_type'] == 'expense')
        
        return {
            "total_balance": total_balance,
            "monthly_income": total_income,
            "monthly_expenses": total_expenses,
            "monthly_savings": total_income - total_expenses
        }
    except Exception as e:
        logger.error(f"Error fetching summary: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/stats/by-category")
async def get_stats_by_category(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    try:
        query = supabase.table('transactions').select('amount, tx_type, category_id').eq('user_id', user_id)
        
        if start_date:
            query = query.gte('tx_date', start_date)
        if end_date:
            query = query.lte('tx_date', end_date)
        
        transactions = query.execute().data
        categories_response = supabase.table('categories').select('id, name, color').eq('user_id', user_id).execute()
        
        category_map = {cat['id']: cat for cat in categories_response.data}
        
        stats = {}
        for tx in transactions:
            cat_id = tx.get('category_id')
            if cat_id and cat_id in category_map:
                if cat_id not in stats:
                    stats[cat_id] = {
                        'category': category_map[cat_id]['name'],
                        'color': category_map[cat_id]['color'],
                        'total': 0
                    }
                stats[cat_id]['total'] += tx['amount']
        
        return list(stats.values())
    except Exception as e:
        logger.error(f"Error fetching category stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)