import { useState, useEffect } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';

export default function BudgetForm({ open, onClose, budget = null }) {
  const { categories, createBudget, updateBudget } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    limit_amount: '',
    period_month: new Date().getMonth() + 1,
    period_year: new Date().getFullYear(),
  });

  useEffect(() => {
    if (budget) {
      setFormData({
        category_id: budget.category_id,
        limit_amount: budget.limit_amount,
        period_month: budget.period_month,
        period_year: budget.period_year,
      });
    } else {
      setFormData({
        category_id: '',
        limit_amount: '',
        period_month: new Date().getMonth() + 1,
        period_year: new Date().getFullYear(),
      });
    }
  }, [budget, open]);

  const expenseCategories = categories.filter(c => c.tx_type === 'expense');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();
      const data = {
        ...formData,
        limit_amount: parseFloat(formData.limit_amount),
        period_month: parseInt(formData.period_month),
        period_year: parseInt(formData.period_year),
      };

      if (budget) {
        await updateBudget(budget.id, data, token);
        toast.success('Orçamento atualizado com sucesso!');
      } else {
        await createBudget(data, token);
        toast.success('Orçamento criado com sucesso!');
      }
      
      onClose();
    } catch (error) {
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-slate-900 border-slate-800 text-white" data-testid="budget-form-dialog">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {budget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Defina um limite de gastos para uma categoria
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">Categoria de Despesa</Label>
            <Select
              value={formData.category_id}
              onValueChange={(val) => setFormData({ ...formData, category_id: val })}
              required
            >
              <SelectTrigger data-testid="budget-select-category" className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id} className="text-white">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Limite Mensal (R$)</Label>
            <Input
              data-testid="budget-input-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="500.00"
              value={formData.limit_amount}
              onChange={(e) => setFormData({ ...formData, limit_amount: e.target.value })}
              required
              className="bg-slate-800 border-slate-700 text-white text-xl font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Mês</Label>
              <Select
                value={formData.period_month.toString()}
                onValueChange={(val) => setFormData({ ...formData, period_month: parseInt(val) })}
              >
                <SelectTrigger data-testid="budget-select-month" className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()} className="text-white">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Ano</Label>
              <Input
                data-testid="budget-input-year"
                type="number"
                min="2020"
                max="2050"
                value={formData.period_year}
                onChange={(e) => setFormData({ ...formData, period_year: e.target.value })}
                required
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              data-testid="budget-cancel-button"
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              data-testid="budget-submit-button"
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