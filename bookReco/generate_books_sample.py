"""
Quick sample generator - creates 1000 books for testing
Run this first to test, then use generate_books_data.py for full 10k
"""
import requests
import csv
import time

SUBJECTS = ["fiction", "mystery", "romance", "science_fiction", "fantasy", "horror", "thriller"]

def fetch_books_by_subject(subject: str, limit: int = 150) -> list:
    url = f"https://openlibrary.org/subjects/{subject}.json?limit={limit}"
    try:
        response = requests.get(url, timeout=15)
        data = response.json()
        works = data.get("works", [])
        
        books = []
        for work in works:
            book_data = {
                "title": work.get("title", "Unknown"),
                "author": ", ".join([a.get("name", "") for a in work.get("authors", [])]) or "Unknown Author",
                "subject": subject.replace("_", " ").title(),
                "first_publish_year": work.get("first_publish_year", ""),
                "cover_id": work.get("cover_id", ""),
                "cover_url": f"https://covers.openlibrary.org/b/id/{work.get('cover_id', '')}-L.jpg" if work.get("cover_id") else "",
                "edition_count": work.get("edition_count", 0),
                "ratings_average": round(work.get("ratings_average", 0), 2) if work.get("ratings_average") else "",
                "ratings_count": work.get("ratings_count", 0),
                "key": work.get("key", ""),
                "additional_subjects": ", ".join(work["subject"][:5]) if work.get("subject") else "",
            }
            books.append(book_data)
        return books
    except Exception as e:
        print(f"  Error: {e}")
        return []

all_books = []
print("Generating sample of 1000 books...")
for i, subject in enumerate(SUBJECTS, 1):
    print(f"[{i}/{len(SUBJECTS)}] {subject}...", end=" ", flush=True)
    books = fetch_books_by_subject(subject, 150)
    all_books.extend(books)
    print(f"Got {len(books)} (Total: {len(all_books)})")
    time.sleep(0.2)

# Remove duplicates
seen = set()
unique = []
for b in all_books:
    key = (b["title"].lower(), b["author"].lower())
    if key not in seen:
        seen.add(key)
        unique.append(b)

unique = unique[:1000]

fieldnames = ["title", "author", "subject", "additional_subjects", "first_publish_year", 
              "cover_id", "cover_url", "edition_count", "ratings_average", "ratings_count", "key"]

with open("books_data_sample.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(unique)

print(f"\nCreated books_data_sample.csv with {len(unique)} books!")

