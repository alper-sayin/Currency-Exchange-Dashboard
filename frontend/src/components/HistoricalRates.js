import React, { useState, useEffect } from "react";
import { fetchCurrencies, fetchCurrencyCodesNames } from "../api";
import { handleSwap } from "../utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./HistoricalRates.css";
import PropTypes from "prop-types";

const HistoricalRates = ({ initialCurrencies }) => {
  const [historicalData, setHistoricalData] = useState([]);
  const [period, setPeriod] = useState("1m");
  const [fromCurrency, setFromCurrency] = useState(
    initialCurrencies?.from || "EUR"
  );
  const [toCurrency, setToCurrency] = useState(initialCurrencies?.to || "USD");
  const [currencies, setCurrencies] = useState([]);
  const [currencyNames, setCurrencyNames] = useState({});

  useEffect(() => {
    if (initialCurrencies?.from && initialCurrencies?.to) {
      setFromCurrency(initialCurrencies.from);
      setToCurrency(initialCurrencies.to);
    }
  }, [initialCurrencies]);

  // Format date for X-axis
  const formatXAxis = (dateStr) => {
    const date = new Date(dateStr);

    // Format based on selected period
    switch (period) {
      case "1w":
      case "1m":
        // For 1 week and 1 month, show "DD MMM"
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        });
      case "1y":
        // For 1 year, show only "MMM YYYY"
        return date.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        });
      case "5y":
      case "10y":
        // For 5 and 10 years, show only "YYYY"
        return date.toLocaleDateString("en-GB", {
          year: "numeric",
        });
      default:
        return dateStr;
    }
  };

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-date">
            {new Date(label).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <p className="tooltip-rate">
            1 {fromCurrency} = {payload[0].value.toFixed(4)} {toCurrency}
          </p>
        </div>
      );
    }
    return null;
  };

  CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.number,
      })
    ),
    label: PropTypes.string,
  };

  useEffect(() => {
    fetchCurrencies()
      .then((availableCurrencies) => setCurrencies(availableCurrencies))
      .catch((error) => console.error("Error loading currencies:", error));
  }, []);

  useEffect(() => {
    fetchCurrencyCodesNames()
      .then((data) => setCurrencyNames(data))
      .catch((error) => console.error("Error loading currency names:", error));
  }, []);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/exchange-rates/historical/?from=${fromCurrency}&to=${toCurrency}&period=${period}`
        );
        const data = await response.json();
        setHistoricalData(data.data);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchHistoricalData();
  }, [fromCurrency, toCurrency, period]);

  return (
    <div className="historical-rates-container">
      <div className="controls">
        <div className="currency-controls">
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
              handleSwap(
                fromCurrency,
                toCurrency,
                setFromCurrency,
                setToCurrency
              )
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

        <div className="period-control">
          <select
            className="period-select"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="1w">1 Week</option>
            <option value="1m">1 Month</option>
            <option value="1y">1 Year</option>
            <option value="5y">5 Years</option>
            <option value="10y">10 Years</option>
          </select>
        </div>
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart
            data={historicalData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              interval="preserveStartEnd"
              minTickGap={30}
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: "#666" }}
              domain={["auto", "auto"]}
              tickFormatter={(value) => value.toFixed(4)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#0066cc"
              strokeWidth={2}
              dot={false}
              name={`${currencyNames[fromCurrency] ? currencyNames[fromCurrency] : fromCurrency} / ${currencyNames[toCurrency] ? currencyNames[toCurrency] : toCurrency}`}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

HistoricalRates.propTypes = {
  initialCurrencies: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
  }),
};

export default HistoricalRates;
