# Books Data CSV - Documentation

## Overview
The `books_data.csv` file contains book information fetched from Open Library API, designed for building a recommendation system.

## Current Status
- **Target**: 10,000 books
- **Current**: ~8,000+ books (growing)
- **Format**: CSV with UTF-8 encoding

## CSV Structure

The CSV contains the following columns:

| Column | Description | Example |
|--------|-------------|---------|
| `title` | Book title | "Pride and Prejudice" |
| `author` | Author name(s) | "Jane Austen" |
| `subject` | Primary subject/genre | "Fiction" |
| `additional_subjects` | Comma-separated list of related subjects | "Fiction, Romance, Historical" |
| `first_publish_year` | Year first published | 1813 |
| `cover_id` | Open Library cover ID | 14348537 |
| `cover_url` | Direct URL to book cover image | "https://covers.openlibrary.org/b/id/14348537-L.jpg" |
| `edition_count` | Number of editions | 4036 |
| `ratings_average` | Average rating (if available) | 4.5 |
| `ratings_count` | Number of ratings | 1200 |
| `key` | Open Library work key | "/works/OL66554W" |

## Files Created

1. **`books_data.csv`** - Main data file (target: 10,000 books)
2. **`generate_books_data.py`** - Script to generate full dataset from scratch
3. **`complete_books_data.py`** - Script to add more books to existing CSV
4. **`generate_books_sample.py`** - Quick sample generator (1,000 books for testing)
5. **`check_csv.py`** - Utility to check CSV contents

## Usage in Recommendation System

### For Content-Based Filtering:
- Use `subject` and `additional_subjects` for genre-based recommendations
- Use `author` for author-based recommendations
- Use `first_publish_year` for time-based filtering

### For Collaborative Filtering:
- Use `ratings_average` and `ratings_count` for popularity-based recommendations
- Use `edition_count` as a proxy for popularity

### For Hybrid Recommendations:
- Combine subject similarity + author similarity + ratings
- Use `cover_url` for displaying book covers in UI

## Next Steps

1. **Load CSV in JavaScript**: Use a CSV parser or convert to JSON
2. **Build Recommendation Algorithm**: 
   - Content-based: Match by subjects/authors
   - Collaborative: Use ratings data
   - Hybrid: Combine both approaches
3. **Integrate with Frontend**: Update `script.js` to use CSV data instead of API calls

## Example: Loading CSV in JavaScript

```javascript
// Using PapaParse library (add to HTML: <script src="https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js"></script>)
Papa.parse("books_data.csv", {
    download: true,
    header: true,
    complete: function(results) {
        const books = results.data;
        console.log(`Loaded ${books.length} books`);
        // Use books array for recommendations
    }
});
```

## Notes

- The CSV is being populated in the background
- Check progress with: `python check_csv.py`
- If interrupted, run `python complete_books_data.py` to continue
- All scripts include rate limiting to respect Open Library API

