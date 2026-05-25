import csv

with open('books_data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    
    recent = [r for r in rows if r.get('first_publish_year') and r['first_publish_year'].strip() and 2015 <= int(r['first_publish_year']) <= 2025]
    
    print(f'Total books: {len(rows)}')
    print(f'Books from 2015-2025: {len(recent)}')
    print(f'\nSample recent books:')
    for r in recent[:15]:
        print(f"  {r['title'][:60]} - {r['first_publish_year']} - {r['author'][:40]}")

