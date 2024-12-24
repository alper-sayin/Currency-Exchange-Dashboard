import { handleSwap } from "../utils";
import { render, screen, fireEvent } from "@testing-library/react";
import CurrencyCalculator from "../components/CurrencyCalculator";
import CurrencyDashboard from "../components/CurrencyDashboard";
import HistoricalRates from "../components/HistoricalRates";

describe("Utility Functions", () => {
  test("handleSwap should swap currencies correctly", () => {
    const setFromCurrency = jest.fn();
    const setToCurrency = jest.fn();

    handleSwap("USD", "EUR", setFromCurrency, setToCurrency);

    expect(setFromCurrency).toHaveBeenCalledWith("EUR");
    expect(setToCurrency).toHaveBeenCalledWith("USD");
  });
});

describe("CurrencyCalculator Component", () => {
  beforeEach(() => {
    // Setup mock for API calls
    global.fetch = jest.fn((url) => {
      if (url === "http://localhost:8000/api/exchange-rates/latest/") {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rates: { EUR: 0.85, GBP: 0.73, JPY: 110.0 },
              base: "USD",
              date: "2024-07-21",
            }),
        });
      }
      if (url.includes("/api/exchange-rates/convert")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              result: 85.0,
            }),
        });
      }
    });
  });

  test("should render currency inputs and swap button", async () => {
    render(<CurrencyCalculator />);
    expect(screen.getByPlaceholderText("Enter amount")).toBeInTheDocument();
    expect(screen.getByText("⇄")).toBeInTheDocument();
    const currencySelects = screen.getAllByRole("combobox");
    expect(currencySelects).toHaveLength(2);
    await screen.findByDisplayValue("EUR");
    await screen.findByDisplayValue("USD");
    expect(currencySelects[0]).toHaveDisplayValue("EUR"); // fromCurrency default
    expect(currencySelects[1]).toHaveDisplayValue("USD"); // toCurrency default
  });

  test("should handle valid and invalid amount inputs", () => {
    render(<CurrencyCalculator />);
    const input = screen.getByPlaceholderText("Enter amount");

    // Test valid input
    fireEvent.change(input, { target: { value: 123.45 } });
    expect(input).toHaveValue(123.45);

    // Test invalid input (letters)
    fireEvent.change(input, { target: { value: "abc" } });
    expect(input).toHaveValue(null); // Should be empty due to regex validation
  });

  test("should swap currencies", async () => {
    render(<CurrencyCalculator />);

    const swapButton = screen.getByText("⇄");
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    fireEvent.click(swapButton);

    // Wait for the state update
    await screen.findByDisplayValue("EUR");

    expect(fromSelect).toHaveValue("USD");
    expect(toSelect).toHaveValue("EUR");
  });

  test("should show all available currencies in dropdowns", async () => {
    render(<CurrencyCalculator />);

    // Wait for initial load
    await screen.findByDisplayValue("EUR");

    const [fromSelect] = screen.getAllByRole("combobox");
    const options = Array.from(fromSelect.options).map(
      (option) => option.value
    );
    const expectedCurrencies = ["USD", "EUR", "GBP", "JPY"];

    // Direct set comparison
    expect(new Set(options)).toEqual(new Set(expectedCurrencies));
  });

  test("should allow users to select different currencies", async () => {
    render(<CurrencyCalculator />);

    await screen.findByDisplayValue("EUR");

    // Wait for currency selects to be populated
    const [fromSelect, toSelect] = screen.getAllByRole("combobox");

    // Change from currency
    fireEvent.change(fromSelect, { target: { value: "GBP" } });
    expect(fromSelect).toHaveValue("GBP");

    // Change to currency
    fireEvent.change(toSelect, { target: { value: "JPY" } });
    expect(toSelect).toHaveValue("JPY");
  });

  test("should show result", async () => {
    render(<CurrencyCalculator />);

    await screen.findByDisplayValue("EUR");

    const amountInput = screen.getByPlaceholderText("Enter amount");
    fireEvent.change(amountInput, { target: { value: 100 } });

    const resultValue = await screen.findByText("85,00");
    expect(resultValue).toBeInTheDocument();
  });
});

describe("CurrencyDashboard Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      // Mock for currency codes and names
      if (url.includes("/api/currencies/codes_and_names/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              USD: "United States Dollar",
              EUR: "Euro",
              GBP: "British Pound",
              JPY: "Japanese Yen",
            }),
        });
      }
      // Mock for latest rates
      if (url.includes("/api/exchange-rates/latest/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rates: {
                EUR: 0.85,
                GBP: 0.73,
                JPY: 110.0,
              },
              base: "USD",
              date: "2024-07-21",
            }),
        });
      }
      // Mock for previous rates
      if (url.includes("/api/exchange-rates/previous/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rates: {
                EUR: 0.84,
                GBP: 0.74,
                JPY: 109.0,
              },
              base: "USD",
              date: "2024-07-20",
            }),
        });
      }
    });
  });

  test("should render initial dashboard elements", async () => {
    render(<CurrencyDashboard />);

    await screen.findByText("0.8500");

    // Check base currency select
    const baseSelect = screen.getByRole("combobox");
    expect(baseSelect).toHaveValue("USD");

    // Check reverse toggle
    expect(screen.getByText("Reverse Rates")).toBeInTheDocument();
    const toggleSwitch = screen.getByRole("checkbox");
    expect(toggleSwitch).not.toBeChecked();
  });

  test("should display currency cards with rates", async () => {
    render(<CurrencyDashboard />);

    // Wait for rates to load
    await screen.findByText("0.8500");

    // Check currency pairs
    expect(screen.getByText("USD/EUR")).toBeInTheDocument();
    expect(screen.getByText("USD/GBP")).toBeInTheDocument();
    expect(screen.getByText("USD/JPY")).toBeInTheDocument();
  });

  test("should handle reverse rates toggle", async () => {
    render(<CurrencyDashboard />);

    await screen.findByText("0.8500");

    const toggleSwitch = screen.getByRole("checkbox");
    fireEvent.click(toggleSwitch);

    // Check reversed rates
    expect(screen.getByText("1.1765")).toBeInTheDocument(); // 1/0.85
  });

  test("should handle base currency change", async () => {
    render(<CurrencyDashboard />);

    await screen.findByText("0.8500");
    const baseSelect = screen.getByRole("combobox");
    fireEvent.change(baseSelect, { target: { value: "EUR" } });

    // Wait for new rates to load
    await screen.findByText("EUR/JPY");
  });

  test("should show rate change indicators", async () => {
    render(<CurrencyDashboard />);

    await screen.findByText("0.8500");

    // Find the rate cards that contain both currency pairs and their indicators
    // eslint-disable-next-line testing-library/no-node-access
    const eurRateCard = screen.getByText("USD/EUR").parentElement;
    // eslint-disable-next-line testing-library/no-node-access
    const gbpRateCard = screen.getByText("USD/GBP").parentElement;

    // Check if the correct indicators are present in each card
    // eslint-disable-next-line testing-library/no-node-access
    expect(eurRateCard.querySelector(".change-indicator")).toHaveClass("up");
    // eslint-disable-next-line testing-library/no-node-access
    expect(gbpRateCard.querySelector(".change-indicator")).toHaveClass("down");
  });
  test("should display currency names alongside codes", async () => {
    render(<CurrencyDashboard />);

    // Wait for the component to load
    await screen.findByText("0.8500");

    // Check for the presence of currency names
    expect(screen.getByText("USD - United States Dollar")).toBeInTheDocument();
    expect(screen.getByText("EUR - Euro")).toBeInTheDocument();
    expect(screen.getByText("GBP - British Pound")).toBeInTheDocument();
    expect(screen.getByText("JPY - Japanese Yen")).toBeInTheDocument();
  });
});
describe("HistoricalRates Component", () => {
  beforeEach(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    global.fetch = jest.fn((url) => {
      // Mock for currency codes and names
      if (url.includes("/api/currencies/codes_and_names/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              USD: "United States Dollar",
              EUR: "Euro",
              GBP: "British Pound",
              JPY: "Japanese Yen",
            }),
        });
      }
      // Mock for historical data
      if (url.includes("/api/exchange-rates/historical/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              from: "GBP",
              to: "JPY",
              period: "1m",
              data: [
                { date: "2024-07-23", rate: 205.4 },
                { date: "2024-07-22", rate: 204.3 },
                { date: "2024-07-21", rate: 207.8 },
              ],
            }),
        });
      }
      if (url.includes("/api/exchange-rates/latest/")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              rates: {
                EUR: 0.85,
                GBP: 0.73,
                JPY: 110.0,
              },
              base: "USD",
              date: "2024-07-21",
            }),
        });
      }
    });
  });

  test("should render initial chart elements", async () => {
    render(<HistoricalRates initialCurrencies={{ from: "GBP", to: "JPY" }} />);

    // Wait for data to load
    await screen.findByDisplayValue("GBP");

    // Check period select
    const periodSelect = screen.getByDisplayValue("1 Month");
    expect(periodSelect).toBeInTheDocument();
    // Check initialized combobox values
    const selects = screen.getAllByRole("combobox");
    expect(selects[0].value).toBe("GBP");
    expect(selects[1].value).toBe("JPY");
  });

  test("should handle currency swap", async () => {
    render(<HistoricalRates initialCurrencies={{ from: "GBP", to: "JPY" }} />);

    await screen.findByDisplayValue("GBP");

    const swapButton = screen.getByText("⇄");
    fireEvent.click(swapButton);

    const selects = screen
      .getAllByRole("combobox")
      .filter((select) => select.className === "currency-select");
    expect(selects[0].value).toBe("JPY");
    expect(selects[1].value).toBe("GBP");
  });

  test("should handle period change", async () => {
    render(<HistoricalRates initialCurrencies={{ from: "GBP", to: "JPY" }} />);

    await screen.findByDisplayValue("GBP");

    const periodSelect = screen
      .getAllByRole("combobox")
      .find((select) => select.className === "period-select");

    fireEvent.change(periodSelect, { target: { value: "1y" } });
    expect(screen.getByDisplayValue("1 Year")).toBeInTheDocument();
  });
});
