"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";


interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  exchange_rate: number;
  is_active: boolean;
}

export default function CurrencyManagement() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const router = useRouter();

  const [newCurrency, setNewCurrency] = useState({
    code: "",
    name: "",
    symbol: "",
    exchange_rate: 1,
    is_active: true
  });

  useEffect(() => {
    // Cookie-based admin check (same as dashboard)
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!cookie) {
      router.replace('/login');
      return;
    }
    try {
      const userObj = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      setUser(userObj);
      if (userObj.role !== 'admin') {
        router.replace('/search');
        return;
      }
      setIsAdmin(true);
    } catch {
      router.replace('/login');
      return;
    }
    fetchCurrencies();
    setLoading(false);
  }, [router]);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/currencies');
      const data = await res.json();
      setCurrencies(data || []);
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const handleAddCurrency = async () => {
    try {
      const res = await fetch('/api/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCurrency),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      setNewCurrency({
        code: "",
        name: "",
        symbol: "",
        exchange_rate: 1,
        is_active: true
      });
      setShowAddForm(false);
      await fetchCurrencies();
    } catch (error) {
      console.error("Error adding currency:", error);
    }
  };

  const handleUpdateCurrency = async () => {
    if (!editingCurrency) return;
    try {
      const res = await fetch(`/api/currencies/${editingCurrency.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCurrency),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      setEditingCurrency(null);
      await fetchCurrencies();
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  };

  const handleDeleteCurrency = async (id: number) => {
    if (!confirm("Are you sure you want to delete this currency?")) return;
    try {
      const res = await fetch(`/api/currencies/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      await fetchCurrencies();
    } catch (error) {
      console.error("Error deleting currency:", error);
    }
  };

  const handleSignOut = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4f1032] mx-auto mb-4"></div>
          <p className="text-[#4f1032] font-semibold">Loading Currency Management...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4f1032] to-[#4f1032]/90 text-white py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">Currency Management</h1>
              <p className="text-gray-200 mt-2 text-sm sm:text-base">Manage currencies and exchange rates</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <a
                href="/admin/dashboard"
                className="bg-[#cd7e0f] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#cd7e0f]/90 transition text-sm sm:text-base"
              >
                Back to Dashboard
              </a>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-red-700 transition text-sm sm:text-base"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        {/* Add Currency Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#cd7e0f] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#cd7e0f]/90 transition flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {showAddForm ? "Cancel" : "Add New Currency"}
          </button>
        </div>

        {/* Add Currency Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-[#4f1032] mb-4">Add New Currency</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Code</label>
        <input
          type="text"
          value={newCurrency.code}
                  onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f1032] text-sm sm:text-base"
                  placeholder="USD"
        />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={newCurrency.name}
                  onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f1032] text-sm sm:text-base"
                  placeholder="US Dollar"
        />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
                <input
                  type="text"
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f1032] text-sm sm:text-base"
                  placeholder="$"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exchange Rate</label>
                <input
                  type="number"
                  step="0.01"
                  value={newCurrency.exchange_rate}
                  onChange={(e) => setNewCurrency({...newCurrency, exchange_rate: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4f1032] text-sm sm:text-base"
                  placeholder="1.00"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAddCurrency}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition text-sm sm:text-base"
                >
                  Add Currency
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Currencies Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg sm:text-xl font-bold text-[#4f1032]">Currencies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exchange Rate</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
        {currencies.map((currency) => (
                  <tr key={currency.id}>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                      {editingCurrency?.id === currency.id ? (
                        <input
                          type="text"
                          value={editingCurrency.code}
                          onChange={(e) => setEditingCurrency({...editingCurrency, code: e.target.value.toUpperCase()})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        />
                      ) : (
                        currency.code
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingCurrency?.id === currency.id ? (
                        <input
                          type="text"
                          value={editingCurrency.name}
                          onChange={(e) => setEditingCurrency({...editingCurrency, name: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        />
                      ) : (
                        currency.name
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingCurrency?.id === currency.id ? (
                        <input
                          type="text"
                          value={editingCurrency.symbol}
                          onChange={(e) => setEditingCurrency({...editingCurrency, symbol: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        />
                      ) : (
                        currency.symbol
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                      {editingCurrency?.id === currency.id ? (
                        <input
                          type="number"
                          step="0.01"
                          value={editingCurrency.exchange_rate}
                          onChange={(e) => setEditingCurrency({...editingCurrency, exchange_rate: parseFloat(e.target.value)})}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        />
                      ) : (
                        currency.exchange_rate
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      {editingCurrency?.id === currency.id ? (
                        <select
                          value={editingCurrency.is_active ? "active" : "inactive"}
                          onChange={(e) => setEditingCurrency({...editingCurrency, is_active: e.target.value === "active"})}
                          className="px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          currency.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-red-100 text-red-800"
                        }`}>
                          {currency.is_active ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      {editingCurrency?.id === currency.id ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={handleUpdateCurrency}
                            className="text-green-600 hover:text-green-900 text-xs sm:text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCurrency(null)}
                            className="text-gray-600 hover:text-gray-900 text-xs sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => setEditingCurrency(currency)}
                            className="text-blue-600 hover:text-blue-900 text-xs sm:text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCurrency(currency.id)}
                            className="text-red-600 hover:text-red-900 text-xs sm:text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
