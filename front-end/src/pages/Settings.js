import { useAuthStore } from '../stores/authStore';
import { useFinanceStore } from '../stores/financeStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { LogOut, User, Download, Moon, Sun, Wifi, WifiOff, Copy } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { processSyncQueue } from '../lib/db';
import axios from 'axios';
import { config } from '../config';

export default function Settings() {
  const { user, signOut, getToken } = useAuthStore();
  const { isOnline, setOnlineStatus } = useFinanceStore();
  const [darkMode, setDarkMode] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const handleCopyId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      toast.success('ID copiado para área de transferência!');
    }
  };

  const handleExport = async () => {
    try {
      const token = await getToken();
      const API = config.backendUrl;
      
      const { data: transactions } = await axios.get(`${API}/transactions?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const csv = [
        ['Data', 'Tipo', 'Valor', 'Descrição', 'Categoria'],
        ...transactions.map(tx => [
          tx.tx_date,
          tx.tx_type === 'income' ? 'Receita' : 'Despesa',
          tx.amount,
          tx.description || '',
          tx.category_id || '',
        ]),
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financas_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar dados');
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await processSyncQueue(axios, getToken);
      toast.success('Sincronização concluída!');
    } catch (error) {
      toast.error('Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    toast.info(darkMode ? 'Tema claro ativado' : 'Tema escuro ativado');
  };

  return (
    <div className="pb-20 lg:pb-0" data-testid="settings-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Configurações</h1>
          <p className="text-slate-400">Gerencie sua conta e preferências</p>
        </div>

        {/* User Profile */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700" data-testid="profile-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white font-medium" data-testid="user-email">{user?.email}</p>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">ID do Usuário</p>
                  <Button
                    data-testid="copy-user-id-button"
                    onClick={handleCopyId}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700" data-testid="appearance-card">
          <CardHeader>
            <CardTitle className="text-white">Aparência</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-slate-400" /> : <Sun className="w-5 h-5 text-slate-400" />}
                <div>
                  <p className="text-white font-medium">Tema Escuro</p>
                  <p className="text-sm text-slate-400">Atualmente: {darkMode ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
              <Button
                data-testid="theme-toggle-button"
                onClick={toggleTheme}
                variant="outline"
                className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
              >
                Alternar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700" data-testid="sync-card">
          <CardHeader>
            <CardTitle className="text-white">Sincronização</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <>
                    <Wifi className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-white font-medium">Online</p>
                      <p className="text-sm text-slate-400">Conectado à internet</p>
                    </div>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-white font-medium">Offline</p>
                      <p className="text-sm text-slate-400">Sem conexão com a internet</p>
                    </div>
                  </>
                )}
              </div>
              <Button
                data-testid="sync-button"
                onClick={handleSync}
                disabled={!isOnline || syncing}
                className="w-auto bg-emerald-500 hover:bg-emerald-600 text-white"
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="mb-6 bg-slate-800/50 border-slate-700" data-testid="export-card">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Download className="w-5 h-5" />
              Exportar Dados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400 text-sm mb-4">
              Baixe todas as suas transações em formato CSV
            </p>
            <Button
              data-testid="export-button"
              onClick={handleExport}
              variant="outline"
              className="w-auto bg-slate-700 border-slate-600 text-white hover:bg-slate-600"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card className="bg-red-500/10 border-red-500/30" data-testid="logout-card">
          <CardContent className="pt-6">
            <Button
              data-testid="logout-button"
              onClick={handleSignOut}
              variant="destructive"
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}