import { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Plus, Trash2, Search } from 'lucide-react';
import TransactionForm from '../components/TransactionForm';
import CategoryBadge from '../components/CategoryBadge';
import { Input } from '../components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Transactions() {
  const { transactions, categories, fetchTransactions, deleteTransaction } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        await fetchTransactions(token, { limit: 100 });
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const getCategoryById = (id) => categories.find(c => c.id === id);

  const filteredTransactions = transactions.filter(tx => {
    const category = getCategoryById(tx.category_id);
    const searchLower = searchTerm.toLowerCase();
    return (
      (tx.description?.toLowerCase().includes(searchLower)) ||
      (category?.name?.toLowerCase().includes(searchLower))
    );
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir esta transação?')) return;
    try {
      const token = await getToken();
      await deleteTransaction(id, token);
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      toast.error('Erro ao excluir transação');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0" data-testid="transactions-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Transações</h1>
            <p className="text-slate-400">Histórico completo de receitas e despesas</p>
          </div>
          <Button
            data-testid="add-transaction-button"
            onClick={() => setShowTransactionForm(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nova Transação
          </Button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              data-testid="transaction-search-input"
              type="text"
              placeholder="Buscar por descrição ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.map((tx) => {
            const category = getCategoryById(tx.category_id);
            return (
              <Card key={tx.id} data-testid={`transaction-card-${tx.id}`} className="bg-slate-800/50 border-slate-700 hover:bg-slate-800 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CategoryBadge category={category} />
                        <span className="text-xs text-slate-500">
                          {format(new Date(tx.tx_date), 'dd MMM yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-white font-medium">
                        {tx.description || 'Sem descrição'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-xl font-bold ${
                          tx.tx_type === 'income' ? 'text-emerald-500' : 'text-red-500'
                        }`}
                      >
                        {tx.tx_type === 'income' ? '+' : '-'} R$ {parseFloat(tx.amount).toFixed(2)}
                      </div>
                      <Button
                        data-testid={`delete-transaction-${tx.id}`}
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(tx.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filteredTransactions.length === 0 && (
            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <p className="text-slate-400 mb-4">
                  {searchTerm ? 'Nenhuma transação encontrada' : 'Nenhuma transação registrada'}
                </p>
                {!searchTerm && (
                  <Button
                    onClick={() => setShowTransactionForm(true)}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Adicionar Transação
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <TransactionForm open={showTransactionForm} onClose={() => setShowTransactionForm(false)} />
    </div>
  );
}