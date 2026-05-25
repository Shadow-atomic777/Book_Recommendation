import requests
import csv
import time
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed

# Popular subjects/genres to ensure diversity
SUBJECTS = [
    "fiction", "mystery", "romance", "science_fiction", "fantasy", 
    "horror", "thriller", "historical_fiction", "biography", 
    "philosophy", "poetry", "drama", "adventure", "young_adult",
    "children", "nonfiction", "history", "science", "art", "music"
]

def fetch_books_by_subject(subject: str, limit: int = 500) -> List[Dict]:
    """Fetch books from Open Library by subject"""
    url = f"https://openlibrary.org/subjects/{subject}.json?limit={limit}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
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
            }
            
            if "subject" in work:
                book_data["additional_subjects"] = ", ".join(work["subject"][:5])
            else:
                book_data["additional_subjects"] = ""
            
            books.append(book_data)
        
        return books
    except Exception as e:
        print(f"  Error fetching {subject}: {e}")
        return []

def fetch_books_by_search(query: str, limit: int = 100) -> List[Dict]:
    """Fetch books using general search"""
    url = f"https://openlibrary.org/search.json?q={query}&limit={limit}"
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        data = response.json()
        docs = data.get("docs", [])
        
        books = []
        for doc in docs:
            book_data = {
                "title": doc.get("title", "Unknown"),
                "author": ", ".join(doc.get("author_name", [])) or "Unknown Author",
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
        
        return books
    except Exception as e:
        print(f"  Error searching for {query}: {e}")
        return []

def remove_duplicates(books: List[Dict]) -> List[Dict]:
    """Remove duplicate books based on title and author"""
    seen = set()
    unique_books = []
    
    for book in books:
        key = (book["title"].lower().strip(), book["author"].lower().strip())
        if key not in seen:
            seen.add(key)
            unique_books.append(book)
    
    return unique_books

def generate_books_csv(target_count: int = 10000, output_file: str = "books_data.csv"):
    """Generate CSV file with books data"""
    all_books = []
    
    print(f"Starting to fetch {target_count} books...")
    print("=" * 50)
    
    # Fetch books by subjects (more structured data)
    books_per_subject = min(500, target_count // len(SUBJECTS))
    
    print(f"Fetching books from {len(SUBJECTS)} subjects...")
    for i, subject in enumerate(SUBJECTS, 1):
        print(f"[{i}/{len(SUBJECTS)}] Fetching: {subject}...", end=" ", flush=True)
        books = fetch_books_by_subject(subject, limit=books_per_subject)
        all_books.extend(books)
        print(f"Got {len(books)} books (Total: {len(all_books)})")
        time.sleep(0.3)  # Rate limiting
    
    # Fill remaining with general searches if needed
    if len(all_books) < target_count:
        print(f"\nFetching additional books to reach {target_count}...")
        search_queries = [
            "best books", "classic literature", "popular novels", 
            "award winning", "bestseller", "must read", "famous books",
            "top rated", "recommended", "literary fiction"
        ]
        
        remaining = target_count - len(all_books)
        per_query = min(200, remaining // len(search_queries) + 50)
        
        for i, query in enumerate(search_queries, 1):
            if len(all_books) >= target_count:
                break
            print(f"[{i}/{len(search_queries)}] Searching: {query}...", end=" ", flush=True)
            books = fetch_books_by_search(query, limit=per_query)
            all_books.extend(books)
            print(f"Got {len(books)} books (Total: {len(all_books)})")
            time.sleep(0.3)
    
    # Remove duplicates
    print(f"\nRemoving duplicates from {len(all_books)} books...")
    unique_books = remove_duplicates(all_books)
    print(f"After removing duplicates: {len(unique_books)} unique books")
    
    # Limit to target count
    if len(unique_books) > target_count:
        unique_books = unique_books[:target_count]
    
    # Write to CSV
    if unique_books:
        fieldnames = [
            "title", "author", "subject", "additional_subjects", 
            "first_publish_year", "cover_id", "cover_url", 
            "edition_count", "ratings_average", "ratings_count", "key"
        ]
        
        print(f"\nWriting {len(unique_books)} books to {output_file}...")
        with open(output_file, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(unique_books)
        
        print(f"\nSuccessfully created {output_file} with {len(unique_books)} books!")
        print(f"File saved at: {output_file}")
    else:
        print("No books to save!")

if __name__ == "__main__":
    print("Book Data Generator")
    print("=" * 50)
    generate_books_csv(target_count=10000, output_file="books_data.csv")
