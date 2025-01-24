from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .serializers import CurrencySerializer, ExchangeRateSerializer, HistoricalRateSerializer
from .models import Currency, ExchangeRate
from datetime import timedelta
from django_redis import get_redis_connection
import json

class CurrencyViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Currency.objects.filter(is_active=True)
    serializer_class = CurrencySerializer

    @action(detail=False, methods=['get'])
    def codes_and_names(self, request):
        """Return dictionary of currency codes and names"""
        currencies = self.get_queryset()
        return Response({
            currency.code: currency.name 
            for currency in currencies
        })


class ExchangeRateViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    

    @action(detail=False, methods=['get'])
    def latest(self, request):

        redis_conn = get_redis_connection("default")
        base = request.query_params.get('base', 'USD')
        cache_key = f"latest_rates_{base}"
        cached_data = redis_conn.get(cache_key)
        
        if cached_data:
            return Response(json.loads(cached_data))

        latest_rate = self.get_queryset().latest('date')
        serializer = self.get_serializer(latest_rate, context={'request': request})
        data =serializer.data
        redis_conn.setex(cache_key, 3600, json.dumps(data))
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def previous(self, request):

        redis_conn = get_redis_connection("default")
        base = request.query_params.get('base', 'USD')
        cache_key = f"previous_rates_{base}"
        cached_data = redis_conn.get(cache_key)


        if cached_data:
         return Response(json.loads(cached_data))

         
        latest = self.get_queryset().latest('date')
        previous = self.get_queryset().filter(date__lt=latest.date).latest('date')
        
        serializer = self.get_serializer(previous, context={'request': request})
        data =serializer.data
        redis_conn.setex(cache_key, 3600, json.dumps(data))
        return Response(data)
    

    @action(detail=False, methods=['get'])
    def historical(self, request):
        from_currency = request.query_params.get('from', 'USD')
        to_currency = request.query_params.get('to', 'EUR')
        period = request.query_params.get('period', '1w')

        redis_conn = get_redis_connection("default")
        cache_key = f"historical_rates_{from_currency}_{to_currency}_{period}"

        cached_data = redis_conn.get(cache_key)
        if cached_data:
         return Response(json.loads(cached_data))
        
        periods = {
            '1w': 7,
            '1m': 30,
            '1y': 365,
            '5y': 365 * 5,
            '10y': 365 * 10
        }
        
        end_date = self.get_queryset().latest('date').date
        start_date = end_date - timedelta(days=periods[period])

        historical_rates = self.get_queryset().filter(
            date__gte=start_date,
            date__lte=end_date
        ).order_by('date')

        serializer = HistoricalRateSerializer(
            historical_rates, 
            many=True,
            context={'request': request}
        )

        response_data = {
        'from': from_currency,
        'to': to_currency,
        'period': period,
        'data': serializer.data
        }

        serialized_data = json.dumps(response_data, default=str)

        redis_conn.setex(
        cache_key, 
        3600, 
        serialized_data
    )
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def convert(self, request):
        """Currency conversion calculator"""
        amount = Decimal(request.query_params.get('amount', '1.0'))
        from_currency = request.query_params.get('from', 'USD')
        to_currency = request.query_params.get('to', 'EUR')

       
        latest_rate = self.get_queryset().latest('date')
        
        
        rate = latest_rate.get_rate(from_currency, to_currency)
        converted_amount = amount * Decimal(str(rate))

        return Response({
            'from': from_currency,
            'to': to_currency,
            'amount': float(amount),
            'rate': float(rate),
            'result': float(converted_amount),
            'date': latest_rate.date
        })

