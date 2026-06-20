import os
import django
import sys

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bill_system.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.core.management import call_command
from billing.models import Company

def initialize():
    print("Step 1: Running Database Migrations...")
    call_command('makemigrations', 'billing')
    call_command('migrate')
    
    User = get_user_model()
    username = 'admin'
    password = 'admin123'
    email = 'admin@example.com'
    
    print("\nStep 2: Setting up Superuser Account...")
    if not User.objects.filter(username=username).exists():
        User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Superuser account created successfully!")
        print(f"Username: {username}")
        print(f"Password: {password}")
    else:
        print("Superuser account already exists.")
        
    print("\nStep 3: Initializing Default Company Settings...")
    if not Company.objects.exists():
        Company.objects.create(
            company_name="Aastha Creation",
            address="204, Second Floor, Plot 10, GIDC Katargam, Surat",
            phone="+91 98765 43210",
            gst_number="24AAAAA0000A1Z5",
            state_code="24-GJ",
            pan_number="ABCDE1234F",
            bank_name="State Bank of India",
            account_number="300123456789",
            ifsc_code="SBIN0001234",
            terms_conditions=(
                "1) Goods Once Sold will not be taken back.\n"
                "2) Goods are delivered at owner's risk and insurance option.\n"
                "3) Please Check The RF Within 5 Days Otherwise We Are Not Responsible.\n"
                "4) Interest will be charged @ 24% p.a.\n"
                "5) Subject to SURAT Jurisdiction."
            )
        )
        print("Sample company profile 'Aastha Creation' created successfully!")
    else:
        print("Company settings already exist.")

    print("\nInitialization Complete. You can run the server using: python manage.py runserver")

if __name__ == '__main__':
    initialize()
