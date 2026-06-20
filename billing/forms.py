from django import forms
from .models import Company, Customer, Invoice

class CompanyForm(forms.ModelForm):
    class Meta:
        model = Company
        fields = [
            'company_name', 'address', 'phone', 'gst_number', 
            'state_code', 'pan_number', 'bank_name', 
            'account_number', 'ifsc_code', 'terms_conditions'
        ]
        widgets = {
            'company_name': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'gst_number': forms.TextInput(attrs={'class': 'form-control'}),
            'state_code': forms.TextInput(attrs={'class': 'form-control'}),
            'pan_number': forms.TextInput(attrs={'class': 'form-control'}),
            'bank_name': forms.TextInput(attrs={'class': 'form-control'}),
            'account_number': forms.TextInput(attrs={'class': 'form-control'}),
            'ifsc_code': forms.TextInput(attrs={'class': 'form-control'}),
            'terms_conditions': forms.Textarea(attrs={'class': 'form-control', 'rows': 5}),
        }


class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['name', 'address', 'gst_number']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'gst_number': forms.TextInput(attrs={'class': 'form-control'}),
        }

    def clean_gst_number(self):
        gst_number = self.cleaned_data.get('gst_number')
        if gst_number:
            gst_number = gst_number.strip().upper()
        return gst_number


class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = [
            'bill_number', 'customer', 'challan_no', 'broker', 'hsn_code', 'bill_date',
            'gross_amount', 'discount_percent', 'discount_amount',
            'blouse_charge', 'subtotal', 'sgst_percent', 'sgst_amount',
            'cgst_percent', 'cgst_amount', 'round_off', 'grand_total',
            'amount_in_words'
        ]
        widgets = {
            'bill_number': forms.TextInput(attrs={'class': 'form-control'}),
            'customer': forms.Select(attrs={'class': 'form-select'}),
            'challan_no': forms.TextInput(attrs={'class': 'form-control'}),
            'broker': forms.TextInput(attrs={'class': 'form-control'}),
            'hsn_code': forms.TextInput(attrs={'class': 'form-control'}),
            'bill_date': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'gross_amount': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'discount_percent': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'discount_amount': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'blouse_charge': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'subtotal': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'sgst_percent': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'sgst_amount': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'cgst_percent': forms.NumberInput(attrs={'class': 'form-control', 'step': '0.01'}),
            'cgst_amount': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'round_off': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'grand_total': forms.NumberInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
            'amount_in_words': forms.TextInput(attrs={'class': 'form-control', 'readonly': 'readonly'}),
        }

    def clean_bill_number(self):
        bill_number = self.cleaned_data.get('bill_number')
        if not bill_number or not bill_number.strip():
            return None
        return bill_number.strip()
