import { createContext, useContext, useState } from 'react';
import { startOfMonth, endOfMonth } from 'date-fns';

const FilterContext = createContext();

export function FilterProvider({ children }) {
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date()),
  });
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const setPreset = (preset) => {
    const now = new Date();
    switch (preset) {
      case 'this-month':
        setDateRange({ start: startOfMonth(now), end: endOfMonth(now) });
        break;
      case 'last-month':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        setDateRange({ start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) });
        break;
      case 'ytd':
        setDateRange({ start: new Date(now.getFullYear(), 0, 1), end: now });
        break;
      default:
        break;
    }
  };

  return (
    <FilterContext.Provider value={{
      dateRange,
      setDateRange,
      selectedAccount,
      setSelectedAccount,
      searchQuery,
      setSearchQuery,
      setPreset,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters deve ser usado dentro de FilterProvider');
  return context;
};