import React, { useState, useEffect } from "react";
import { fetchCurrencyCodesNames } from "../api";
import { TiArrowSortedUp, TiArrowSortedDown } from "react-icons/ti";
import PropTypes from "prop-types";
import "./CurrencyDashboard.css";

const CurrencyDashboard = (props) => {
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [currencies, setCurrencies] = useState([]);
  const [currencyNames, setCurrencyNames] = useState({});
  const [latestRates, setRates] = useState({});
  const [previousRates, setPreviousRates] = useState({});
  const [isReversed, setIsReversed] = useState(false);

  // Fetch currency names and latest rates
  useEffect(() => {
    fetchCurrencyCodesNames()
      .then((data) => setCurrencyNames(data))
      .catch((error) => console.error("Error loading currency names:", error));
  }, []);

  // Fetch latest and previous day rates when base currency changes
  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Fetch latest rates
        const latestResponse = await fetch(
          `http://localhost:8000/api/exchange-rates/latest/?base=${baseCurrency}`
        );
        const latestData = await latestResponse.json();
        setRates(latestData.rates);
        setCurrencies([baseCurrency, ...Object.keys(latestData.rates)]);

        // Fetch previous day rates for comparison
        const previousResponse = await fetch(
          `http://localhost:8000/api/exchange-rates/previous/?base=${baseCurrency}`
        );
        const previousData = await previousResponse.json();
        setPreviousRates(previousData.rates);
      } catch (error) {
        console.error("Error fetching rates:", error);
      }
    };

    fetchRates();
  }, [baseCurrency]);

  // Calculate rate change
  const getRateChange = (currency) => {
    const currentRate = isReversed
      ? 1 / latestRates[currency]
      : latestRates[currency];
    const previousRate = isReversed
      ? 1 / previousRates[currency]
      : previousRates[currency];

    if (!previousRate) return null;
    return currentRate > previousRate;
  };

  // Format rate display
  const formatRate = (rate) => {
    if (!rate) return "N/A";
    return isReversed ? (1 / rate).toFixed(4) : rate.toFixed(4);
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <select
          className="base-currency-select"
          value={baseCurrency}
          onChange={(e) => {
            setBaseCurrency(e.target.value);
          }}
        >
          {currencies.map((currency) => (
            <option key={currency} value={currency}>
              {currency} - {currencyNames[currency]}
            </option>
          ))}
        </select>

        <div className="display-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isReversed}
              onChange={() => setIsReversed(!isReversed)}
            />
            <span className="slider round"></span>
          </label>
          <span>Reverse Rates</span>
        </div>
      </div>

      <div className="rates-grid">
        {currencies
          .filter((currency) => currency !== baseCurrency)
          .map((currency) => (
            <div
              key={currency}
              className="rate-card"
              onClick={() => {
                const from = isReversed ? currency : baseCurrency;
                const to = isReversed ? baseCurrency : currency;
                props.onCardClick(from, to);
              }}
              style={{ cursor: "pointer" }}
            >
              <div className="rate-header">
                <span className="currency-pair">
                  {isReversed ? currency : baseCurrency}/
                  {isReversed ? baseCurrency : currency}
                </span>
                {getRateChange(currency) !== null && (
                  <span
                    className={`change-indicator ${getRateChange(currency) ? "up" : "down"}`}
                  >
                    {getRateChange(currency) ? (
                      <TiArrowSortedUp size={20} />
                    ) : (
                      <TiArrowSortedDown size={20} />
                    )}
                  </span>
                )}
              </div>
              <div className="rate-value">
                {formatRate(latestRates[currency] || null, currency)}
              </div>
              <div className="currency-names">
                {isReversed
                  ? `${currencyNames[currency]} / ${currencyNames[baseCurrency]}`
                  : `${currencyNames[baseCurrency]} / ${currencyNames[currency]}`}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

CurrencyDashboard.propTypes = {
  onCardClick: PropTypes.func,
};
export default CurrencyDashboard;
