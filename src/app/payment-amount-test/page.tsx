"use client";

import { useState } from 'react';
import { convertToNGN, logConversion } from '@/lib/currencyConversion';

export default function PaymentAmountTest() {
  const [testResults, setTestResults] = useState<any[]>([]);

  const runTests = () => {
    const tests = [
      { amount: 1, currency: 'USD' },
      { amount: 100, currency: 'USD' },
      { amount: 1, currency: 'EUR' },
      { amount: 1, currency: 'GBP' },
    ];

    const results = tests.map(test => {
      const conversion = convertToNGN(test.amount, test.currency);
      logConversion(conversion, `Test: ${test.currency} ${test.amount}`);
      
      return {
        input: `${test.currency} ${test.amount}`,
        ngnAmount: conversion.convertedAmount,
        koboAmount: conversion.amountInKobo,
        rate: conversion.exchangeRate,
        apiAmount: Math.round(conversion.convertedAmount * 100), // What API will calculate
        correctKobo: conversion.amountInKobo
      };
    });

    setTestResults(results);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Payment Amount Conversion Test</h1>
      
      <button 
        onClick={runTests}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-6"
      >
        Run Currency Conversion Tests
      </button>

      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          
          {testResults.map((result, index) => (
            <div key={index} className="border p-4 rounded bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Input:</strong> {result.input}
                </div>
                <div>
                  <strong>Exchange Rate:</strong> 1 {result.input.split(' ')[0]} = {result.rate} NGN
                </div>
                <div>
                  <strong>NGN Amount:</strong> ₦{result.ngnAmount.toFixed(2)}
                </div>
                <div>
                  <strong>Correct Kobo:</strong> {result.correctKobo}
                </div>
                <div>
                  <strong>API Calculation:</strong> {result.apiAmount} kobo
                </div>
                <div className={result.apiAmount === result.correctKobo ? 'text-green-600' : 'text-red-600'}>
                  <strong>Status:</strong> {result.apiAmount === result.correctKobo ? '✅ Correct' : '❌ Double conversion'}
                </div>
              </div>
            </div>
          ))}
          
          <div className="mt-6 p-4 bg-yellow-100 rounded">
            <h3 className="font-semibold">Expected Paystack Amounts:</h3>
            <ul className="mt-2 space-y-1">
              <li>• $1 USD should charge ₦1,529 (152,900 kobo)</li>
              <li>• $100 USD should charge ₦152,900 (15,290,000 kobo)</li>
              <li>• €1 EUR should charge ₦1,650 (165,000 kobo)</li>
              <li>• £1 GBP should charge ₦1,940 (194,000 kobo)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
