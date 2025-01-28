from django.core.management.base import BaseCommand
from rest_framework.test import APIClient
import os
import time
import random

class Command(BaseCommand):
    help = 'Test Redis caching performance with real data'

    def handle(self, *args, **kwargs):
        client = APIClient()
        if os.getenv('GITHUB_ACTIONS'):
            client.defaults['SERVER_NAME'] = 'web'
            client.defaults['HTTP_HOST'] = 'web:8000'
        else:
            client.defaults['SERVER_NAME'] = 'localhost'
            client.defaults['HTTP_HOST'] = 'localhost:8000'
        currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD']
        periods = ['1m', '1y', '5y']

        print("\n🔍 Redis Caching Performance Test")
        print("================================")

        results = []

        for currency in (currencies):
            base = currency
            target = random.choice([c for c in currencies if c != base])
            period = random.choice(periods)

            urls = [
                f'/api/exchange-rates/latest/?base={base}',
                f'/api/exchange-rates/previous/?base={base}',
                f'/api/exchange-rates/historical/?from={base}&to={target}&period={period}'
            ]

            print(f"\nTest Case for {currency} base")
            print("-" * 30)

            for url in urls:
                
                print(f"\nTesting: {url}")

                try:
                    # First request (no cache)
                    start = time.time()
                    first_response = client.get(url)
                    first_time = (time.time() - start) * 1000

                    # Second request (cached)
                    start = time.time()
                    second_response = client.get(url)
                    second_time = (time.time() - start) * 1000

                    improvement = ((first_time - second_time)/first_time * 100)
                    results.append({
                        'url': url,
                        'first': first_time,
                        'second': second_time,
                        'improvement': improvement
                    })

                    print(f"First Request (No Cache): {first_time:.2f}ms")
                    print(f"Second Request (Cached): {second_time:.2f}ms")
                    print(f"Speed Improvement: {improvement:.1f}%")

                except Exception as e:
                        print(f"Error testing {url}: {str(e)}")
                        continue

        # Summary statistics
        print("\n📊 Performance Summary")
        print("====================")
        if results:
            avg_first = sum(r['first'] for r in results) / len(results)
            avg_second = sum(r['second'] for r in results) / len(results)
            avg_improvement = sum(r['improvement'] for r in results) / len(results)
        
            print(f"Average First Request Time: {avg_first:.2f}ms")
            print(f"Average Cached Request Time: {avg_second:.2f}ms")
            print(f"Average Speed Improvement: {avg_improvement:.1f}%")
        else:
            print("No successful tests completed")

