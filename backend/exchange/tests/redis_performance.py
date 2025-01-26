import pytest
import time
from django_redis import get_redis_connection
from rest_framework.test import APIClient
import os
from datetime import datetime, timedelta
from exchange.models import ExchangeRate

class TestRedisPerformance:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.redis_conn = get_redis_connection("default")
        
        # Clear Redis cache
        self.redis_conn.flushall()
        
        # Create test data
        base_date = datetime.now().date()
        rates = {
            'USD': 1.0, 'EUR': 0.85, 'GBP': 0.73, 'JPY': 110.0,
            'AUD': 1.35, 'CAD': 1.25, 'CHF': 0.92, 'CNY': 6.45,
            'HKD': 7.78, 'NZD': 1.42
        }
        
        # Create current and previous day rates
        ExchangeRate.objects.create(
            date=base_date,
            rates=rates
        )
        ExchangeRate.objects.create(
            date=base_date - timedelta(days=1),
            rates=rates
        )
        
        # Create historical rates for the past month
        for i in range(30):
            ExchangeRate.objects.create(
                date=base_date - timedelta(days=i),
                rates=rates
            )
        
    def measure_response_time(self, url):
        start_time = time.time()
        response = self.client.get(url)
        end_time = time.time()
        return (end_time - start_time) * 1000, response  # Convert to milliseconds

    @pytest.mark.django_db
    def test_currency_exchange_cache(self):
        iterations = int(os.getenv('TEST_ITERATIONS', '5'))
        base_currency = 'EUR'
        latest_url = f'/api/exchange-rates/latest/?base={base_currency}'
        previous_url = f'/api/exchange-rates/previous/?base={base_currency}'
        
        print("\n🔍 Testing Currency Exchange Endpoints")
        print(f"Running {iterations} iterations...\n")
        
        # First requests (cache miss)
        latest_db_time, latest_response = self.measure_response_time(latest_url)
        previous_db_time, previous_response = self.measure_response_time(previous_url)
        assert latest_response.status_code == 200
        assert previous_response.status_code == 200
        total_db_time = latest_db_time + previous_db_time
        print(f"Database Query (Cache Miss) - Latest: {latest_db_time:.2f}ms")
        print(f"Database Query (Cache Miss) - Previous: {previous_db_time:.2f}ms")
        print(f"Total Database Query Time: {total_db_time:.2f}ms")
        
        # Cache hit measurements
        latest_cache_times = []
        previous_cache_times = []
        for i in range(iterations):
            time.sleep(0.1)  # Small delay between requests
            latest_time, _ = self.measure_response_time(latest_url)
            previous_time, _ = self.measure_response_time(previous_url)
            total_time = latest_time + previous_time
            latest_cache_times.append(latest_time)
            previous_cache_times.append(previous_time)
            print(f"Cache Query {i+1} - Total: {total_time:.2f}ms")
        
        avg_latest_cache = sum(latest_cache_times) / len(latest_cache_times)
        avg_previous_cache = sum(previous_cache_times) / len(previous_cache_times)
        avg_total_cache = avg_latest_cache + avg_previous_cache
        improvement = ((total_db_time - avg_total_cache) / total_db_time) * 100
        
        print(f"\n📊 Performance Summary")
        print(f"Average Cache Query - Latest: {avg_latest_cache:.2f}ms")
        print(f"Average Cache Query - Previous: {avg_previous_cache:.2f}ms")
        print(f"Average Total Cache Query: {avg_total_cache:.2f}ms")
        print(f"Performance Improvement: {improvement:.1f}%")

    @pytest.mark.django_db
    def test_historical_rates_cache(self):
        iterations = int(os.getenv('TEST_ITERATIONS', '5'))
        url = '/api/exchange-rates/historical/?from=EUR&to=USD&period=1m'
        
        print("\n🔍 Testing Historical Rates Endpoint")
        print(f"Running {iterations} iterations...\n")
        
        # First request (cache miss)
        db_time, response = self.measure_response_time(url)
        print(f"Database Query (Cache Miss): {db_time:.2f}ms")
        assert response.status_code == 200
        
        # Cache hit measurements
        cache_times = []
        for i in range(iterations):
            time.sleep(0.1)  # Small delay between requests
            cache_time, response = self.measure_response_time(url)
            cache_times.append(cache_time)
            print(f"Cache Query {i+1}: {cache_time:.2f}ms")
            assert response.status_code == 200
        
        avg_cache_time = sum(cache_times) / len(cache_times)
        improvement = ((db_time - avg_cache_time) / db_time) * 100
        
        print(f"\n📊 Performance Summary")
        print(f"Average Cache Query: {avg_cache_time:.2f}ms")
        print(f"Performance Improvement: {improvement:.1f}%")