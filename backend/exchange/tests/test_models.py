import pytest
from exchange.models import Currency, ExchangeRate
from datetime import date, timedelta
from unittest.mock import Mock, patch

@pytest.fixture(autouse=True)
def mock_redis():
    with patch('django_redis.get_redis_connection') as mock_conn:
        # Create a mock Redis client with basic functionality
        mock_client = Mock()
        mock_client.get.return_value = None
        mock_client.set.return_value = True
        mock_conn.return_value = mock_client
        yield mock_client

@pytest.mark.django_db
class TestCurrencyModel:
    def test_currency_creation(self):
        currency = Currency.objects.create(
            code="USD",
            name="US Dollar",
            is_active=True
        )
        assert currency.code == "USD"
        assert currency.name == "US Dollar"
        assert currency.is_active is True

    def test_currency_string_representation(self):
        currency = Currency.objects.create(
            code="EUR",
            name="Euro",
            is_active=True
        )
        assert str(currency) == "EUR - Euro"

    def test_currency_max_length(self):
        with pytest.raises(Exception):
            Currency.objects.create(
                code="USDD",  # Should fail as max_length is 3
                name="US Dollar"
            )

@pytest.mark.django_db
class TestExchangeRateModel:
    @pytest.fixture
    def sample_rates(self):
        return {
            "EUR": 0.85,
            "GBP": 0.73,
            "JPY": 110.0
        }
    
    def test_exchange_rate_creation(self, sample_rates):
        exchange_rate = ExchangeRate.objects.create(
            date=date.today(),
            rates=sample_rates,
            base="USD"
        )
        assert exchange_rate.base == "USD"
        assert exchange_rate.rates == sample_rates

    def test_get_rate_calculations(self, sample_rates):
        exchange_rate = ExchangeRate.objects.create(
            date=date.today(),
            rates=sample_rates,
            base="USD"
        )
        
        # Test base to other currency (USD to EUR)
        assert exchange_rate.get_rate("USD", "EUR") == 0.85
        
        # Test other currency to base (EUR to USD)
        assert round(exchange_rate.get_rate("EUR", "USD"), 6) == round(1/0.85, 6)
        
        # Test cross-rate (EUR to GBP)
        assert round(exchange_rate.get_rate("EUR", "GBP"), 6) == round(0.73/0.85, 6)
        
        
    def test_get_rates_for_base(self, sample_rates):
        exchange_rate = ExchangeRate.objects.create(
            date=date.today(),
            rates=sample_rates,
            base="USD"
        )
        
        # Test converting to EUR base
        eur_rates = exchange_rate.get_rates_for_base("EUR")
        assert round(eur_rates["USD"], 6) == round(1/0.85, 6)
        assert round(eur_rates["GBP"], 6) == round(0.73/0.85, 6)
        assert round(eur_rates["JPY"], 6) == round(110.0/0.85, 6)
        
        # Test same base
        usd_rates = exchange_rate.get_rates_for_base("USD")
        assert usd_rates == sample_rates

@pytest.mark.django_db
class TestExchangeRateViewSet:

    @pytest.fixture
    def sample_rates(self):
        return {
            "EUR": 0.85,
            "GBP": 0.73,
            "JPY": 110.0
        }
    
    @pytest.fixture
    def exchange_rate(self, sample_rates):
        return ExchangeRate.objects.create(
            date=date.today(),
            rates=sample_rates,
            base="USD"
        )

    def test_latest_rates(self, client, exchange_rate, sample_rates):
        response = client.get('/api/exchange-rates/latest/')
        assert response.status_code == 200
        assert response.json()['rates'] == sample_rates
        assert response.json()['base'] == "USD"

    def test_previous_rates(self, client, sample_rates):
        # Create two exchange rates with different dates
        yesterday = date.today() - timedelta(days=1)
        ExchangeRate.objects.create(
            date=yesterday,
            rates=sample_rates,
            base="USD"
        )
        
        today_rates = {"EUR": 0.86, "GBP": 0.74, "JPY": 111.0}
        ExchangeRate.objects.create(
            date=date.today(),
            rates=today_rates,
            base="USD"
        )

        response = client.get('/api/exchange-rates/previous/')
        assert response.status_code == 200
        assert response.json()['rates'] == sample_rates
        assert response.json()['date'] == yesterday.isoformat()

    def test_convert_currency(self, client, exchange_rate):
        response = client.get('/api/exchange-rates/convert/', {
            'amount': '100',
            'from': 'USD',
            'to': 'EUR'
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data['from'] == 'USD'
        assert data['to'] == 'EUR'
        assert data['amount'] == 100.0
        assert data['result'] == 85.0 
        assert data['rate'] == 0.85

    