import json
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.db import transaction
from django.db.models import Q
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.clickjacking import xframe_options_exempt

from .models import Company, Customer, Invoice, InvoiceItem
from .forms import CompanyForm, CustomerForm, InvoiceForm
from .utils import generate_invoice_pdf, generate_bulk_invoice_pdf, number_to_words_indian

# Decorator to enforce JSON API authentication status
def api_login_required(view_func):
    def _wrapped_view_func(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return JsonResponse({'error': 'Authentication required.'}, status=401)
        return view_func(request, *args, **kwargs)
    return _wrapped_view_func

# Serialization Helpers
def serialize_customer(customer):
    return {
        'id': customer.id,
        'name': customer.name,
        'address': customer.address,
        'gst_number': customer.gst_number
    }

def serialize_company(company):
    return {
        'id': company.id,
        'company_name': company.company_name,
        'address': company.address,
        'phone': company.phone,
        'gst_number': company.gst_number,
        'state_code': company.state_code,
        'pan_number': company.pan_number,
        'bank_name': company.bank_name,
        'account_number': company.account_number,
        'ifsc_code': company.ifsc_code,
        'terms_conditions': company.terms_conditions
    }

def serialize_invoice(invoice):
    return {
        'id': invoice.id,
        'bill_number': invoice.bill_number or '',
        'customer': {
            'id': invoice.customer.id if invoice.customer else None,
            'name': invoice.display_customer_name,
            'address': invoice.display_customer_address,
            'gst_number': invoice.display_customer_gst_number
        },
        'challan_no': invoice.challan_no,
        'broker': invoice.broker,
        'hsn_code': invoice.hsn_code,
        'bill_date': invoice.bill_date.isoformat() if invoice.bill_date else '',
        'gross_amount': float(invoice.gross_amount),
        'discount_percent': float(invoice.discount_percent),
        'discount_amount': float(invoice.discount_amount),
        'blouse_charge': float(invoice.blouse_charge),
        'subtotal': float(invoice.subtotal),
        'sgst_percent': float(invoice.sgst_percent),
        'sgst_amount': float(invoice.sgst_amount),
        'cgst_percent': float(invoice.cgst_percent),
        'cgst_amount': float(invoice.cgst_amount),
        'round_off': float(invoice.round_off),
        'grand_total': float(invoice.grand_total),
        'amount_in_words': invoice.amount_in_words,
        'created_at': invoice.created_at.isoformat() if invoice.created_at else ''
    }

def serialize_invoice_item(item):
    return {
        'id': item.id,
        'p_ch_no': item.p_ch_no,
        'lot_no': item.lot_no,
        'design': item.design,
        'meter': float(item.meter),
        't_qty': float(item.t_qty),
        'p_qty': float(item.p_qty),
        's_qty': float(item.s_qty),
        'qty': float(item.qty),
        'rate': float(item.rate),
        'amount': float(item.amount)
    }

# View Actions
@ensure_csrf_cookie
def auth_status(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'isAuthenticated': True,
            'username': request.user.username
        })
    return JsonResponse({
        'isAuthenticated': False
    })

@ensure_csrf_cookie
def login_view(request):
    if request.user.is_authenticated:
        return JsonResponse({
            'success': True,
            'username': request.user.username
        })
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            username = data.get('username')
            password = data.get('password')
            user = authenticate(request, username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({
                    'success': True,
                    'username': user.username
                })
            else:
                return JsonResponse({'error': 'Invalid username or password.'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

def logout_view(request):
    logout(request)
    return JsonResponse({'success': True})

@api_login_required
def company_settings(request):
    company = Company.objects.first()
    
    if request.method == 'GET':
        if company:
            return JsonResponse(serialize_company(company))
        return JsonResponse({}, status=200)
        
    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            if company:
                form = CompanyForm(data, instance=company)
            else:
                form = CompanyForm(data)
                
            if form.is_valid():
                saved_company = form.save()
                return JsonResponse(serialize_company(saved_company))
            else:
                return JsonResponse({'error': 'Invalid form data.', 'details': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def customer_list(request):
    query = request.GET.get('q', '')
    if query:
        customers = Customer.objects.filter(
            Q(name__icontains=query) | Q(gst_number__icontains=query)
        ).order_by('name')
    else:
        customers = Customer.objects.all().order_by('name')
        
    serialized = [serialize_customer(c) for c in customers]
    return JsonResponse(serialized, safe=False)

@api_login_required
def customer_get(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    return JsonResponse(serialize_customer(customer))

@api_login_required
def customer_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form = CustomerForm(data)
            if form.is_valid():
                customer = form.save()
                return JsonResponse(serialize_customer(customer))
            else:
                return JsonResponse({'error': 'Invalid customer form.', 'details': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def customer_edit(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form = CustomerForm(data, instance=customer)
            if form.is_valid():
                customer = form.save()
                return JsonResponse(serialize_customer(customer))
            else:
                return JsonResponse({'error': 'Invalid customer form.', 'details': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def customer_delete(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    if request.method == 'POST':
        name = customer.name
        customer.delete()
        return JsonResponse({'success': True, 'message': f"Customer '{name}' deleted successfully."})
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def customer_history(request, pk):
    customer = get_object_or_404(Customer, pk=pk)
    invoices = customer.invoices.all().order_by('-bill_date', '-created_at')
    
    serialized_invoices = []
    for inv in invoices:
        serialized_invoices.append({
            'id': inv.id,
            'bill_number': inv.bill_number,
            'bill_date': inv.bill_date.isoformat() if inv.bill_date else '',
            'challan_no': inv.challan_no,
            'hsn_code': inv.hsn_code,
            'grand_total': float(inv.grand_total)
        })
        
    return JsonResponse({
        'customer': serialize_customer(customer),
        'invoices': serialized_invoices
    })

@api_login_required
def invoice_list(request):
    q_bill = request.GET.get('q_bill', '')
    q_cust = request.GET.get('q_cust', '')
    date_from = request.GET.get('date_from', '')
    date_to = request.GET.get('date_to', '')
    
    invoices = Invoice.objects.all().order_by('-bill_date', '-created_at')
    
    if q_bill:
        invoices = invoices.filter(bill_number__icontains=q_bill)
    if q_cust:
        invoices = invoices.filter(Q(customer__name__icontains=q_cust) | Q(customer_name__icontains=q_cust))
    if date_from:
        invoices = invoices.filter(bill_date__gte=date_from)
    if date_to:
        invoices = invoices.filter(bill_date__lte=date_to)
        
    serialized = []
    for inv in invoices:
        serialized.append({
            'id': inv.id,
            'bill_number': inv.bill_number or '-',
            'customer_name': inv.display_customer_name,
            'bill_date': inv.bill_date.isoformat() if inv.bill_date else '',
            'challan_no': inv.challan_no,
            'hsn_code': inv.hsn_code,
            'grand_total': float(inv.grand_total)
        })
    return JsonResponse(serialized, safe=False)

@api_login_required
def invoice_add(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form = InvoiceForm(data)
            items_data = data.get('items', [])
            
            if not items_data:
                return JsonResponse({'error': 'You must add at least one item to the product table.'}, status=400)
                
            if form.is_valid():
                with transaction.atomic():
                    invoice = form.save(commit=False)
                    if invoice.customer:
                        invoice.customer_name = invoice.customer.name
                        invoice.customer_address = invoice.customer.address
                        invoice.customer_gst_number = invoice.customer.gst_number
                    else:
                        invoice.customer_name = (data.get('customer_name') or '').strip()
                        invoice.customer_address = (data.get('customer_address') or '').strip()
                        invoice.customer_gst_number = (data.get('customer_gst_number') or '').strip()
                    invoice.amount_in_words = number_to_words_indian(invoice.grand_total)
                    invoice.save()
                    
                    for item in items_data:
                        InvoiceItem.objects.create(
                            invoice=invoice,
                            p_ch_no=(item.get('p_ch_no') or '').strip(),
                            lot_no=(item.get('lot_no') or '').strip(),
                            design=(item.get('design') or '').strip(),
                            meter=float(item.get('meter', 0) or 0),
                            t_qty=float(item.get('t_qty', 0) or 0),
                            p_qty=float(item.get('p_qty', 0) or 0),
                            s_qty=float(item.get('s_qty', 0) or 0),
                            qty=float(item.get('qty', 0) or 0),
                            rate=float(item.get('rate', 0) or 0),
                            amount=float(item.get('amount', 0) or 0),
                        )
                return JsonResponse(serialize_invoice(invoice))
            else:
                return JsonResponse({'error': 'Invalid invoice data.', 'details': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def invoice_edit(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            form = InvoiceForm(data, instance=invoice)
            items_data = data.get('items', [])
            
            if not items_data:
                return JsonResponse({'error': 'You must add at least one item to the product table.'}, status=400)
                
            if form.is_valid():
                with transaction.atomic():
                    invoice = form.save(commit=False)
                    if invoice.customer:
                        invoice.customer_name = invoice.customer.name
                        invoice.customer_address = invoice.customer.address
                        invoice.customer_gst_number = invoice.customer.gst_number
                    else:
                        invoice.customer_name = (data.get('customer_name') or '').strip()
                        invoice.customer_address = (data.get('customer_address') or '').strip()
                        invoice.customer_gst_number = (data.get('customer_gst_number') or '').strip()
                    invoice.amount_in_words = number_to_words_indian(invoice.grand_total)
                    invoice.save()
                    
                    # Delete old items and write new ones
                    invoice.items.all().delete()
                    for item in items_data:
                        InvoiceItem.objects.create(
                            invoice=invoice,
                            p_ch_no=(item.get('p_ch_no') or '').strip(),
                            lot_no=(item.get('lot_no') or '').strip(),
                            design=(item.get('design') or '').strip(),
                            meter=float(item.get('meter', 0) or 0),
                            t_qty=float(item.get('t_qty', 0) or 0),
                            p_qty=float(item.get('p_qty', 0) or 0),
                            s_qty=float(item.get('s_qty', 0) or 0),
                            qty=float(item.get('qty', 0) or 0),
                            rate=float(item.get('rate', 0) or 0),
                            amount=float(item.get('amount', 0) or 0),
                        )
                return JsonResponse(serialize_invoice(invoice))
            else:
                return JsonResponse({'error': 'Invalid invoice data.', 'details': form.errors}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Method not allowed.'}, status=405)

@api_login_required
def invoice_view(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    
    serialized_invoice = serialize_invoice(invoice)
    serialized_items = [serialize_invoice_item(item) for item in invoice.items.all()]
    serialized_invoice['items'] = serialized_items
    
    return JsonResponse(serialized_invoice)

@api_login_required
@xframe_options_exempt
def invoice_pdf(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    company = Company.objects.first()
    
    if not company:
        return HttpResponse("Please configure Company Settings first.", status=400)
        
    pdf_data = generate_invoice_pdf(invoice, company)
    
    response = HttpResponse(pdf_data, content_type='application/pdf')
    filename = f"Invoice_{invoice.bill_number.replace('/', '_')}.pdf" if invoice.bill_number else f"Invoice_{invoice.id}.pdf"
    response['Content-Disposition'] = f'inline; filename="{filename}"'
    return response

@api_login_required
def invoice_delete(request, pk):
    invoice = get_object_or_404(Invoice, pk=pk)
    if request.method == 'POST':
        bill_number = invoice.bill_number
        invoice.delete()
        return JsonResponse({'success': True, 'message': f"Invoice {bill_number} deleted successfully."})
    return JsonResponse({'error': 'Method not allowed.'}, status=405)


@api_login_required
@xframe_options_exempt
def invoice_pdf_bulk(request):
    ids_str = request.GET.get('ids', '')
    if not ids_str:
        return HttpResponse("No invoice IDs provided.", status=400)
        
    try:
        ids = [int(x) for x in ids_str.split(',') if x.strip()]
    except ValueError:
        return HttpResponse("Invalid invoice IDs format.", status=400)
        
    if not ids:
        return HttpResponse("No invoice IDs provided.", status=400)
        
    company = Company.objects.first()
    if not company:
        return HttpResponse("Please configure Company Settings first.", status=400)
        
    db_invoices = Invoice.objects.filter(id__in=ids)
    if not db_invoices.exists():
        return HttpResponse("Invoices not found.", status=404)
        
    # Preserve the selection order of the passed IDs
    invoice_map = {inv.id: inv for inv in db_invoices}
    invoices = [invoice_map[inv_id] for inv_id in ids if inv_id in invoice_map]
    
    pdf_data = generate_bulk_invoice_pdf(invoices, company)
    
    response = HttpResponse(pdf_data, content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="Invoices_Bulk.pdf"'
    return response
