from django.core.management.base import BaseCommand
import json
from exchange.models import ExchangeRate, Currency
from datetime import datetime

class Command(BaseCommand):
    help = 'Load historical exchange rates from JSON file'

    def handle(self, *args, **kwargs):
        try:
            with open('backend/exchange/historical_data/all_historical_rates.json', 'r') as file:
                data = json.load(file)
            base_currency = data['base']
            with open('backend/exchange/historical_data/currency_names.json', 'r') as file:
                currency_dict = json.load(file)
            
            for date_string, daily_rates in data['rates'].items():
                date = datetime.strptime(date_string, '%Y-%m-%d').date()
                exchange_rate = ExchangeRate.objects.create(
                    base=base_currency,
                    date=date,
                    rates=daily_rates 
                )
            
            unique_currencies = set()
            for daily_rates in data['rates'].values():
                unique_currencies.update(daily_rates.keys())
            unique_currencies.add('USD')

            for currency_code in unique_currencies:
                currency_name = currency_dict.get(currency_code, currency_code)
                Currency.objects.get_or_create(
                    code=currency_code,
                    defaults={'name': currency_name}
                )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully loaded exchange rates for {len(data["rates"])} days'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error loading data: {str(e)}')
            )