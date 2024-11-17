from django.db import models

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        verbose_name_plural = "currencies"
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class ExchangeRate(models.Model):   
    date = models.DateField()
    rates = models.JSONField()
    base = models.CharField(max_length=3, default='USD')
    
    class Meta:
        indexes = [models.Index(fields=['date'])]
        get_latest_by = 'date'
    
    def get_rate(self, from_currency, to_currency):
            
        if from_currency == self.base:
            return self.rates.get(to_currency)
        elif to_currency == self.base:
            return 1 / self.rates.get(from_currency)
        else:
            return self.rates.get(to_currency) / self.rates.get(from_currency)

    def get_rates_for_base(self, base_currency):
        import logging
        logger = logging.getLogger(__name__)

        
        if base_currency == self.base:
            return self.rates
            
        converted_rates = {}
        base_rate = self.rates[base_currency]
        
        for currency, rate in self.rates.items():
            if currency != base_currency:
                converted_rates[currency] = rate / base_rate                        
                
        converted_rates[self.base] = 1 / base_rate
        return converted_rates
