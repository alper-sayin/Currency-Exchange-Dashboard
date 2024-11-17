export const fetchCurrencies = async () => {
  try {
    const response = await fetch(
      "http://localhost:8000/api/exchange-rates/latest/"
    );
    const data = await response.json();
    const availableCurrencies = Object.keys(data.rates);
    return ["USD", ...availableCurrencies];
  } catch (error) {
    console.error("Error fetching currencies:", error);
    throw error;
  }
};

export const fetchCurrencyCodesNames = async () => {
  try {
    const response = await fetch(
      "http://localhost:8000/api/currencies/codes_and_names/"
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching currency names:", error);
    throw error;
  }
};
