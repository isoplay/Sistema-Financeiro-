import Dexie from 'dexie';

export const db = new Dexie('FinanceDB');

db.version(1).stores({
  transactions: '++localId, id, userId, accountId, syncStatus, txDate',
  accounts: '++localId, id, userId, syncStatus',
  categories: '++localId, id, userId, syncStatus',
  syncQueue: '++id, operation, endpoint, timestamp, status, retryCount',
});

export async function queueOperation(operation, endpoint, payload) {
  await db.syncQueue.add({
    operation,
    endpoint,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    status: 'pending',
  });
}

export async function processSyncQueue(apiClient, getToken) {
  const pending = await db.syncQueue.where('status').equals('pending').toArray();
  
  for (const item of pending) {
    try {
      const token = await getToken();
      if (!token) continue;

      const response = await fetch(`${item.endpoint}`, {
        method: item.operation,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item.payload),
      });

      if (response.ok) {
        await db.syncQueue.update(item.id, { status: 'synced' });
      } else {
        throw new Error(`API error: ${response.status}`);
      }
    } catch (error) {
      console.error('Sync error:', error);
      await db.syncQueue.update(item.id, {
        retryCount: item.retryCount + 1,
        status: item.retryCount < 5 ? 'pending' : 'failed',
      });
    }
  }
}