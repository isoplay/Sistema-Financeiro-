-- ============================================
-- FINANCE APP V2.0 - SCHEMA COMPLETO
-- ============================================

-- NOTA: accounts ja existe, vamos apenas adicionar colunas se necessario
ALTER TABLE public.accounts 
  ADD COLUMN IF NOT EXISTS color VARCHAR(50) DEFAULT '#10b981';

-- Nova tabela: Metas Financeiras
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    icon VARCHAR(100) DEFAULT 'target',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Nova tabela: Transacoes Recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    tx_type VARCHAR(20) CHECK (tx_type IN ('income', 'expense')),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
    day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Atualizar tabela transactions com novas colunas
ALTER TABLE public.transactions 
  ADD COLUMN IF NOT EXISTS attachment_url TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user_id ON public.recurring_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tags ON public.transactions USING GIN(tags);

-- Habilitar RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

-- Policies para GOALS
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
CREATE POLICY "Users can view their own goals" 
    ON public.goals FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own goals" ON public.goals;
CREATE POLICY "Users can create their own goals" 
    ON public.goals FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
CREATE POLICY "Users can update their own goals" 
    ON public.goals FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;
CREATE POLICY "Users can delete their own goals" 
    ON public.goals FOR DELETE 
    USING (auth.uid() = user_id);

-- Policies para RECURRING_TRANSACTIONS
DROP POLICY IF EXISTS "Users can view their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can view their own recurring" 
    ON public.recurring_transactions FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can create their own recurring" 
    ON public.recurring_transactions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can update their own recurring" 
    ON public.recurring_transactions FOR UPDATE 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own recurring" ON public.recurring_transactions;
CREATE POLICY "Users can delete their own recurring" 
    ON public.recurring_transactions FOR DELETE 
    USING (auth.uid() = user_id);

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_goals_updated_at ON public.goals;
CREATE TRIGGER update_goals_updated_at BEFORE UPDATE ON public.goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_updated_at ON public.recurring_transactions;
CREATE TRIGGER update_recurring_updated_at BEFORE UPDATE ON public.recurring_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
