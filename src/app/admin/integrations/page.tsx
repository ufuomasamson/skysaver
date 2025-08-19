"use client";
import { useState, useEffect } from 'react';


export default function PaymentIntegrations() {
  // Flutterwave Test Keys
  const [flutterwaveTestPublicKey, setFlutterwaveTestPublicKey] = useState('');
  const [flutterwaveTestSecretKey, setFlutterwaveTestSecretKey] = useState('');
  const [flutterwaveTestEncryptionKey, setFlutterwaveTestEncryptionKey] = useState('');
  
  // Flutterwave Live Keys
  const [flutterwaveLivePublicKey, setFlutterwaveLivePublicKey] = useState('');
  const [flutterwaveLiveSecretKey, setFlutterwaveLiveSecretKey] = useState('');
  const [flutterwaveLiveEncryptionKey, setFlutterwaveLiveEncryptionKey] = useState('');

  // Paystack Test Keys
  const [paystackTestPublicKey, setPaystackTestPublicKey] = useState('');
  const [paystackTestSecretKey, setPaystackTestSecretKey] = useState('');
  
  // Paystack Live Keys
  const [paystackLivePublicKey, setPaystackLivePublicKey] = useState('');
  const [paystackLiveSecretKey, setPaystackLiveSecretKey] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [savingFlutterwaveTest, setSavingFlutterwaveTest] = useState(false);
  const [savingFlutterwaveLive, setSavingFlutterwaveLive] = useState(false);
  const [savingPaystackTest, setSavingPaystackTest] = useState(false);
  const [savingPaystackLive, setSavingPaystackLive] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Cookie-based admin check (same as dashboard)
    const cookie = document.cookie.split('; ').find(row => row.startsWith('user='));
    if (!cookie) {
      window.location.href = '/login';
      return;
    }
    try {
      const userObj = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      if (userObj.role !== 'admin') {
        window.location.href = '/search';
        return;
      }
    } catch {
      window.location.href = '/login';
      return;
    }
    // Fetch API keys from custom API route
    const fetchApiKeys = async () => {
      try {
        const response = await fetch('/api/payment');
        const data = await response.json();
        if (data && Array.isArray(data)) {
          // Flutterwave Test Keys
          const flutterwaveTestPublic = data.find(item => item.name === 'flutterwave' && item.type === 'test_public')?.api_key || '';
          const flutterwaveTestSecret = data.find(item => item.name === 'flutterwave' && item.type === 'test_secret')?.api_key || '';
          const flutterwaveTestEncryption = data.find(item => item.name === 'flutterwave' && item.type === 'test_encryption')?.api_key || '';
          // Flutterwave Live Keys
          const flutterwaveLivePublic = data.find(item => item.name === 'flutterwave' && item.type === 'live_public')?.api_key || '';
          const flutterwaveLiveSecret = data.find(item => item.name === 'flutterwave' && item.type === 'live_secret')?.api_key || '';
          const flutterwaveLiveEncryption = data.find(item => item.name === 'flutterwave' && item.type === 'live_encryption')?.api_key || '';
          
          // Paystack Test Keys
          const paystackTestPublic = data.find(item => item.name === 'paystack' && item.type === 'test_public')?.api_key || '';
          const paystackTestSecret = data.find(item => item.name === 'paystack' && item.type === 'test_secret')?.api_key || '';
          // Paystack Live Keys
          const paystackLivePublic = data.find(item => item.name === 'paystack' && item.type === 'live_public')?.api_key || '';
          const paystackLiveSecret = data.find(item => item.name === 'paystack' && item.type === 'live_secret')?.api_key || '';

          setFlutterwaveTestPublicKey(flutterwaveTestPublic);
          setFlutterwaveTestSecretKey(flutterwaveTestSecret);
          setFlutterwaveTestEncryptionKey(flutterwaveTestEncryption);
          setFlutterwaveLivePublicKey(flutterwaveLivePublic);
          setFlutterwaveLiveSecretKey(flutterwaveLiveSecret);
          setFlutterwaveLiveEncryptionKey(flutterwaveLiveEncryption);
          
          setPaystackTestPublicKey(paystackTestPublic);
          setPaystackTestSecretKey(paystackTestSecret);
          setPaystackLivePublicKey(paystackLivePublic);
          setPaystackLiveSecretKey(paystackLiveSecret);
        }
      } catch (err) {
        console.error('Error fetching API keys:', err);
        setError('Failed to fetch API keys');
      } finally {
        setLoading(false);
      }
    };
    fetchApiKeys();
  }, []);

  const saveKeysViaAPI = async (keysToSave: any[]) => {
    try {
      console.log('Saving keys via API:', keysToSave);
      
      const response = await fetch('/api/save-api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keys: keysToSave }),
      });
      
      const result = await response.json();
      console.log('API save result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save keys');
      }
      
      return result;
    } catch (error: any) {
      console.error('API save error:', error);
      throw error;
    }
  };

  const handleSaveFlutterwaveTestKeys = async () => {
    setSavingFlutterwaveTest(true);
    setError('');
    setSuccess('');

    try {
      console.log('Saving Flutterwave test keys...', { flutterwaveTestPublicKey, flutterwaveTestSecretKey, flutterwaveTestEncryptionKey });
      
      const testKeysToSave = [
        { name: 'flutterwave', type: 'test_public', api_key: flutterwaveTestPublicKey },
        { name: 'flutterwave', type: 'test_secret', api_key: flutterwaveTestSecretKey },
        { name: 'flutterwave', type: 'test_encryption', api_key: flutterwaveTestEncryptionKey },
      ].filter(key => key.api_key); // Only save keys that have values

      if (testKeysToSave.length === 0) {
        setError('No Flutterwave test keys to save');
        return;
      }

      await saveKeysViaAPI(testKeysToSave);
      setSuccess('Flutterwave test API keys saved successfully');
    } catch (err: any) {
      console.error('Error saving Flutterwave test keys:', err);
      setError(`Failed to save Flutterwave test API keys: ${err.message || err}`);
    } finally {
      setSavingFlutterwaveTest(false);
    }
  };

  const handleSaveFlutterwaveLiveKeys = async () => {
    setSavingFlutterwaveLive(true);
    setError('');
    setSuccess('');

    try {
      const liveKeysToSave = [
        { name: 'flutterwave', type: 'live_public', api_key: flutterwaveLivePublicKey },
        { name: 'flutterwave', type: 'live_secret', api_key: flutterwaveLiveSecretKey },
        { name: 'flutterwave', type: 'live_encryption', api_key: flutterwaveLiveEncryptionKey },
      ].filter(key => key.api_key); // Only save keys that have values

      if (liveKeysToSave.length === 0) {
        setError('No Flutterwave live keys to save');
        return;
      }

      await saveKeysViaAPI(liveKeysToSave);
      setSuccess('Flutterwave live API keys saved successfully');
    } catch (err: any) {
      setError(`Failed to save Flutterwave live API keys: ${err.message || err}`);
    } finally {
      setSavingFlutterwaveLive(false);
    }
  };

  const handleSavePaystackTestKeys = async () => {
    setSavingPaystackTest(true);
    setError('');
    setSuccess('');

    try {
      const testKeysToSave = [
        { name: 'paystack', type: 'test_public', api_key: paystackTestPublicKey },
        { name: 'paystack', type: 'test_secret', api_key: paystackTestSecretKey },
      ].filter(key => key.api_key); // Only save keys that have values

      if (testKeysToSave.length === 0) {
        setError('No Paystack test keys to save');
        return;
      }

      await saveKeysViaAPI(testKeysToSave);
      setSuccess('Paystack test API keys saved successfully');
    } catch (err: any) {
      setError(`Failed to save Paystack test API keys: ${err.message || err}`);
    } finally {
      setSavingPaystackTest(false);
    }
  };

  const handleSavePaystackLiveKeys = async () => {
    setSavingPaystackLive(true);
    setError('');
    setSuccess('');

    try {
      const liveKeysToSave = [
        { name: 'paystack', type: 'live_public', api_key: paystackLivePublicKey },
        { name: 'paystack', type: 'live_secret', api_key: paystackLiveSecretKey },
      ].filter(key => key.api_key); // Only save keys that have values

      if (liveKeysToSave.length === 0) {
        setError('No Paystack live keys to save');
        return;
      }

      await saveKeysViaAPI(liveKeysToSave);
      setSuccess('Paystack live API keys saved successfully');
    } catch (err: any) {
      setError(`Failed to save Paystack live API keys: ${err.message || err}`);
    } finally {
      setSavingPaystackLive(false);
    }
  };

  const handleSave = async () => {
    setSavingAll(true);
    setError('');
    setSuccess('');

    try {
      const keysToSave = [
        // Flutterwave keys
        { name: 'flutterwave', type: 'test_public', api_key: flutterwaveTestPublicKey },
        { name: 'flutterwave', type: 'test_secret', api_key: flutterwaveTestSecretKey },
        { name: 'flutterwave', type: 'test_encryption', api_key: flutterwaveTestEncryptionKey },
        { name: 'flutterwave', type: 'live_public', api_key: flutterwaveLivePublicKey },
        { name: 'flutterwave', type: 'live_secret', api_key: flutterwaveLiveSecretKey },
        { name: 'flutterwave', type: 'live_encryption', api_key: flutterwaveLiveEncryptionKey },
        // Paystack keys
        { name: 'paystack', type: 'test_public', api_key: paystackTestPublicKey },
        { name: 'paystack', type: 'test_secret', api_key: paystackTestSecretKey },
        { name: 'paystack', type: 'live_public', api_key: paystackLivePublicKey },
        { name: 'paystack', type: 'live_secret', api_key: paystackLiveSecretKey },
      ].filter(key => key.api_key); // Only save keys that have values

      if (keysToSave.length === 0) {
        setError('No API keys to save');
        return;
      }

      await saveKeysViaAPI(keysToSave);
      setSuccess('All payment gateway API keys saved successfully');
    } catch (err: any) {
      setError(`Failed to save API keys: ${err.message || err}`);
    } finally {
      setSavingAll(false);
    }
  };

  const maskApiKey = (key: string) => {
    if (!key) return '';
    // Temporarily show full key for debugging
    return key;
    // if (key.length <= 8) return key;
    // return key.substring(0, 8) + '*'.repeat(key.length - 8);
  };

  const KeyInput = ({ 
    label, 
    value, 
    onChange, 
    placeholder, 
    savedValue, 
    cardColor, 
    cardTextColor 
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    savedValue: string;
    cardColor: string;
    cardTextColor: string;
  }) => (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#18176b] focus:border-transparent"
        />
      </div>
      
      {savedValue && (
        <div className={`${cardColor} border rounded-lg p-3`}>
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${cardTextColor}`}>Saved:</span>
            <span className={`text-sm font-mono ${cardTextColor}`}>{maskApiKey(savedValue)}</span>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18176b] mx-auto mb-4"></div>
          <p className="text-[#18176b] font-semibold">Loading Integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#18176b] to-[#18176b]/90 text-white py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold">Payment Integrations</h1>
              <p className="text-gray-200 mt-2 text-sm sm:text-base">Manage payment gateway settings (Flutterwave & Paystack)</p>
            </div>
            <a
              href="/admin/dashboard"
              className="bg-[#cd7e0f] text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-[#cd7e0f]/90 transition text-sm sm:text-base"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <div className="mt-2 text-sm text-green-700">{success}</div>
              </div>
            </div>
          </div>
        )}

        {/* Flutterwave Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-orange-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18176b]">Flutterwave Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Flutterwave Test Keys Section */}
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="text-lg font-semibold text-blue-800">Test Environment Keys</h3>
                <p className="text-blue-600 text-sm mt-1">Use these keys for testing and development</p>
              </div>
              
              <div className="space-y-4">
                <KeyInput
                  label="Test Public Key"
                  value={flutterwaveTestPublicKey}
                  onChange={setFlutterwaveTestPublicKey}
                  placeholder="Enter Flutterwave Test Public Key"
                  savedValue={flutterwaveTestPublicKey}
                  cardColor="bg-blue-50 border-blue-200"
                  cardTextColor="text-blue-800"
                />
                
                <KeyInput
                  label="Test Secret Key"
                  value={flutterwaveTestSecretKey}
                  onChange={setFlutterwaveTestSecretKey}
                  placeholder="Enter Flutterwave Test Secret Key"
                  savedValue={flutterwaveTestSecretKey}
                  cardColor="bg-blue-50 border-blue-200"
                  cardTextColor="text-blue-800"
                />
                
                <KeyInput
                  label="Test Encryption Key"
                  value={flutterwaveTestEncryptionKey}
                  onChange={setFlutterwaveTestEncryptionKey}
                  placeholder="Enter Flutterwave Test Encryption Key"
                  savedValue={flutterwaveTestEncryptionKey}
                  cardColor="bg-blue-50 border-blue-200"
                  cardTextColor="text-blue-800"
                />
              </div>
              
              {/* Flutterwave Test Keys Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveFlutterwaveTestKeys}
                  disabled={savingFlutterwaveTest}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {savingFlutterwaveTest ? 'Saving Test Keys...' : 'Save Test Keys'}
                </button>
              </div>
            </div>

            {/* Flutterwave Live Keys Section */}
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <h3 className="text-lg font-semibold text-green-800">Live Environment Keys</h3>
                <p className="text-green-600 text-sm mt-1">Use these keys for production payments</p>
              </div>
              
              <div className="space-y-4">
                <KeyInput
                  label="Live Public Key"
                  value={flutterwaveLivePublicKey}
                  onChange={setFlutterwaveLivePublicKey}
                  placeholder="Enter Flutterwave Live Public Key"
                  savedValue={flutterwaveLivePublicKey}
                  cardColor="bg-green-50 border-green-200"
                  cardTextColor="text-green-800"
                />
            
                <KeyInput
                  label="Live Secret Key"
                  value={flutterwaveLiveSecretKey}
                  onChange={setFlutterwaveLiveSecretKey}
                  placeholder="Enter Flutterwave Live Secret Key"
                  savedValue={flutterwaveLiveSecretKey}
                  cardColor="bg-green-50 border-green-200"
                  cardTextColor="text-green-800"
                />
                
                <KeyInput
                  label="Live Encryption Key"
                  value={flutterwaveLiveEncryptionKey}
                  onChange={setFlutterwaveLiveEncryptionKey}
                  placeholder="Enter Flutterwave Live Encryption Key"
                  savedValue={flutterwaveLiveEncryptionKey}
                  cardColor="bg-green-50 border-green-200"
                  cardTextColor="text-green-800"
                />
              </div>
              
              {/* Flutterwave Live Keys Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveFlutterwaveLiveKeys}
                  disabled={savingFlutterwaveLive}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {savingFlutterwaveLive ? 'Saving Live Keys...' : 'Save Live Keys'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Paystack Configuration */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-green-100 p-2 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#18176b]">Paystack Configuration</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Paystack Test Keys Section */}
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <h3 className="text-lg font-semibold text-blue-800">Test Environment Keys</h3>
                <p className="text-blue-600 text-sm mt-1">Use these keys for testing and development</p>
              </div>
              
              <div className="space-y-4">
                <KeyInput
                  label="Test Public Key"
                  value={paystackTestPublicKey}
                  onChange={setPaystackTestPublicKey}
                  placeholder="Enter Paystack Test Public Key (pk_test_...)"
                  savedValue={paystackTestPublicKey}
                  cardColor="bg-blue-50 border-blue-200"
                  cardTextColor="text-blue-800"
                />
                
                <KeyInput
                  label="Test Secret Key"
                  value={paystackTestSecretKey}
                  onChange={setPaystackTestSecretKey}
                  placeholder="Enter Paystack Test Secret Key (sk_test_...)"
                  savedValue={paystackTestSecretKey}
                  cardColor="bg-blue-50 border-blue-200"
                  cardTextColor="text-blue-800"
                />
              </div>
              
              {/* Paystack Test Keys Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSavePaystackTestKeys}
                  disabled={savingPaystackTest}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {savingPaystackTest ? 'Saving Test Keys...' : 'Save Test Keys'}
                </button>
              </div>
            </div>

            {/* Paystack Live Keys Section */}
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-400 p-4">
                <h3 className="text-lg font-semibold text-green-800">Live Environment Keys</h3>
                <p className="text-green-600 text-sm mt-1">Use these keys for production payments</p>
              </div>
              
              <div className="space-y-4">
                <KeyInput
                  label="Live Public Key"
                  value={paystackLivePublicKey}
                  onChange={setPaystackLivePublicKey}
                  placeholder="Enter Paystack Live Public Key (pk_live_...)"
                  savedValue={paystackLivePublicKey}
                  cardColor="bg-green-50 border-green-200"
                  cardTextColor="text-green-800"
                />
            
                <KeyInput
                  label="Live Secret Key"
                  value={paystackLiveSecretKey}
                  onChange={setPaystackLiveSecretKey}
                  placeholder="Enter Paystack Live Secret Key (sk_live_...)"
                  savedValue={paystackLiveSecretKey}
                  cardColor="bg-green-50 border-green-200"
                  cardTextColor="text-green-800"
                />
              </div>
              
              {/* Paystack Live Keys Save Button */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSavePaystackLiveKeys}
                  disabled={savingPaystackLive}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {savingPaystackLive ? 'Saving Live Keys...' : 'Save Live Keys'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-[#18176b]">Save All Configurations</h3>
              <p className="text-gray-600 text-sm mt-1">Save all payment gateway configurations at once</p>
            </div>
            <button
              onClick={handleSave}
              disabled={savingAll}
              className="w-full sm:w-auto px-8 py-3 bg-[#18176b] text-white rounded-lg hover:bg-[#18176b]/90 transition disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {savingAll ? 'Saving All Keys...' : 'Save All Configurations'}
            </button>
          </div>
        </div>

        {/* Test Database Connection Button */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-semibold text-[#18176b]">Test Configuration</h3>
              <p className="text-gray-600 text-sm mt-1">Verify your payment gateway configurations</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <a
                href="/api/payment/test-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-center text-sm"
              >
                Test Flutterwave Keys
              </a>
              <a
                href="/api/payment/paystack/test-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center text-sm"
              >
                Test Paystack Keys
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
