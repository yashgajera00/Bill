from django.test import TestCase
from django.utils import timezone
from billing.models import Company, Customer, Invoice, InvoiceItem
from billing.utils import number_to_words_indian

class BillingSystemTests(TestCase):
    def setUp(self):
        # Setup company info
        self.company = Company.objects.create(
            company_name="Aastha Creation",
            address="Surat",
            phone="9876543210",
            gst_number="24AAAAA0000A1Z5",
            pan_number="ABCDE1234F",
            bank_name="SBI",
            account_number="3000",
            ifsc_code="SBIN000"
        )
        
        # Setup customer
        self.customer = Customer.objects.create(
            name="Surat Retailers",
            address="Ring Road, Surat",
            gst_number="24BBBBB0000B1Z5"
        )

    def test_amount_to_words(self):
        self.assertEqual(
            number_to_words_indian(62180.26),
            "Sixty Two Thousand One Hundred and Eighty Rupees and Twenty Six Paise Only"
        )
        self.assertEqual(
            number_to_words_indian(100500.00),
            "One Lakh Five Hundred Rupees Only"
        )

    def test_invoice_creation_and_totals(self):
        # Create test invoice
        invoice = Invoice.objects.create(
            bill_number="TEST/2026/01",
            customer=self.customer,
            bill_date=timezone.localdate(),
            gross_amount=62520.00,
            discount_percent=6.00,
            discount_amount=3751.20,
            blouse_charge=450.00,
            subtotal=59218.80,
            sgst_percent=2.50,
            sgst_amount=1480.47,
            cgst_percent=2.50,
            cgst_amount=1480.47,
            round_off=0.26,
            grand_total=62180.00,
            amount_in_words="Sixty-Two Thousand One Hundred and Eighty Rupees Only"
        )
        
        # Add invoice item
        item = InvoiceItem.objects.create(
            invoice=invoice,
            p_ch_no="543",
            lot_no="RATA",
            design="1088",
            meter=0.00,
            t_qty=120,
            p_qty=0,
            s_qty=0,
            qty=120,
            rate=521.00,
            amount=62520.00
        )
        
        # Verify invoice properties
        self.assertEqual(invoice.items.count(), 1)
        self.assertEqual(invoice.items.first().amount, 62520.00)
        self.assertEqual(invoice.grand_total, 62180.00)
        self.assertEqual(invoice.customer.name, "Surat Retailers")

    def test_invoice_preservation_on_customer_delete(self):
        # Create an invoice with a registered customer
        invoice = Invoice.objects.create(
            bill_number="TEST/2026/02",
            customer=self.customer,
            customer_name=self.customer.name,
            customer_address=self.customer.address,
            customer_gst_number=self.customer.gst_number,
            bill_date=timezone.localdate(),
            grand_total=100.00
        )
        
        # Verify customer relation exists
        self.assertEqual(invoice.customer, self.customer)
        self.assertEqual(invoice.display_customer_name, "Surat Retailers")
        
        # Delete customer
        self.customer.delete()
        
        # Fetch invoice from DB again
        invoice.refresh_from_db()
        
        # Customer relation must be null (SET_NULL)
        self.assertIsNone(invoice.customer)
        
        # Invoice metadata snapshots must remain intact
        self.assertEqual(invoice.customer_name, "Surat Retailers")
        self.assertEqual(invoice.display_customer_name, "Surat Retailers")
        self.assertEqual(invoice.display_customer_address, "Ring Road, Surat")
        self.assertEqual(invoice.display_customer_gst_number, "24BBBBB0000B1Z5")

    def test_invoice_with_ad_hoc_customer(self):
        # Create an invoice without a customer relation (ad-hoc customer)
        invoice = Invoice.objects.create(
            bill_number="TEST/2026/03",
            customer=None,
            customer_name="Ad-hoc Customer",
            customer_address="123 Street Name",
            customer_gst_number="24CCCCCC0000C1Z6",
            bill_date=timezone.localdate(),
            grand_total=250.00
        )
        
        # Verify customer is null but display fields fallback correctly
        self.assertIsNone(invoice.customer)
        self.assertEqual(invoice.customer_name, "Ad-hoc Customer")
        self.assertEqual(invoice.display_customer_name, "Ad-hoc Customer")
        self.assertEqual(invoice.display_customer_address, "123 Street Name")
        self.assertEqual(invoice.display_customer_gst_number, "24CCCCCC0000C1Z6")

    def test_invoice_history_ordering(self):
        import datetime
        # Create three invoices with different bill_dates
        inv_middle = Invoice.objects.create(
            bill_number="TEST/ORD/02",
            bill_date=datetime.date(2026, 6, 15),
            grand_total=100.00
        )
        inv_latest = Invoice.objects.create(
            bill_number="TEST/ORD/03",
            bill_date=datetime.date(2026, 6, 20),
            grand_total=200.00
        )
        inv_oldest = Invoice.objects.create(
            bill_number="TEST/ORD/01",
            bill_date=datetime.date(2026, 6, 10),
            grand_total=300.00
        )
        
        # Query through the view ordering logic
        ordered_invoices = Invoice.objects.all().order_by('-bill_date', '-created_at')
        
        # Verify order is inv_latest (June 20), inv_middle (June 15), inv_oldest (June 10)
        self.assertEqual(ordered_invoices[0].bill_number, "TEST/ORD/03")
        self.assertEqual(ordered_invoices[1].bill_number, "TEST/ORD/02")
        self.assertEqual(ordered_invoices[2].bill_number, "TEST/ORD/01")

    def test_invoice_pdf_view(self):
        from django.contrib.auth.models import User
        user = User.objects.create_user(username='admin', password='password')
        self.client.force_login(user)
        
        import datetime
        invoice = Invoice.objects.create(
            bill_number=None, # Null bill number test
            customer=self.customer,
            bill_date=datetime.date(2026, 6, 20),
            grand_total=100.00
        )
        
        # Request PDF endpoint
        response = self.client.get(f'/api/invoices/pdf/{invoice.id}/')
        
        # Verify response code is 200
        self.assertEqual(response.status_code, 200)
        
        # Verify content type is application/pdf
        self.assertEqual(response['Content-Type'], 'application/pdf')
        
        # Verify content disposition is inline
        self.assertIn('inline', response['Content-Disposition'])
        self.assertIn(f'filename="Invoice_{invoice.id}.pdf"', response['Content-Disposition'])

    def test_invoice_pdf_bulk_view(self):
        from django.contrib.auth.models import User
        user = User.objects.create_user(username='admin', password='password')
        self.client.force_login(user)
        
        import datetime
        inv1 = Invoice.objects.create(
            bill_number="BILL/1",
            customer=self.customer,
            bill_date=datetime.date(2026, 6, 20),
            grand_total=100.00
        )
        inv2 = Invoice.objects.create(
            bill_number="BILL/2",
            customer=self.customer,
            bill_date=datetime.date(2026, 6, 20),
            grand_total=200.00
        )
        
        # Request bulk PDF endpoint
        response = self.client.get(f'/api/invoices/pdf/bulk/?ids={inv1.id},{inv2.id}')
        
        # Verify response code is 200
        self.assertEqual(response.status_code, 200)
        
        # Verify content type is application/pdf
        self.assertEqual(response['Content-Type'], 'application/pdf')
        
        # Verify content disposition is attachment
        self.assertIn('attachment', response['Content-Disposition'])
        self.assertIn('filename="Invoices_Bulk.pdf"', response['Content-Disposition'])

    def test_invoice_pdf_bulk_ordering(self):
        from django.contrib.auth.models import User
        from unittest.mock import patch
        
        user = User.objects.create_user(username='admin_ord', password='password')
        self.client.force_login(user)
        
        import datetime
        inv1 = Invoice.objects.create(
            bill_number="BILL/O1", customer=self.customer, bill_date=datetime.date(2026, 6, 20), grand_total=100.00
        )
        inv2 = Invoice.objects.create(
            bill_number="BILL/O2", customer=self.customer, bill_date=datetime.date(2026, 6, 20), grand_total=200.00
        )
        
        with patch('billing.views.generate_bulk_invoice_pdf') as mock_gen:
            mock_gen.return_value = b'PDF DATA'
            
            # Request in order [inv2, inv1]
            response = self.client.get(f'/api/invoices/pdf/bulk/?ids={inv2.id},{inv1.id}')
            self.assertEqual(response.status_code, 200)
            
            # Assert mock was called with list in order [inv2, inv1]
            called_args = mock_gen.call_args[0]
            passed_invoices = list(called_args[0])
            self.assertEqual(len(passed_invoices), 2)
            self.assertEqual(passed_invoices[0].id, inv2.id)
            self.assertEqual(passed_invoices[1].id, inv1.id)


