from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
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

class TransactionCreate(BaseModel):
    account_id: str
    category_id: Optional[str] = None
    amount: float
    tx_date: str
    description: Optional[str] = None
    tx_type: str
    is_recurring: bool = False
    attachment_url: Optional[str] = None
    tags: Optional[List[str]] = []

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
    attachment_url: Optional[str]
    tags: Optional[List[str]]
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

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0
    deadline: Optional[str] = None
    icon: Optional[str] = 'target'

class Goal(BaseModel):
    id: str
    user_id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: Optional[str]
    icon: Optional[str]
    created_at: str

class RecurringCreate(BaseModel):
    description: str
    amount: float
    tx_type: str
    category_id: Optional[str] = None
    account_id: Optional[str] = None
    day_of_month: int
    active: bool = True

class Recurring(BaseModel):
    id: str
    user_id: str
    description: str
    amount: float
    tx_type: str
    category_id: Optional[str]
    account_id: Optional[str]
    day_of_month: int
    active: bool
    created_at: str

# ============ AUTH ============

async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Token inválido")
    
    token = authorization.replace('Bearer ', '')
    
    try:
        user = supabase.auth.get_user(token)
        return user.user.id
    except Exception as e:
        logger.error(f"Erro de autenticação: {str(e)}")
        raise HTTPException(status_code=401, detail="Token inválido")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Finance App V2.0 API", "status": "online"}

# --- ACCOUNTS ---

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('accounts').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar contas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/accounts", response_model=Account)
async def create_account(account: AccountCreate, user_id: str = Depends(get_current_user)):
    try:
        data = account.model_dump()
        data['user_id'] = user_id
        response = supabase.table('accounts').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar conta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/accounts/{account_id}", response_model=Account)
async def update_account(account_id: str, account: AccountCreate, user_id: str = Depends(get_current_user)):
    try:
        data = account.model_dump()
        response = supabase.table('accounts').update(data).eq('id', account_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Conta não encontrada")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar conta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table('accounts').delete().eq('id', account_id).eq('user_id', user_id).execute()
        return {"message": "Conta deletada"}
    except Exception as e:
        logger.error(f"Erro ao deletar conta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- CATEGORIES ---

@api_router.get("/categories")
async def get_categories(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('categories').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar categorias: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- TRANSACTIONS ---

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    limit: int = 100,
    offset: int = 0,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    account_id: Optional[str] = None,
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    try:
        query = supabase.table('transactions').select('*').eq('user_id', user_id)
        
        if start_date:
            query = query.gte('tx_date', start_date)
        if end_date:
            query = query.lte('tx_date', end_date)
        if account_id:
            query = query.eq('account_id', account_id)
        
        response = query.order('tx_date', desc=True).range(offset, offset + limit - 1).execute()
        
        transactions = response.data
        if search and transactions:
            search_lower = search.lower()
            transactions = [
                t for t in transactions 
                if (t.get('description') and search_lower in t['description'].lower()) or
                   (t.get('tags') and any(search_lower in tag.lower() for tag in t.get('tags', [])))
            ]
        
        return transactions
    except Exception as e:
        logger.error(f"Erro ao buscar transações: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate, user_id: str = Depends(get_current_user)):
    try:
        data = transaction.model_dump()
        data['user_id'] = user_id
        response = supabase.table('transactions').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar transação: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/transactions/{transaction_id}", response_model=Transaction)
async def update_transaction(transaction_id: str, transaction: TransactionCreate, user_id: str = Depends(get_current_user)):
    try:
        data = transaction.model_dump()
        response = supabase.table('transactions').update(data).eq('id', transaction_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Transação não encontrada")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar transação: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table('transactions').delete().eq('id', transaction_id).eq('user_id', user_id).execute()
        return {"message": "Transação deletada"}
    except Exception as e:
        logger.error(f"Erro ao deletar transação: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- BUDGETS ---

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('budgets').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar orçamentos: {str(e)}")
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
        logger.error(f"Erro ao criar orçamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/budgets/{budget_id}", response_model=Budget)
async def update_budget(budget_id: str, budget: BudgetCreate, user_id: str = Depends(get_current_user)):
    try:
        data = budget.model_dump()
        response = supabase.table('budgets').update(data).eq('id', budget_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Orçamento não encontrado")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar orçamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table('budgets').delete().eq('id', budget_id).eq('user_id', user_id).execute()
        return {"message": "Orçamento deletado"}
    except Exception as e:
        logger.error(f"Erro ao deletar orçamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- GOALS ---

@api_router.get("/goals", response_model=List[Goal])
async def get_goals(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('goals').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar metas: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/goals", response_model=Goal)
async def create_goal(goal: GoalCreate, user_id: str = Depends(get_current_user)):
    try:
        data = goal.model_dump()
        data['user_id'] = user_id
        response = supabase.table('goals').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar meta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/goals/{goal_id}", response_model=Goal)
async def update_goal(goal_id: str, goal: GoalCreate, user_id: str = Depends(get_current_user)):
    try:
        data = goal.model_dump()
        response = supabase.table('goals').update(data).eq('id', goal_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Meta não encontrada")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar meta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table('goals').delete().eq('id', goal_id).eq('user_id', user_id).execute()
        return {"message": "Meta deletada"}
    except Exception as e:
        logger.error(f"Erro ao deletar meta: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- RECURRING TRANSACTIONS ---

@api_router.get("/recurring", response_model=List[Recurring])
async def get_recurring(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table('recurring_transactions').select('*').eq('user_id', user_id).execute()
        return response.data
    except Exception as e:
        logger.error(f"Erro ao buscar recorrentes: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/recurring", response_model=Recurring)
async def create_recurring(recurring: RecurringCreate, user_id: str = Depends(get_current_user)):
    try:
        data = recurring.model_dump()
        data['user_id'] = user_id
        response = supabase.table('recurring_transactions').insert(data).execute()
        return response.data[0]
    except Exception as e:
        logger.error(f"Erro ao criar recorrente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/recurring/{recurring_id}", response_model=Recurring)
async def update_recurring(recurring_id: str, recurring: RecurringCreate, user_id: str = Depends(get_current_user)):
    try:
        data = recurring.model_dump()
        response = supabase.table('recurring_transactions').update(data).eq('id', recurring_id).eq('user_id', user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Recorrente não encontrado")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atualizar recorrente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/recurring/{recurring_id}")
async def delete_recurring(recurring_id: str, user_id: str = Depends(get_current_user)):
    try:
        supabase.table('recurring_transactions').delete().eq('id', recurring_id).eq('user_id', user_id).execute()
        return {"message": "Recorrente deletado"}
    except Exception as e:
        logger.error(f"Erro ao deletar recorrente: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- DASHBOARD & STATS ---

@api_router.get("/stats/summary")
async def get_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    user_id: str = Depends(get_current_user)
):
    try:
        accounts_response = supabase.table('accounts').select('balance').eq('user_id', user_id).execute()
        total_balance = sum(acc['balance'] for acc in accounts_response.data)
        
        if not start_date or not end_date:
            current_month = datetime.now().strftime('%Y-%m')
            start_date = f'{current_month}-01'
            end_date = datetime.now().strftime('%Y-%m-%d')
        
        transactions_response = supabase.table('transactions').select('amount, tx_type, tx_date').eq('user_id', user_id).gte('tx_date', start_date).lte('tx_date', end_date).execute()
        
        total_income = sum(t['amount'] for t in transactions_response.data if t['tx_type'] == 'income')
        total_expenses = sum(t['amount'] for t in transactions_response.data if t['tx_type'] == 'expense')
        
        # Calcular periodo anterior para comparacao
        start_dt = datetime.strptime(start_date, '%Y-%m-%d')
        end_dt = datetime.strptime(end_date, '%Y-%m-%d')
        period_days = (end_dt - start_dt).days
        
        prev_start = (start_dt - timedelta(days=period_days)).strftime('%Y-%m-%d')
        prev_end = start_dt.strftime('%Y-%m-%d')
        
        prev_transactions = supabase.table('transactions').select('amount, tx_type').eq('user_id', user_id).gte('tx_date', prev_start).lt('tx_date', prev_end).execute()
        
        prev_income = sum(t['amount'] for t in prev_transactions.data if t['tx_type'] == 'income')
        prev_expenses = sum(t['amount'] for t in prev_transactions.data if t['tx_type'] == 'expense')
        
        income_change = ((total_income - prev_income) / prev_income * 100) if prev_income > 0 else 0
        expense_change = ((total_expenses - prev_expenses) / prev_expenses * 100) if prev_expenses > 0 else 0
        balance_change = ((total_income - total_expenses) - (prev_income - prev_expenses)) / abs(prev_income - prev_expenses) * 100 if abs(prev_income - prev_expenses) > 0 else 0
        
        return {
            "total_balance": total_balance,
            "monthly_income": total_income,
            "monthly_expenses": total_expenses,
            "monthly_savings": total_income - total_expenses,
            "income_change_percent": round(income_change, 1),
            "expense_change_percent": round(expense_change, 1),
            "balance_change_percent": round(balance_change, 1),
        }
    except Exception as e:
        logger.error(f"Erro ao buscar resumo: {str(e)}")
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
        logger.error(f"Erro ao buscar stats por categoria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
