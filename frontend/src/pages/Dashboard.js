import { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { Button } from '../components/ui/button';
import TransactionForm from '../components/TransactionForm';
import CategoryBadge from '../components/CategoryBadge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Dashboard() {
  const { 
    accounts, 
    categories, 
    transactions, 
    summary, 
    fetchAccounts, 
    fetchCategories, 
    fetchTransactions, 
    fetchSummary 
  } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        await Promise.all([
          fetchAccounts(token),
          fetchCategories(token),
          fetchTransactions(token, { limit: 5 }),
          fetchSummary(token),
        ]);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalBalance = summary?.total_balance || 0;
  const monthlyIncome = summary?.monthly_income || 0;
  const monthlyExpenses = summary?.monthly_expenses || 0;

  // Prepare data for pie chart
  const expenseCategories = categories.filter(c => c.tx_type === 'expense');
  const expensesByCategory = expenseCategories.map(cat => {
    const total = transactions
      .filter(t => t.category_id === cat.id && t.tx_type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return {
      name: cat.name,
      value: total,
      color: cat.color,
    };
  }).filter(item => item.value > 0);

  const getCategoryById = (id) => categories.find(c => c.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Dashboard</h1>
            <p className="text-slate-400">Visão geral das suas finanças</p>
          </div>
          <Button
            data-testid="add-transaction-fab"
            onClick={() => setShowTransactionForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full w-14 h-14 lg:w-auto lg:h-auto lg:rounded-xl lg:px-6"
          >
            <Plus className="w-6 h-6 lg:mr-2" />
            <span className="hidden lg:inline">Nova Transação</span>
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 border-0" data-testid="total-balance-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-white/80 text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Saldo Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl sm:text-4xl font-bold text-white" data-testid="total-balance-value">
                R$ {totalBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="monthly-income-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                Receitas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-emerald-500" data-testid="monthly-income-value">
                R$ {monthlyIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="monthly-expenses-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <ArrowDownCircle className="w-4 h-4 text-red-500" />
                Despesas do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-500" data-testid="monthly-expenses-value">
                R$ {monthlyExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <Card className="bg-slate-800/50 border-slate-700" data-testid="expenses-chart-card">
            <CardHeader>
              <CardTitle className="text-white">Despesas por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.name}: R$ ${entry.value.toFixed(0)}`}
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#fff',
                      }}
                      formatter={(value) => `R$ ${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Receipt className="w-24 h-24 mb-4 opacity-20" />
                  <p>Nenhuma despesa registrada</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-slate-800/50 border-slate-700" data-testid="recent-transactions-card">
            <CardHeader>
              <CardTitle className="text-white">Transações Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {transactions.slice(0, 5).map((tx) => {
                  const category = getCategoryById(tx.category_id);
                  return (
                    <div
                      key={tx.id}
                      data-testid={`transaction-item-${tx.id}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CategoryBadge category={category} />
                        </div>
                        <p className="text-sm text-slate-400">
                          {tx.description || 'Sem descrição'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {format(new Date(tx.tx_date), 'dd MMM yyyy', { locale: ptBR })}
                        </p>
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          tx.tx_type === 'income' ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {tx.tx_type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toFixed(2)}
                      </div>
                    </div>
                  );
                })}
                {transactions.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <Wallet className="w-24 h-24 mb-4 opacity-20" />
                    <p className="mb-2">Nenhuma transação ainda</p>
                    <Button
                      onClick={() => setShowTransactionForm(true)}
                      className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white"
                    >
                      Adicionar primeira transação
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionForm open={showTransactionForm} onClose={() => setShowTransactionForm(false)} />
    </div>
  );
}