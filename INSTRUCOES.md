# 🚀 Personal Finance Manager - Instruções de Configuração

## ✅ Status Atual
- ✅ Backend FastAPI configurado e rodando
- ✅ Frontend React configurado e rodando
- ✅ Dependências instaladas (Supabase, Zustand, Recharts, Dexie)
- ✅ PWA configurado (manifest.json, service worker)
- ⏳ **PENDENTE: Executar schema SQL no Supabase**

---

## 📋 PASSO OBRIGATÓRIO: Configurar Banco de Dados Supabase

### 1. Acesse o Dashboard do Supabase
Vá para: https://supabase.com/dashboard/project/mdnrlmxclhwwesrjsjia

### 2. Abra o SQL Editor
- No menu lateral, clique em **SQL Editor**
- Clique em **+ New Query**

### 3. Execute o Schema SQL
Copie e cole o conteúdo completo do arquivo `/app/supabase_schema.sql` no editor SQL e clique em **RUN**.

O schema criará:
- ✅ Tabelas: users, accounts, categories, transactions, budgets
- ✅ Row-Level Security (RLS) policies
- ✅ Triggers automáticos (atualização de saldo, criação de dados padrão)
- ✅ Categorias e conta padrão para novos usuários

---

## 🎯 Como Usar o Aplicativo

### 1. Acesse o App
Abra: https://budgetpwa-2.preview.emergentagent.com

### 2. Criar Conta
- Clique em **"Criar Conta"**
- Preencha: Nome, Email, Senha
- **Importante**: Verifique seu email para confirmar a conta (se configurado no Supabase)

### 3. Funcionalidades Principais

#### 📊 Dashboard
- Visualize saldo total de todas as contas
- Acompanhe receitas e despesas mensais
- Gráfico de gastos por categoria (Donut Chart)
- Últimas 5 transações

#### 💸 Transações
- Adicione receitas e despesas
- Categorize suas transações
- Pesquise e filtre histórico
- Exclua transações indesejadas

#### 📈 Relatórios
- Gráfico de barras: Evolução de 6 meses
- Compare receitas vs despesas
- Visualize saldo médio mensal

#### ⚙️ Configurações
- Visualize informações da conta
- Exporte dados em CSV
- Sincronize dados offline
- Faça logout

---

## 📱 PWA - Progressive Web App

### Instalar no Celular (Android)
1. Abra o app no Chrome
2. Toque no menu (⋮) 
3. Selecione **"Adicionar à tela inicial"** ou **"Instalar app"**
4. Pronto! O app funcionará como aplicativo nativo

### Instalar no iPhone (iOS)
1. Abra o app no Safari
2. Toque no botão de compartilhar
3. Selecione **"Adicionar à Tela de Início"**
4. Toque em **"Adicionar"**

### Instalar no Desktop
1. Abra no Chrome/Edge
2. Clique no ícone de instalação (➕) na barra de endereço
3. Clique em **"Instalar"**

---

## 🎨 Design

### Cores
- **Primary**: Emerald Green (#10b981)
- **Background**: Slate Dark (#0f172a, #1e293b)
- **Accent**: Slate (#64748b)

### Tipografia
- **Headings**: Work Sans (bold, modern)
- **Body**: Manrope (clean, professional)

### Responsividade
- **Mobile**: Bottom Navigation Bar (menu inferior fixo)
- **Desktop**: Sidebar lateral esquerda
- Design mobile-first com breakpoints otimizados

---

## 🔒 Segurança

### Autenticação
- JWT tokens via Supabase Auth
- Row-Level Security (RLS) no PostgreSQL
- Cada usuário acessa apenas seus próprios dados

### Offline-First
- Dados armazenados localmente com Dexie (IndexedDB)
- Sincronização automática quando online
- Fila de operações offline

---

## 🧪 Testando o App

### Teste 1: Criar Conta e Login
```bash
# O frontend estará disponível em:
https://budgetpwa-2.preview.emergentagent.com
```

### Teste 2: Backend API
```bash
# Teste o backend diretamente:
curl https://budgetpwa-2.preview.emergentagent.com/api/
# Resposta esperada: {"message": "Personal Finance Manager API", "status": "online"}
```

---

## 🐛 Troubleshooting

### Problema: Erro ao criar transação
**Solução**: Certifique-se de que o schema SQL foi executado no Supabase.

### Problema: Não consigo fazer login
**Solução**: 
1. Verifique se confirmou o email (se email verification estiver ativo)
2. Acesse Supabase Dashboard → Authentication → Users para ver se o usuário foi criado

### Problema: Dados não sincronizam
**Solução**: 
1. Verifique sua conexão com internet
2. Clique em "Sincronizar Agora" na página de Configurações

---

## 📊 Estrutura do Projeto

```
/app/
├── backend/
│   ├── server.py          # FastAPI + Supabase integration
│   ├── .env               # Credenciais Supabase (backend)
│   └── requirements.txt   # Dependências Python
├── frontend/
│   ├── public/
│   │   └── manifest.json  # PWA manifest
│   ├── src/
│   │   ├── lib/
│   │   │   ├── supabase.js  # Cliente Supabase
│   │   │   └── db.js        # Dexie (offline storage)
│   │   ├── stores/
│   │   │   ├── authStore.js     # Zustand auth state
│   │   │   └── financeStore.js  # Zustand finance state
│   │   ├── components/
│   │   │   ├── AuthForm.js
│   │   │   ├── BottomNav.js
│   │   │   ├── TransactionForm.js
│   │   │   └── CategoryBadge.js
│   │   ├── pages/
│   │   │   ├── Dashboard.js
│   │   │   ├── Transactions.js
│   │   │   ├── Reports.js
│   │   │   └── Settings.js
│   │   ├── App.js
│   │   ├── App.css
│   │   └── service-worker.js  # PWA service worker
│   ├── .env               # Credenciais Supabase (frontend)
│   └── craco.config.js    # PWA config
└── supabase_schema.sql    # ⚠️ EXECUTE ESTE ARQUIVO NO SUPABASE
```

---

## 🎉 Próximos Passos (Melhorias Futuras)

1. **Budgets (Orçamentos)**:
   - Criar interface para definir limites de gastos por categoria
   - Alertas quando aproximar do limite

2. **Metas Financeiras**:
   - Definir objetivos de economia
   - Tracker de progresso

3. **Notificações Push**:
   - Lembrete de transações recorrentes
   - Alertas de gastos altos

4. **Exportação Avançada**:
   - PDF com relatórios formatados
   - Gráficos exportáveis

5. **Multi-moeda**:
   - Suporte a diferentes moedas
   - Conversão automática

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do backend: `tail -f /var/log/supervisor/backend.err.log`
2. Verifique os logs do frontend: `tail -f /var/log/supervisor/frontend.err.log`
3. Confirme que o schema SQL foi executado corretamente no Supabase

---

**Desenvolvido com ❤️ usando:**
- React 19 + Vite
- FastAPI
- Supabase (PostgreSQL + Auth)
- Zustand (State Management)
- Recharts (Data Visualization)
- Dexie (Offline Storage)
- Tailwind CSS + Shadcn/UI
- PWA (Progressive Web App)
