import os
import time
import random
import uuid
from typing import List, Dict, Any
import json
import csv

# You might need to install these: pip install faker
try:
    from faker import Faker
except ImportError:
    print("Please install faker: pip install faker")
    exit(1)

fake = Faker('pt_BR')  # Portuguese (Brazil) locale

class InvoiceSeeder:
    def __init__(self, output_dir: str = "output_data"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)

    def generate_invoice_data(self) -> Dict[str, Any]:
        """Generates a single dummy invoice JSON object."""
        items_count = random.randint(1, 20)
        items = []
        total_amount = 0.0
        
        for _ in range(items_count):
            qty = random.randint(1, 100)
            unit_price = round(random.uniform(10.0, 5000.0), 2)
            amount = round(qty * unit_price, 2)
            total_amount += amount
            
            items.append({
                "description": fake.sentence(nb_words=5),
                "ncm": f"{random.randint(1000, 9999)}.{random.randint(10, 99)}.{random.randint(10, 99)}",
                "quantity": qty,
                "unit_price": unit_price,
                "total_price": amount,
                "currency": random.choice(["USD", "EUR", "BRL"]),
                "origin_country": fake.country_code()
            })

        return {
            "id": str(uuid.uuid4()),
            "invoice_number": fake.bothify(text='INV-####-????'),
            "date": fake.date_this_year().isoformat(),
            "supplier": {
                "name": fake.company(),
                "address": fake.address(),
                "tax_id": fake.cnpj()
            },
            "importer": {
                "name": "My Brazilian Company Ltda",
                "address": "Av. Paulista, 1000, SP",
                "tax_id": "12.345.678/0001-90"
            },
            "items": items,
            "total_value": round(total_amount, 2),
            "created_at": time.time()
        }

    def run_benchmark(self, count: int):
        """Generates 'count' invoices and calculates size metrics."""
        print(f"--- Generating {count} Invoices ---")
        start_time = time.time()
        
        total_json_size = 0
        csv_filename = os.path.join(self.output_dir, f"invoices_{count}.csv")
        json_filename = os.path.join(self.output_dir, f"invoices_{count}.json")
        
        # We will simulate CSV export size and JSON storage size
        data_list = []
        
        for _ in range(count):
            invoice = self.generate_invoice_data()
            data_list.append(invoice)
            
            # Simple size estimation of the JSON payload
            json_str = json.dumps(invoice)
            total_json_size += len(json_str.encode('utf-8'))

        duration = time.time() - start_time
        avg_size = total_json_size / count
        
        print(f"Completed in {duration:.2f} seconds.")
        print(f"Total RAW JSON Data Size: {total_json_size / 1024 / 1024:.2f} MB")
        print(f"Average Invoice Size: {avg_size / 1024:.2f} KB")
        print(f"Estimated Storage for 100,000 Invoices: {(avg_size * 100000) / 1024 / 1024 / 1024:.2f} GB (Raw JSON)")
        
        # Postgres Overhead multiplier (indexes + toast + page headers)
        db_overhead = 1.5 
        print(f"Estimated Postgres Disk Usage (with {db_overhead}x overhead): {(avg_size * 100000 * db_overhead) / 1024 / 1024 / 1024:.2f} GB / 100k Invoices")

if __name__ == "__main__":
    seeder = InvoiceSeeder()
    # Run the user-requested load
    seeder.run_benchmark(146000) 
