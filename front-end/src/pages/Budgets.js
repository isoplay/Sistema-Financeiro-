import { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Plus, Edit2, Trash2, AlertTriangle, TrendingDown } from 'lucide-react';
import BudgetForm from '../components/BudgetForm';
import { toast } from 'sonner';

export default function Budgets() {
  const { budgets, categories, transactions, fetchBudgets, fetchCategories, fetchTransactions, deleteBudget } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        await Promise.all([
          fetchBudgets(token),
          fetchCategories(token),
          fetchTransactions(token, { limit: 500 }),
        ]);
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const calculateSpent = (categoryId) => {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const txDate = new Date(t.tx_date);
        return t.category_id === categoryId &&
               t.tx_type === 'expense' &&
               txDate.getMonth() + 1 === currentMonth &&
               txDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  };

  const getCategoryById = (id) => categories.find(c => c.id === id);

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este orçamento?')) return;
    try {
      const token = await getToken();
      await deleteBudget(id, token);
      toast.success('Orçamento excluído com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir orçamento');
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowBudgetForm(true);
  };

  const handleCloseForm = () => {
    setShowBudgetForm(false);
    setEditingBudget(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0" data-testid="budgets-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Orçamentos</h1>
            <p className="text-slate-400">Controle seus gastos mensais por categoria</p>
          </div>
          <Button
            data-testid="add-budget-button"
            onClick={() => setShowBudgetForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Orçamento
          </Button>
        </div>

        {budgets.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <TrendingDown className="w-24 h-24 mb-4 opacity-20 text-slate-500" />
              <p className="text-slate-400 mb-4">Nenhum orçamento definido</p>
              <Button
                onClick={() => setShowBudgetForm(true)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Orçamento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((budget) => {
              const category = getCategoryById(budget.category_id);
              const spent = calculateSpent(budget.category_id);
              const limit = parseFloat(budget.limit_amount);
              const percentage = (spent / limit) * 100;
              const isWarning = percentage >= 80;
              const isOver = percentage >= 100;

              return (
                <Card
                  key={budget.id}
                  className={`bg-slate-800/50 border-slate-700 ${
                    isOver ? 'border-red-500/50' : isWarning ? 'border-yellow-500/50' : ''
                  }`}
                  data-testid={`budget-card-${budget.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category?.color || '#64748b' }}
                        />
                        <CardTitle className="text-lg text-white">
                          {category?.name || 'Sem categoria'}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(budget)}
                          className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 h-8 w-8"
                          data-testid={`edit-budget-${budget.id}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(budget.id)}
                          className="text-slate-400 hover:text-red-400 hover:bg-red-500/10 h-8 w-8"
                          data-testid={`delete-budget-${budget.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-2xl font-bold text-white">
                          R$ {spent.toFixed(2)}
                        </span>
                        <span className="text-sm text-slate-400">
                          de R$ {limit.toFixed(2)}
                        </span>
                      </div>

                      <Progress
                        value={Math.min(percentage, 100)}
                        className="h-3"
                        indicatorClassName={`${
                          isOver
                            ? 'bg-red-500'
                            : isWarning
                            ? 'bg-yellow-500'
                            : 'bg-emerald-500'
                        }`}
                      />

                      <div className="flex items-center justify-between">
                        <span
                          className={`text-sm font-semibold ${
                            isOver ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-emerald-500'
                          }`}
                        >
                          {percentage.toFixed(0)}% utilizado
                        </span>
                        {isOver && (
                          <div className="flex items-center gap-1 text-red-500 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Limite excedido</span>
                          </div>
                        )}
                        {isWarning && !isOver && (
                          <div className="flex items-center gap-1 text-yellow-500 text-xs">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Atenção</span>
                          </div>
                        )}
                      </div>

                      {!isOver && (
                        <div className="pt-2 border-t border-slate-700">
                          <p className="text-xs text-slate-400">
                            Disponível: <span className="font-semibold text-white">R$ {(limit - spent).toFixed(2)}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <BudgetForm
        open={showBudgetForm}
        onClose={handleCloseForm}
        budget={editingBudget}
      />
    </div>
  );
}