import { useState, useEffect } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TransactionForm({ open, onClose }) {
  const { accounts, categories, createTransaction } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [txType, setTxType] = useState('expense');
  const [formData, setFormData] = useState({
    account_id: '',
    category_id: '',
    amount: '',
    tx_date: new Date().toISOString().split('T')[0],
    description: '',
  });

  const filteredCategories = categories.filter(c => c.tx_type === txType);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      await createTransaction(
        {
          ...formData,
          amount: parseFloat(formData.amount),
          tx_type: txType,
        },
        token
      );
      toast.success('Transação criada com sucesso!');
      onClose();
      setFormData({
        account_id: '',
        category_id: '',
        amount: '',
        tx_date: new Date().toISOString().split('T')[0],
        description: '',
      });
    } catch (error) {
      toast.error('Erro ao criar transação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white" data-testid="transaction-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl">Nova Transação</DialogTitle>
          <DialogDescription className="text-slate-400">
            Adicione uma receita ou despesa
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="flex gap-2">
            <Button
              data-testid="transaction-type-expense"
              type="button"
              onClick={() => setTxType('expense')}
              className={`flex-1 ${
                txType === 'expense'
                  ? 'bg-red-500/20 text-red-500 border-red-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              } border-2`}
              variant="outline"
            >
              <ArrowDownCircle className="w-4 h-4 mr-2" />
              Despesa
            </Button>
            <Button
              data-testid="transaction-type-income"
              type="button"
              onClick={() => setTxType('income')}
              className={`flex-1 ${
                txType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              } border-2`}
              variant="outline"
            >
              <ArrowUpCircle className="w-4 h-4 mr-2" />
              Receita
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Valor (R$)</Label>
            <Input
              data-testid="transaction-input-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white text-2xl font-bold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Conta</Label>
            <Select value={formData.account_id} onValueChange={(val) => setFormData({ ...formData, account_id: val })} required>
              <SelectTrigger data-testid="transaction-select-account" className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id} className="text-white">
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Categoria</Label>
            <Select value={formData.category_id} onValueChange={(val) => setFormData({ ...formData, category_id: val })}>
              <SelectTrigger data-testid="transaction-select-category" className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {filteredCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-white">
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Data</Label>
            <Input
              data-testid="transaction-input-date"
              type="date"
              value={formData.tx_date}
              onChange={(e) => setFormData({ ...formData, tx_date: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Descrição (opcional)</Label>
            <Input
              data-testid="transaction-input-description"
              placeholder="Ex: Supermercado"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              data-testid="transaction-cancel-button"
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              data-testid="transaction-submit-button"
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}