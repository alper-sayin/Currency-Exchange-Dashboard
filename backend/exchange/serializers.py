from rest_framework import serializers
from .models import Currency, ExchangeRate

class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['code', 'name']

class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ['date', 'rates', 'base']

    def to_representation(self, instance):
        
        request = self.context.get('request')
        base_currency = request.query_params.get('base', 'USD') if request else 'USD'

        representation = super().to_representation(instance)

        if base_currency != instance.base:
            representation['rates'] = instance.get_rates_for_base(base_currency)
            representation['base'] = base_currency
            
        return representation
    
class HistoricalRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = ['date', 'rates']

    def to_representation(self, instance):
      
        request = self.context.get('request')
        from_currency = request.query_params.get('from', 'USD')
        to_currency = request.query_params.get('to')
        rate = instance.get_rate(from_currency, to_currency)
        
        return {
            'date': instance.date,
            'rate': rate
        }
