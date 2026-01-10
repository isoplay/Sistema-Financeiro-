import { useEffect, useState } from 'react';
import { useFinanceStore } from '../stores/financeStore';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports() {
  const { transactions, fetchTransactions } = useFinanceStore();
  const { getToken } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await getToken();
        const startDate = format(subMonths(new Date(), 5), 'yyyy-MM-dd');
        await fetchTransactions(token, { limit: 500, start_date: startDate });
      } catch (error) {
        console.error('Error loading reports:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Calculate monthly stats for last 6 months
    const monthsData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.tx_date);
        return txDate >= monthStart && txDate <= monthEnd;
      });

      const income = monthTransactions
        .filter(tx => tx.tx_type === 'income')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      const expenses = monthTransactions
        .filter(tx => tx.tx_type === 'expense')
        .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

      monthsData.push({
        month: format(monthDate, 'MMM', { locale: ptBR }),
        income,
        expenses,
        balance: income - expenses,
      });
    }
    setMonthlyData(monthsData);
  }, [transactions]);

  const totalIncome = monthlyData.reduce((sum, m) => sum + m.income, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const averageBalance = (totalIncome - totalExpenses) / (monthlyData.length || 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="pb-20 lg:pb-0" data-testid="reports-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Relatórios</h1>
          <p className="text-slate-400">Análise detalhada das suas finanças</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-800/50 border-slate-700" data-testid="total-income-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                Receitas (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-500">
                R$ {totalIncome.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="total-expenses-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                Despesas (6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                R$ {totalExpenses.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700" data-testid="average-balance-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Saldo Médio/Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${averageBalance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                R$ {averageBalance.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card className="bg-slate-800/50 border-slate-700" data-testid="monthly-chart-card">
          <CardHeader>
            <CardTitle className="text-white">Evolução Mensal (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                    formatter={(value) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10b981" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" name="Despesas" fill="#ef4444" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-96 text-slate-500">
                Nenhum dado para exibir
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Details Table */}
        <Card className="mt-6 bg-slate-800/50 border-slate-700" data-testid="monthly-details-card">
          <CardHeader>
            <CardTitle className="text-white">Detalhes Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Mês</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Receitas</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Despesas</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((month, idx) => (
                    <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/50" data-testid={`month-row-${idx}`}>
                      <td className="py-3 px-4 text-white font-medium capitalize">{month.month}</td>
                      <td className="py-3 px-4 text-right text-emerald-500 font-semibold">
                        R$ {month.income.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-500 font-semibold">
                        R$ {month.expenses.toFixed(2)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        month.balance >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        R$ {month.balance.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}