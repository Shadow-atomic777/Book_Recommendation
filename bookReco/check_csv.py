import csv

with open('books_data.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    print(f'Total books in CSV: {len(rows)}')
    if rows:
        print(f'\nFirst book:')
        print(f'  Title: {rows[0]["title"]}')
        print(f'  Author: {rows[0]["author"]}')
        print(f'  Subject: {rows[0]["subject"]}')
        print(f'\nLast book:')
        print(f'  Title: {rows[-1]["title"]}')
        print(f'  Author: {rows[-1]["author"]}')

