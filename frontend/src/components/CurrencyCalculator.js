import React, { useState, useEffect } from "react";
import { fetchCurrencies } from "../api";
import { handleSwap } from "../utils";
import "./CurrencyCalculator.css";

const CurrencyCalculator = () => {
  const [amount, setAmount] = useState("");
  const [fromCurrency, setFromCurrency] = useState("EUR");
  const [toCurrency, setToCurrency] = useState("USD");
  const [result, setResult] = useState(null);
  const [currencies, setCurrencies] = useState([]);

  const formatNumber = (number) => {
    return number.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Add input validation
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  useEffect(() => {
    fetchCurrencies()
      .then((availableCurrencies) => setCurrencies(availableCurrencies))
      .catch((error) => console.error("Error loading currencies:", error));
  }, []);

  // Convert amount whenever it changes
  useEffect(() => {
    const convertCurrency = async () => {
      if (!amount) {
        setResult(null);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8000/api/exchange-rates/convert/?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`
        );
        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error("Error converting:", error);
      }
    };

    const timeoutId = setTimeout(convertCurrency, 300);
    return () => clearTimeout(timeoutId);
  }, [amount, fromCurrency, toCurrency]);

  return (
    <div className="calculator-container">
      <div className="currency-selectors">
        {/* Currency Selection */}
        <select
          className="currency-select"
          value={fromCurrency}
          onChange={(e) => setFromCurrency(e.target.value)}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>

        <button
          className="swap-button"
          onClick={() =>
            handleSwap(fromCurrency, toCurrency, setFromCurrency, setToCurrency)
          }
        >
          ⇄
        </button>

        <select
          className="currency-select"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>
      <div>
        {/* Amount Input */}
        <input
          type="number"
          className="amount-input"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Enter amount"
          min="0"
          step="0.01"
        />
      </div>
      {/* Result Display */}
      {result && (
        <div className="result-container">
          <span className="result-value">
            {formatNumber(parseFloat(amount))}
          </span>
          <span className="currency-code"> {fromCurrency} = </span>
          <span className="result-value">{formatNumber(result.result)}</span>
          <span className="currency-code"> {toCurrency}</span>
        </div>
      )}
    </div>
  );
};

export default CurrencyCalculator;
