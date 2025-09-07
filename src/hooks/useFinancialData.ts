import { useTransactions } from './useTransactions';
import { useAccounts } from './useAccounts';
import { useSavings } from './useSavings';
import { useDebts } from './useDebts';
import { useCategories } from './useCategories';

/**
 * Central hook for managing all financial data with interconnected refreshing
 */
export const useFinancialData = () => {
  const transactionsHook = useTransactions();
  const accountsHook = useAccounts();
  const savingsHook = useSavings();
  const debtsHook = useDebts();
  const categoriesHook = useCategories();

  // Global refresh function to refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      transactionsHook.refetch(),
      accountsHook.refetch(),
      savingsHook.refetch(),
      debtsHook.refetch(),
      categoriesHook.refetch(),
    ]);
  };

  // Enhanced create functions that refresh related data
  const createTransactionWithRefresh = async (data: any) => {
    const result = await transactionsHook.createTransaction(data);
    if (!result.error) {
      // Refresh accounts when transaction is created (balance changes)
      await accountsHook.refetch();
    }
    return result;
  };

  const createSavingsGoalWithRefresh = async (data: any) => {
    const result = await savingsHook.createSavingsGoal(data);
    if (!result.error) {
      // Refresh categories to keep data in sync
      await categoriesHook.refetch();
    }
    return result;
  };

  const deleteTransactionWithRefresh = async (id: string) => {
    await transactionsHook.deleteTransaction(id);
    // Refresh accounts when transaction is deleted (balance changes)
    await accountsHook.refetch();
  };

  const deleteAccountWithRefresh = async (id: string) => {
    await accountsHook.deleteAccount(id);
    // Refresh transactions to remove any orphaned references
    await transactionsHook.refetch();
  };

  const deleteCategoryWithRefresh = async (id: string) => {
    await categoriesHook.deleteCategory(id);
    // Refresh transactions and savings to handle orphaned references
    await Promise.all([
      transactionsHook.refetch(),
      savingsHook.refetch(),
    ]);
  };

  return {
    // All data
    transactions: transactionsHook.transactions,
    accounts: accountsHook.accounts,
    savingsGoals: savingsHook.savingsGoals,
    debts: debtsHook.debts,
    categories: categoriesHook.categories,

    // Loading states
    loading: {
      transactions: transactionsHook.loading,
      accounts: accountsHook.loading,
      savings: savingsHook.loading,
      debts: debtsHook.loading,
      categories: categoriesHook.loading,
    },

    // Enhanced functions with auto-refresh
    createTransaction: createTransactionWithRefresh,
    createSavingsGoal: createSavingsGoalWithRefresh,
    deleteTransaction: deleteTransactionWithRefresh,
    deleteAccount: deleteAccountWithRefresh,
    deleteCategory: deleteCategoryWithRefresh,

    // Original functions (transactions hook doesn't have update, only create/delete)
    resetAllTransactions: transactionsHook.resetAllTransactions,
    updateAccount: accountsHook.updateAccount,
    updateSavingsGoal: savingsHook.updateSavingsGoal,
    updateDebt: debtsHook.updateDebt,
    updateCategory: categoriesHook.updateCategory,

    createAccount: accountsHook.createAccount,
    createDebt: debtsHook.createDebt,
    createCategory: categoriesHook.createCategory,

    deleteSavingsGoal: savingsHook.deleteSavingsGoal,
    deleteDebt: debtsHook.deleteDebt,

    // Global refresh
    refreshAllData,

    // Individual refresh functions
    refetch: {
      transactions: transactionsHook.refetch,
      accounts: accountsHook.refetch,
      savings: savingsHook.refetch,
      debts: debtsHook.refetch,
      categories: categoriesHook.refetch,
    },
  };
};
