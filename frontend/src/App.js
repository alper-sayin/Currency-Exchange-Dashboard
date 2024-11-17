// import logo from "./logo.svg";
import "./App.css";
import React, { useState } from "react";
import CurrencyCalculator from "./components/CurrencyCalculator";
import HistoricalRates from "./components/HistoricalRates";
import CurrencyDashboard from "./components/CurrencyDashboard";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFromTo, setSelectedFromTo] = useState({ from: "", to: "" });

  const tabs = [
    { id: "dashboard", label: "Exchange Rates" },
    { id: "calculator", label: "Currency Calculator" },
    { id: "historical", label: "Historical Rates" },
  ];

  const handleCardClick = (from, to) => {
    setSelectedFromTo({ from, to });
    setActiveTab("historical");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <CurrencyDashboard onCardClick={handleCardClick} />;
      case "calculator":
        return <CurrencyCalculator />;
      case "historical":
        return <HistoricalRates initialCurrencies={selectedFromTo} />;
      default:
        return null;
    }
  };

  return (
    <div className="App">
      <div className="header-container">
        <h1 className="dashboard-title">Currency Exchange Dashboard</h1>
      </div>
      <div className="tabs-container">
        <div className="tabs-header">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="tab-content">{renderContent()}</div>
      </div>
    </div>
  );
}

export default App;
