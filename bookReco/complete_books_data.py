"""
Complete the books_data.csv to reach 10,000 books
Reads existing CSV and adds more books if needed
"""
import requests
import csv
import time
from typing import List, Dict, Set

def load_existing_books(filename: str) -> Set[tuple]:
    """Load existing books to avoid duplicates"""
    existing = set()
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row["title"].lower().strip(), row["author"].lower().strip())
                existing.add(key)
        print(f"Loaded {len(existing)} existing books from {filename}")
    except FileNotFoundError:
        print(f"File {filename} not found, starting fresh")
    return existing

def fetch_books_by_search(query: str, limit: int = 200, existing: Set[tuple] = None) -> List[Dict]:
    """Fetch books using general search"""
    if existing is None:
        existing = set()
    
    url = f"https://openlibrary.org/search.json?q={query}&limit={limit}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        docs = data.get("docs", [])
        
        books = []
        for doc in docs:
            title = doc.get("title", "Unknown")
            author = ", ".join(doc.get("author_name", [])) or "Unknown Author"
            key = (title.lower().strip(), author.lower().strip())
            
            # Skip if already exists
            if key in existing:
                continue
                
            book_data = {
                "title": title,
                "author": author,
                "subject": ", ".join(doc.get("subject", [])[:3]) if doc.get("subject") else "General",
                "first_publish_year": doc.get("first_publish_year", ""),
                "cover_id": doc.get("cover_i", ""),
                "cover_url": f"https://covers.openlibrary.org/b/id/{doc.get('cover_i', '')}-L.jpg" if doc.get("cover_i") else "",
                "edition_count": doc.get("edition_count", 0),
                "ratings_average": "",
                "ratings_count": 0,
                "key": doc.get("key", ""),
                "additional_subjects": ", ".join(doc.get("subject", [])[:5]) if doc.get("subject") else "",
            }
            books.append(book_data)
            existing.add(key)  # Track new books
        
        return books, existing
    except Exception as e:
        print(f"  Error searching for {query}: {e}")
        return [], existing

def append_to_csv(filename: str, books: List[Dict]):
    """Append books to existing CSV"""
    fieldnames = ["title", "author", "subject", "additional_subjects", 
                  "first_publish_year", "cover_id", "cover_url", 
                  "edition_count", "ratings_average", "ratings_count", "key"]
    
    with open(filename, 'a', newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerows(books)

def complete_books_csv(target_count: int = 10000, filename: str = "books_data.csv"):
    """Complete the CSV to reach target count"""
    existing = load_existing_books(filename)
    current_count = len(existing)
    
    if current_count >= target_count:
        print(f"Already have {current_count} books, no need to fetch more!")
        return
    
    needed = target_count - current_count
    print(f"Need to fetch {needed} more books to reach {target_count}")
    print("=" * 50)
    
    # Diverse search queries
    search_queries = [
        "classic literature", "modern fiction", "bestseller", "award winning",
        "literary fiction", "contemporary", "historical", "biography",
        "memoir", "autobiography", "essays", "short stories", "poetry",
        "drama", "plays", "science", "philosophy", "religion", "self help",
        "business", "economics", "politics", "sociology", "psychology",
        "education", "travel", "cooking", "sports", "health", "fitness"
    ]
    
    all_new_books = []
    per_query = max(200, needed // len(search_queries) + 50)
    
    for i, query in enumerate(search_queries, 1):
        if len(all_new_books) >= needed:
            break
        
        print(f"[{i}/{len(search_queries)}] Searching: {query}...", end=" ", flush=True)
        books, existing = fetch_books_by_search(query, limit=per_query, existing=existing)
        all_new_books.extend(books)
        print(f"Got {len(books)} new books (Total new: {len(all_new_books)})")
        
        # Append in batches to avoid losing data
        if len(all_new_books) >= 500:
            append_to_csv(filename, all_new_books)
            print(f"  Saved {len(all_new_books)} books to CSV")
            all_new_books = []
        
        time.sleep(0.3)
    
    # Append remaining books
    if all_new_books:
        append_to_csv(filename, all_new_books)
        print(f"  Saved remaining {len(all_new_books)} books to CSV")
    
    # Final count
    final_count = len(load_existing_books(filename))
    print(f"\nCompleted! Total books in {filename}: {final_count}")

if __name__ == "__main__":
    print("Completing books_data.csv to 10,000 books")
    print("=" * 50)
    complete_books_csv(target_count=10000, filename="books_data.csv")

