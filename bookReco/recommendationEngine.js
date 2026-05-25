// Rating-Based Recommendation Engine
class RatingRecommendationEngine {
  constructor() {
    this.books = [];
    this.loaded = false;
    this.descriptionCache = new Map(); // Cache for book descriptions
  }

  // Load books from CSV
  async loadBooks() {
    if (this.loaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      Papa.parse("books_data.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.books = results.data
            .map((book) => ({
              title: book.title || "Unknown",
              author: book.author || "Unknown Author",
              subject: book.subject || "General",
              additional_subjects: book.additional_subjects || "",
              first_publish_year: parseInt(book.first_publish_year) || null,
              cover_id: book.cover_id || "",
              cover_url: book.cover_url || "https://via.placeholder.com/150x220?text=No+Cover",
              edition_count: parseInt(book.edition_count) || 0,
              ratings_average: book.ratings_average ? parseFloat(book.ratings_average) : null,
              ratings_count: parseInt(book.ratings_count) || 0,
              key: book.key || "",
            }))
            .filter((book) => book.title !== "Unknown" && book.author !== "Unknown Author");

          this.loaded = true;
          console.log(`Loaded ${this.books.length} books for recommendations`);
          resolve();
        },
        error: (error) => {
          console.error("Error loading books:", error);
          reject(error);
        },
      });
    });
  }

  // Calculate popularity score 
  calculatePopularityScore(book) {
    const rating = book.ratings_average || 0;
    const reviewCount = book.ratings_count || 0;
    const editionCount = book.edition_count || 0;
    const year = book.first_publish_year || null;
    const currentYear = new Date().getFullYear();

    
    let recencyBoost = 0;
    if (year) {
      const age = Math.max(0, currentYear - year);
      recencyBoost = Math.max(0, 1 - age / 20); 
    }

    // Weighted formula: rating * log(reviews + 1) + edition_count/100
    // plus a modest recency boost to prefer newer titles when comparable
    const reviewWeight = Math.log10(reviewCount + 1) * 0.5;
    const ratingScore = rating * (1 + reviewWeight);
    const editionScore = editionCount / 100;
    const recencyScore = recencyBoost * 0.5; // cap recency influence

    return ratingScore + editionScore + recencyScore;
  }

  // New & Trending: recent (2015-2025) and high popularity
  getNewAndTrending(limit = 20, minYear = 2015, maxYear = 2025) {
    const currentYear = new Date().getFullYear();
    const effectiveMaxYear = Math.min(maxYear, currentYear);
    
    return this.books
      .filter(
        (book) => 
          book.first_publish_year && 
          book.first_publish_year >= minYear &&
          book.first_publish_year <= effectiveMaxYear
      )
      .map((book) => {
        const popularityScore = this.calculatePopularityScore(book);
        // Boost for very recent books (2020+)
        const recencyBoost = book.first_publish_year >= 2020 ? 0.3 : 0;
        return { ...book, popularityScore: popularityScore + recencyBoost };
      })
      .sort((a, b) => {
        // Sort by popularity, then by year (newer first)
        if (Math.abs(b.popularityScore - a.popularityScore) > 0.1) {
          return b.popularityScore - a.popularityScore;
        }
        return b.first_publish_year - a.first_publish_year;
      })
      .slice(0, limit);
  }

  // Get highest rated books (prioritizing 2015-2025)
  getHighestRated(limit = 20) {
    const currentYear = new Date().getFullYear();
    const minYear = 2015;
    const maxYear = Math.min(2025, currentYear);
    
    // First, try recent books (2015-2025) with ratings
    const recentRated = this.books
      .filter(
        (book) => 
          book.first_publish_year && 
          book.first_publish_year >= minYear &&
          book.first_publish_year <= maxYear &&
          book.ratings_average !== null && 
          book.ratings_average > 0
      )
      .sort((a, b) => b.ratings_average - a.ratings_average)
      .slice(0, limit);

    if (recentRated.length >= Math.min(10, limit)) {
      return recentRated;
    }

    // If not enough recent books, include older but still prioritize recent
    const allRated = this.books
      .filter((book) => book.ratings_average !== null && book.ratings_average > 0)
      .map((book) => {
        const rating = book.ratings_average;
        const year = book.first_publish_year || 0;
        // Boost for recent books (2015+)
        const recencyBoost = (year >= minYear && year <= maxYear) ? 0.5 : 0;
        return { ...book, score: rating + recencyBoost };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return allRated.length > 0 ? allRated : this.getNewAndTrending(limit);
  }

  // Get most reviewed books (prioritizing 2015-2025)
  getMostReviewed(limit = 20) {
    const currentYear = new Date().getFullYear();
    const minYear = 2015;
    const maxYear = Math.min(2025, currentYear);
    
    // Ensure ratings_count is a number
    const booksWithReviews = this.books
      .map((book) => ({
        ...book,
        ratings_count: parseInt(book.ratings_count) || 0,
        first_publish_year: parseInt(book.first_publish_year) || null,
      }))
      .filter((book) => book.ratings_count > 0);

    if (booksWithReviews.length === 0) {
      // Fallback: use edition_count as proxy for popularity if no reviews
      return this.books
        .filter((book) => (book.edition_count || 0) > 0)
        .sort((a, b) => (b.edition_count || 0) - (a.edition_count || 0))
        .slice(0, limit);
    }

    // First try recent books (2015-2025) with reviews
    const recentReviewed = booksWithReviews
      .filter(
        (book) => 
          book.first_publish_year &&
          book.first_publish_year >= minYear &&
          book.first_publish_year <= maxYear
      )
      .sort((a, b) => b.ratings_count - a.ratings_count)
      .slice(0, limit);

    // If we have enough recent books, return them
    if (recentReviewed.length >= Math.min(5, limit)) {
      return recentReviewed;
    }

    // Otherwise, include all books but boost recent ones
    return booksWithReviews
      .map((book) => {
        const year = book.first_publish_year || 0;
        const recencyBoost = (year >= minYear && year <= maxYear) ? 10000 : 0;
        return { ...book, score: book.ratings_count + recencyBoost };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Get most popular books (prioritizing 2015-2025)
  getMostPopular(limit = 20) {
    const currentYear = new Date().getFullYear();
    const minYear = 2015;
    const maxYear = Math.min(2025, currentYear);
    
    return this.books
      .map((book) => {
        const popularityScore = this.calculatePopularityScore(book);
        const year = book.first_publish_year || 0;
        // Strong boost for recent books (2015-2025)
        const recencyBoost = (year >= minYear && year <= maxYear) ? 1.0 : 0;
        return {
          ...book,
          popularityScore: popularityScore + recencyBoost,
        };
      })
      .filter((book) => book.popularityScore > 0)
      .sort((a, b) => {
        // Sort by popularity, but prioritize recent books
        if (Math.abs(b.popularityScore - a.popularityScore) > 0.2) {
          return b.popularityScore - a.popularityScore;
        }
        // If similar popularity, prefer newer books
        const aYear = a.first_publish_year || 0;
        const bYear = b.first_publish_year || 0;
        return bYear - aYear;
      })
      .slice(0, limit);
  }

  // Get recent high-rated books (2015-2025)
  getRecentHighRated(limit = 20, minYear = 2015, maxYear = 2025) {
    const currentYear = new Date().getFullYear();
    const effectiveMaxYear = Math.min(maxYear, currentYear);
    
    return this.books
      .filter(
        (book) =>
          book.first_publish_year &&
          book.first_publish_year >= minYear &&
          book.first_publish_year <= effectiveMaxYear
      )
      .map((book) => ({
        ...book,
        // Calculate score: rating (if exists) + recency bonus + popularity
        score: (book.ratings_average || 3.5) + 
               ((book.first_publish_year - minYear) / (effectiveMaxYear - minYear + 1)) * 0.5 +
               Math.log10((book.ratings_count || 0) + 1) * 0.3
      }))
      .sort((a, b) => {
        // Sort by score first, then by year (newer first)
        if (Math.abs(b.score - a.score) > 0.1) {
          return b.score - a.score;
        }
        return b.first_publish_year - a.first_publish_year;
      })
      .slice(0, limit);
  }

  // Get recommendations based on a specific book (rating similarity)
  getSimilarRatedBooks(bookTitle, limit = 12) {
    const targetBook = this.books.find(
      (b) => b.title.toLowerCase() === bookTitle.toLowerCase()
    );

    if (!targetBook || !targetBook.ratings_average) {
      return this.getMostPopular(limit);
    }

    const targetRating = targetBook.ratings_average;
    const targetSubject = targetBook.subject;

    return this.books
      .filter(
        (book) =>
          book.title.toLowerCase() !== bookTitle.toLowerCase() &&
          book.ratings_average !== null &&
          Math.abs(book.ratings_average - targetRating) <= 0.5 // Within 0.5 rating points
      )
      .map((book) => {
        // Calculate similarity score
        const ratingDiff = Math.abs(book.ratings_average - targetRating);
        const subjectMatch = book.subject === targetSubject ? 1 : 0;
        const similarityScore = 1 - ratingDiff / 5 + subjectMatch * 0.3;

        return {
          ...book,
          similarityScore,
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // Get personalized recommendations (hybrid approach, prioritizing 2015-2025)
  getPersonalizedRecommendations(limit = 20) {
    // Focus on recent books (2015-2025) with multiple strategies:
    // 1. Recent high-rated books
    // 2. New & trending books
    // 3. Recent popular books

    const recentHigh = this.getRecentHighRated(Math.ceil(limit * 0.4));
    const newTrending = this.getNewAndTrending(Math.ceil(limit * 0.4));
    const recentPopular = this.getMostPopular(Math.ceil(limit * 0.4));

    // Combine and deduplicate
    const combined = [...recentHigh, ...newTrending, ...recentPopular];
    const seen = new Set();
    const unique = [];

    for (const book of combined) {
      const key = `${book.title}|${book.author}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(book);
      }
    }

    // Sort by popularity score, prioritizing recent
    return unique
      .map((book) => {
        const popularityScore = this.calculatePopularityScore(book);
        const year = book.first_publish_year || 0;
        const recencyBoost = (year >= 2015 && year <= 2025) ? 0.5 : 0;
        return {
          ...book,
          popularityScore: popularityScore + recencyBoost,
        };
      })
      .sort((a, b) => {
        if (Math.abs(b.popularityScore - a.popularityScore) > 0.1) {
          return b.popularityScore - a.popularityScore;
        }
        return (b.first_publish_year || 0) - (a.first_publish_year || 0);
      })
      .slice(0, limit);
  }

  // Get recommendations by rating range
  getBooksByRatingRange(minRating, maxRating, limit = 20) {
    return this.books
      .filter(
        (book) =>
          book.ratings_average !== null &&
          book.ratings_average >= minRating &&
          book.ratings_average <= maxRating
      )
      .sort((a, b) => b.ratings_count - a.ratings_count) // Sort by review count
      .slice(0, limit);
  }

  // Format rating for display
  formatRating(rating) {
    if (!rating || rating === 0) return "No rating";
    return `${rating.toFixed(1)} ⭐`;
  }

  // Render book card HTML
  renderBookCard(book) {
    const rating = book.ratings_average
      ? this.formatRating(book.ratings_average)
      : "No rating";
    const reviewCount = book.ratings_count > 0 ? `(${book.ratings_count} reviews)` : "";
    // Store book data as JSON in data attribute for click handler
    const bookData = JSON.stringify({
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      ratings_average: book.ratings_average,
      ratings_count: book.ratings_count,
      first_publish_year: book.first_publish_year,
      subject: book.subject,
      additional_subjects: book.additional_subjects,
      key: book.key,
      edition_count: book.edition_count
    }).replace(/"/g, '&quot;');

    return `
      <div class="book-card" data-book='${bookData}' onclick="showBookDetails(this)">
        <img src="${book.cover_url}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/150x220?text=No+Cover'">
        <div class="book-card-info">
          <h3>${book.title}</h3>
          <p>${book.author}</p>
          ${book.ratings_average ? `<p class="rating">${rating} ${reviewCount}</p>` : ""}
          ${book.first_publish_year ? `<p class="year">${book.first_publish_year}</p>` : ""}
        </div>
      </div>
    `;
  }

  // Calculate text similarity between two strings (word overlap)
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    // Normalize and tokenize
    const normalize = (str) => str.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2); // Filter out very short words
    
    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));
    
    if (words1.size === 0 || words2.size === 0) return 0;
    
    // Calculate Jaccard similarity (intersection over union)
    let intersection = 0;
    for (const word of words1) {
      if (words2.has(word)) intersection++;
    }
    
    const union = new Set([...words1, ...words2]);
    return intersection / union.size;
  }

  // Enhanced author matching with fuzzy logic
  calculateAuthorSimilarity(author1, author2) {
    if (!author1 || !author2) return 0;
    
    const a1 = author1.toLowerCase().trim();
    const a2 = author2.toLowerCase().trim();
    
    // Exact match
    if (a1 === a2) return 1.0;
    
    // Check if one contains the other (partial match)
    if (a1.includes(a2) || a2.includes(a1)) return 0.8;
    
    // Split by common separators and check for name matches
    const names1 = a1.split(/[,&]/).map(n => n.trim());
    const names2 = a2.split(/[,&]/).map(n => n.trim());
    
    // Check if any name from author1 appears in author2
    let maxMatch = 0;
    for (const name1 of names1) {
      for (const name2 of names2) {
        if (name1 === name2) {
          maxMatch = Math.max(maxMatch, 1.0);
        } else if (name1.includes(name2) || name2.includes(name1)) {
          maxMatch = Math.max(maxMatch, 0.6);
        } else {
          // Check for word overlap in names
          const words1 = name1.split(/\s+/);
          const words2 = name2.split(/\s+/);
          const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
          if (commonWords.length > 0) {
            maxMatch = Math.max(maxMatch, 0.4);
          }
        }
      }
    }
    
    return maxMatch;
  }

  // Fetch book description (with caching)
  async fetchBookDescription(book) {
    const cacheKey = book.key || `${book.title}|${book.author}`;
    
    if (this.descriptionCache.has(cacheKey)) {
      return this.descriptionCache.get(cacheKey);
    }
    
    let description = '';
    
    try {
      // Try to fetch from Open Library using the key
      if (book.key) {
        const workKey = book.key.replace('/works/', '');
        const url = `https://openlibrary.org/works/${workKey}.json`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.description) {
          if (typeof data.description === 'string') {
            description = data.description;
          } else if (data.description.value) {
            description = data.description.value;
          }
        }
      }
      
      // If no description found, try searching by title
      if (!description) {
        const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&limit=1`;
        const response = await fetch(searchUrl);
        const data = await response.json();
        
        if (data.docs && data.docs.length > 0 && data.docs[0].first_sentence) {
          const sentences = Array.isArray(data.docs[0].first_sentence) 
            ? data.docs[0].first_sentence 
            : [data.docs[0].first_sentence];
          description = sentences.join(' ');
        }
      }
      
      // Clean up description
      if (description) {
        description = description.replace(/<[^>]*>/g, '').trim();
      }
    } catch (error) {
      console.error('Error fetching description:', error);
    }
    
    // Cache the result (even if empty)
    this.descriptionCache.set(cacheKey, description);
    return description;
  }

  // Enhanced hybrid similarity using subjects, author, description, rating, and popularity
  async getSimilarHybrid(seedBook, limit = 12) {
    if (!seedBook) return [];

    const seedTitle = (seedBook.title || '').toLowerCase();
    const seedAuthor = (seedBook.author || '').toLowerCase();
    const seedSubjects = new Set(
      (seedBook.additional_subjects || seedBook.subjects || seedBook.subject || '')
        .toString()
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );
    const seedRating = seedBook.ratings_average || null;
    const minYear = 2015;

    // Fetch seed book description
    const seedDescription = await this.fetchBookDescription(seedBook);
    const seedDescriptionText = seedDescription || '';

    // First pass: Calculate initial scores without descriptions (faster)
    const initialScores = this.books
      .filter(b => (b.title || '').toLowerCase() !== seedTitle)
      .map(b => {
        // Subject overlap
        const bSubjects = new Set(
          (b.additional_subjects || b.subject || '')
            .toString()
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
        );
        let subjectOverlap = 0;
        if (seedSubjects.size && bSubjects.size) {
          let intersection = 0;
          for (const s of seedSubjects) {
            if (bSubjects.has(s)) intersection++;
          }
          subjectOverlap = intersection / Math.max(1, seedSubjects.size);
        }
        const subjectScore = subjectOverlap * 1.5;

        // Author similarity
        const authorSimilarity = this.calculateAuthorSimilarity(seedAuthor, b.author || '');
        const authorScore = authorSimilarity * 2.0;

        // Rating proximity
        const ratingDiff = seedRating && b.ratings_average 
          ? Math.abs(seedRating - b.ratings_average) 
          : 0.5;
        const ratingScore = (1 - Math.min(ratingDiff / 2, 1)) * 0.5;

        // Popularity
        const popularity = this.calculatePopularityScore(b);
        const popularityScore = Math.min(popularity / 10, 1) * 0.3;

        // Recency
        const recentBoost = b.first_publish_year && b.first_publish_year >= minYear ? 0.2 : 0;

        // Title similarity
        const titleSimilarity = this.calculateTextSimilarity(seedTitle, (b.title || '').toLowerCase());
        const titleScore = titleSimilarity * 0.3;

        // Initial score without description
        const initialScore = subjectScore + authorScore + ratingScore + 
                            popularityScore + recentBoost + titleScore;

        return { ...b, initialScore, similarityScore: initialScore };
      })
      .sort((a, b) => b.initialScore - a.initialScore);

    // Second pass: Fetch descriptions only for top candidates (limit * 2 for better results)
    const topCandidates = initialScores.slice(0, Math.min(limit * 3, 50));
    
    const booksWithScores = await Promise.all(
      topCandidates.map(async (b) => {
        // Add description similarity for top candidates
        let descriptionScore = 0;
        if (seedDescriptionText) {
          const bDescription = await this.fetchBookDescription(b);
          if (bDescription) {
            descriptionScore = this.calculateTextSimilarity(seedDescriptionText, bDescription) * 1.8;
          }
        }
        
        // Final score with description
        const finalScore = b.initialScore + descriptionScore;
        return { ...b, similarityScore: finalScore };
      })
    );

    // Sort by final similarity score and return top results
    return booksWithScores
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }

  // Synchronous version for when descriptions aren't needed immediately
  getSimilarHybridSync(seedBook, limit = 12) {
    if (!seedBook) return [];

    const seedTitle = (seedBook.title || '').toLowerCase();
    const seedAuthor = (seedBook.author || '').toLowerCase();
    const seedSubjects = new Set(
      (seedBook.additional_subjects || seedBook.subjects || seedBook.subject || '')
        .toString()
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean)
    );
    const seedRating = seedBook.ratings_average || null;
    const minYear = 2015;

    return this.books
      .filter(b => (b.title || '').toLowerCase() !== seedTitle)
      .map(b => {
        // Enhanced author matching
        const authorSimilarity = this.calculateAuthorSimilarity(seedAuthor, b.author || '');
        const authorScore = authorSimilarity * 2.0;

        // Subject overlap
        const bSubjects = new Set(
          (b.additional_subjects || b.subject || '')
            .toString()
            .split(',')
            .map(s => s.trim().toLowerCase())
            .filter(Boolean)
        );
        let subjectOverlap = 0;
        if (seedSubjects.size && bSubjects.size) {
          let intersection = 0;
          for (const s of seedSubjects) if (bSubjects.has(s)) intersection++;
          subjectOverlap = intersection / Math.max(1, seedSubjects.size);
        }
        const subjectScore = subjectOverlap * 1.5;

        // Rating proximity
        const ratingDiff = seedRating && b.ratings_average 
          ? Math.abs(seedRating - b.ratings_average) 
          : 0.5;
        const ratingScore = (1 - Math.min(ratingDiff / 2, 1)) * 0.5;

        // Popularity
        const popularity = this.calculatePopularityScore(b);
        const popularityScore = Math.min(popularity / 10, 1) * 0.3;

        // Recency
        const recentBoost = b.first_publish_year && b.first_publish_year >= minYear ? 0.2 : 0;

        // Title similarity
        const titleSimilarity = this.calculateTextSimilarity(seedTitle, (b.title || '').toLowerCase());
        const titleScore = titleSimilarity * 0.3;

        // Description similarity (use cached if available)
        let descriptionScore = 0;
        const cacheKey = b.key || `${b.title}|${b.author}`;
        if (this.descriptionCache.has(cacheKey)) {
          const seedDesc = this.descriptionCache.get(seedBook.key || `${seedBook.title}|${seedBook.author}`) || '';
          const bDesc = this.descriptionCache.get(cacheKey) || '';
          if (seedDesc && bDesc) {
            descriptionScore = this.calculateTextSimilarity(seedDesc, bDesc) * 1.8;
          }
        }

        const totalScore = subjectScore + authorScore + descriptionScore + 
                          ratingScore + popularityScore + recentBoost + titleScore;

        return { ...b, similarityScore: totalScore };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
  }
}

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = RatingRecommendationEngine;
}

