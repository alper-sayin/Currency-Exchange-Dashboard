export const handleSwap = (
  fromCurrency,
  toCurrency,
  setFromCurrency,
  setToCurrency
) => {
  setFromCurrency(toCurrency);
  setToCurrency(fromCurrency);
};
