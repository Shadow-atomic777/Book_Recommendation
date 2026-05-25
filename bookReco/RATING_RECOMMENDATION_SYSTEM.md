# Rating-Based Recommendation System

## Overview
A comprehensive rating-based recommendation system that uses the `books_data.csv` file to provide personalized book recommendations based on ratings, reviews, and popularity metrics.

## Features

### 1. **Multiple Recommendation Filters**
   - **Highest Rated**: Books sorted by average rating (highest first)
   - **Most Reviewed**: Books with the most number of reviews
   - **Most Popular**: Books ranked by a popularity score combining ratings, reviews, and edition count
   - **Recent High Rated**: Books published after 2000 with ratings ≥ 4.0

### 2. **Personalized Recommendations**
   - Hybrid approach combining:
     - High-rated books with good review counts
     - Recent high-rated books
     - Books with high edition counts (popularity indicator)
   - Automatically deduplicates and sorts by popularity score

### 3. **Similar Rated Books**
   - When searching for a book, shows similar books based on:
     - Rating similarity (within 0.5 points)
     - Subject/genre matching
     - Calculated similarity score

### 4. **Enhanced Search**
   - Searches local CSV data first (faster, includes ratings)
   - Falls back to Open Library API if not found locally
   - Shows ratings and review counts for all results

## Files Structure

### Core Files
- **`recommendationEngine.js`**: Main recommendation engine class
- **`script.js`**: Integration with UI and event handlers
- **`books_data.csv`**: Dataset with 8,000+ books

### HTML Integration
- Added PapaParse library for CSV parsing
- New sections in `main.html`:
  - Rating-based recommendations section with filter buttons
  - Personalized recommendations section

### CSS Styling
- Filter buttons with active/hover states
- Rating display styling
- Year display for books
- Section subtitle styling

## How It Works

### 1. Data Loading
```javascript
const engine = new RatingRecommendationEngine();
await engine.loadBooks(); // Loads CSV data using PapaParse
```

### 2. Popularity Score Calculation
The system uses a weighted formula:
```
Popularity Score = (Rating × (1 + log10(reviews + 1) × 0.5)) + (Edition Count / 100)
```

This ensures books with both high ratings AND many reviews rank higher.

### 3. Recommendation Algorithms

#### Highest Rated
- Filters books with ratings > 0
- Sorts by `ratings_average` descending

#### Most Reviewed
- Filters books with `ratings_count > 0`
- Sorts by `ratings_count` descending

#### Most Popular
- Calculates popularity score for each book
- Sorts by popularity score descending

#### Recent High Rated
- Filters: `year >= 2000` AND `rating >= 4.0`
- Sorts by rating first, then by year (newer first)

#### Similar Rated Books
- Finds books within ±0.5 rating points
- Adds bonus for same subject/genre
- Calculates similarity score and sorts

## Usage Examples

### Get Highest Rated Books
```javascript
const topRated = engine.getHighestRated(20);
```

### Get Most Popular Books
```javascript
const popular = engine.getMostPopular(20);
```

### Get Similar Books
```javascript
const similar = engine.getSimilarRatedBooks("Pride and Prejudice", 12);
```

### Get Personalized Recommendations
```javascript
const personalized = engine.getPersonalizedRecommendations(20);
```

## UI Components

### Filter Buttons
- Located above the rating recommendations carousel
- Click to switch between different recommendation types
- Active state shows current filter

### Book Cards
Each card displays:
- Book cover image
- Title
- Author
- Rating (if available)
- Review count (if available)
- Publication year (if available)

## Data Requirements

The CSV file should contain:
- `title`: Book title
- `author`: Author name(s)
- `subject`: Primary genre/subject
- `ratings_average`: Average rating (0-5 scale)
- `ratings_count`: Number of reviews
- `first_publish_year`: Publication year
- `cover_url`: Book cover image URL
- `edition_count`: Number of editions (popularity indicator)

## Performance

- CSV is loaded once on page load
- Recommendations are calculated in-memory (fast)
- No API calls needed for recommendations (uses local data)
- Falls back to Open Library API only for searches not in CSV

## Future Enhancements

Potential improvements:
1. User rating history for personalized recommendations
2. Collaborative filtering based on user preferences
3. Machine learning models for better predictions
4. Genre-specific recommendation pages
5. Rating trends over time
6. Book comparison features

## Notes

- Books without ratings are filtered out from rating-based recommendations
- The system gracefully handles missing data
- All recommendations are sorted and limited to prevent UI overload
- The popularity score formula can be adjusted based on requirements

