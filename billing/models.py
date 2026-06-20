from django.db import models

class Company(models.Model):
    company_name = models.CharField(max_length=150)
    address = models.TextField()
    phone = models.CharField(max_length=50)
    gst_number = models.CharField(max_length=15)
    state_code = models.CharField(max_length=10, default="24-GJ")
    pan_number = models.CharField(max_length=10)
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=30)
    ifsc_code = models.CharField(max_length=20)
    terms_conditions = models.TextField(
        default="1) Goods Once Sold will not be taken back.\n"
                "2) Goods are delivered at owner's risk and insurance option.\n"
                "3) Please Check The RF Within 5 Days Otherwise We Are Not Responsible.\n"
                "4) Interest will be charged @ 24% p.a.\n"
                "5) Subject to SURAT Jurisdiction."
    )

    class Meta:
        verbose_name_plural = "Company Settings"

    def __str__(self):
        return self.company_name


class Customer(models.Model):
    name = models.CharField(max_length=150)
    address = models.TextField()
    gst_number = models.CharField(max_length=15, blank=True, default="")

    def __str__(self):
        return self.name


class Invoice(models.Model):
    bill_number = models.CharField(max_length=50, unique=True, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    customer_name = models.CharField(max_length=150, blank=True, default="")
    customer_address = models.TextField(blank=True, default="")
    customer_gst_number = models.CharField(max_length=15, blank=True, default="")
    challan_no = models.CharField(max_length=100, blank=True, null=True)
    broker = models.CharField(max_length=100, blank=True, null=True)
    hsn_code = models.CharField(max_length=50, blank=True, null=True)
    bill_date = models.DateField()
    
    gross_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    blouse_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    sgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=2.50)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    cgst_percent = models.DecimalField(max_digits=5, decimal_places=2, default=2.50)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    round_off = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount_in_words = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def display_customer_name(self):
        return self.customer_name or (self.customer.name if self.customer else "")

    @property
    def display_customer_address(self):
        return self.customer_address or (self.customer.address if self.customer else "")

    @property
    def display_customer_gst_number(self):
        return self.customer_gst_number or (self.customer.gst_number if self.customer else "")

    def __str__(self):
        return f"Invoice {self.bill_number} - {self.display_customer_name}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    p_ch_no = models.CharField(max_length=50, blank=True, null=True)
    lot_no = models.CharField(max_length=50, blank=True, null=True)
    design = models.CharField(max_length=100, blank=True, null=True)
    meter = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    t_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    p_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    s_qty = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    qty = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    rate = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"Item in {self.invoice.bill_number} - Design {self.design}"
