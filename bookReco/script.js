const wrapper = document.querySelector('.wrapper');
const loginBtn = document.querySelector('#loginBtn');
const closeBtn = document.querySelector('.icon-close');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const popupContainer = document.querySelector('.popup-container');

loginBtn.addEventListener('click', ()=> wrapper.classList.add('active-popup') );
closeBtn.addEventListener('click', ()=> {
    wrapper.classList.remove('active-popup');
    popupContainer.classList.remove('show-register');
});

// Flip to Register
registerLink.addEventListener('click', (e)=>{
    e.preventDefault();
    popupContainer.classList.add('show-register');
});

// Flip back to Login
loginLink.addEventListener('click', (e)=>{
    e.preventDefault();
    popupContainer.classList.remove('show-register');
});

// Click outside to close
wrapper.addEventListener('click', (e)=>{
    if(e.target === wrapper) {
        wrapper.classList.remove('active-popup');
        popupContainer.classList.remove('show-register');
    }
});

// quote section

const quotes = [
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs",
    image: "https://www.shutterstock.com/image-photo/steve-jobs-260nw-2624075169.jpg",
    bg: "https://images.unsplash.com/photo-1503264116251-35a269479413?auto=format&fit=crop&w=1350&q=80"
  },
  {
    text: "I knew that if I failed I wouldn’t regret that, but I knew the one thing I might regret is not trying..",
    author: "Jeff Bezos, Amazon founder and CEO",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRRi72G5o2sRpz0f2S-qJnJ0RM7wyqH4Km5YA&s",
    bg: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1350&q=80"
  },
  {
    text: "You don’t need to have a 100-person company to develop that idea.",
    author: "Larry Page, Google co-founder",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTR6XRc73RHS49eOsNrs_-A6GEnaQPGhPN_cA&s",
    bg: "https://images.unsplash.com/photo-1488229297570-58520851e868?auto=format&fit=crop&w=1350&q=80"
  },
  {
    text: "Diligence is the mother of good luck.",
    author: "Benjamin Franklin",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDwAzKpVuXMuZiaP0HJ8aY2a0HJGgWla30IQ&s",
    bg: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1350&q=80"
  }
];

let index = 0;
const quoteBox = document.getElementById("quote-box");
const quoteText = document.getElementById("quote");
const authorName = document.getElementById("author-name");
const authorImg = document.getElementById("author-img");
const quoteSection = document.querySelector(".quote-section");

function changeQuote() {
  index = (index + 1) % quotes.length;
  const quote = quotes[index];

  // Trigger fade out
  quoteBox.classList.remove("fade");
  void quoteBox.offsetWidth;

  // Update quote, author, image, background
  quoteText.textContent = `"${quote.text}"`;
  authorName.textContent = `— ${quote.author}`;
  authorImg.src = quote.image;
  quoteSection.style.backgroundImage = `url('${quote.bg}')`;

  // Trigger fade in
  quoteBox.classList.add("fade");
}

// Initialize first quote
authorImg.src = quotes[0].image;
quoteSection.style.backgroundImage = `url('${quotes[0].bg}')`;

setInterval(changeQuote, 7000);

//feedback btn
const feedbackBtn = document.querySelector('.feedback-btn');
const feedbackPopup = document.querySelector('.feedback-popup');
const closeFeedback = document.querySelector('.close-feedback');

feedbackBtn.addEventListener('click', () => {
  feedbackPopup.classList.add('active');
});

closeFeedback.addEventListener('click', () => {
  feedbackPopup.classList.remove('active');
});

// Close popup if click outside

const searchForm = document.getElementById("searchForm") || document.querySelector(".search-box");
const queryInput = document.getElementById("query");
const resultsContainer = document.getElementById("results");
const relatedContainer = document.getElementById("relatedBooks");
const relatedHeading = document.getElementById("relatedHeading");

searchForm.addEventListener("submit", async function(e) {
  e.preventDefault();
  const query = queryInput.value.trim();

  if (!query) {
    resultsContainer.innerHTML = "<p>Please type a book name.</p>";
    relatedContainer.innerHTML = "";
    relatedHeading.style.display = "none";
    return;
  }

  // Loading state
  resultsContainer.innerHTML = "<p>Loading results...</p>";
  relatedContainer.innerHTML = "";
  relatedHeading.style.display = "none";

  try {
    // Try to find in local books data first (with ratings)
    const engine = new RatingRecommendationEngine();
    await engine.loadBooks();

    const localMatches = engine.books.filter(
      (book) =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.author.toLowerCase().includes(query.toLowerCase())
    );

    if (localMatches.length > 0) {
      // Display local matches with ratings
      displayBooksWithRatings(localMatches.slice(0, 20), resultsContainer, engine);

      // Show similar rated books
      if (localMatches[0]) {
        // Enhanced hybrid similarity (subjects + author + description + rating + popularity)
        relatedHeading.style.display = "block";
        relatedHeading.textContent = `Similar to "${query}"`;
        relatedContainer.innerHTML = "<p>Finding similar books...</p>";
        
        // Use async version for better accuracy with descriptions
        const similar = await engine.getSimilarHybrid(localMatches[0], 12);
        if (similar.length > 0) {
          displayBooksWithRatings(similar, relatedContainer, engine);
        } else {
          // Fallback to subject-based if no similar ratings
          const primary = localMatches[0];
          if (primary.subject) {
            const subjectMatches = engine.books
              .filter(
                (b) =>
                  b.subject === primary.subject &&
                  b.title !== primary.title
              )
              .slice(0, 12);
            if (subjectMatches.length > 0) {
              relatedHeading.style.display = "block";
              relatedHeading.textContent = `Similar to "${query}"`;
              displayBooksWithRatings(subjectMatches, relatedContainer, engine);
            }
          }
        }
      }
    } else {
      // Fallback to Open Library API (multi-strategy: general, title, author, isbn, subject)
      const combined = await fetchOpenLibraryResults(query);
      displayBooks(combined.slice(0, 30), resultsContainer);

      // Related: if we have subject info, use it; else try author
      if (combined.length > 0) {
        const primary = combined[0];
        let relatedFetched = false;

        if (primary.subjects && primary.subjects.length > 0) {
          const subjectSlug = primary.subjects[0]
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_]/g, "");
          relatedHeading.style.display = "block";
          relatedHeading.textContent = `Similar to "${query}"`;
          await fetchAndRenderBySubject(subjectSlug);
          relatedFetched = true;
        }

        if (!relatedFetched && primary.author) {
          relatedHeading.style.display = "block";
          relatedHeading.textContent = `More by ${primary.author.split(",")[0]}`;
          await fetchAndRenderByAuthor(primary.author.split(",")[0]);
        }
      }
    }
  } catch (err) {
    resultsContainer.innerHTML = "<p>Failed to load results. Please try again.</p>";
    relatedContainer.innerHTML = "";
    relatedHeading.style.display = "none";
    console.error(err);
  }
});

function displayBooks(bookList, container) {
  if (!bookList || bookList.length === 0) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  container.innerHTML = bookList
    .map((book) => {
      const bookData = JSON.stringify({
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl || book.image,
        subjects: book.subjects || []
      }).replace(/"/g, '&quot;');
      
      return `
        <div class="book-card" data-book='${bookData}' onclick="showBookDetails(this)">
          <img src="${book.coverUrl || book.image || 'https://via.placeholder.com/150x220?text=No+Cover'}" 
               alt="${book.title}" 
               class="book-image"
               loading="lazy"
               onerror="this.onerror=null;this.src='https://via.placeholder.com/150x220?text=No+Cover';">
          <h3>${book.title}</h3>
          <p class="author">by ${book.author}</p>
        </div>
      `;
    })
    .join("");
}

// Helpers to fetch related content
async function fetchOpenLibraryResults(query) {
  // Detect ISBN (10 or 13 digits possibly with hyphens)
  const cleanIsbn = query.replace(/[-\s]/g, "");
  const isIsbn = /^\d{10}(\d{3})?$/.test(cleanIsbn);

  const subjectSlug = query
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");

  const endpoints = [
    `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=30`,
    `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=30`,
    `https://openlibrary.org/search.json?author=${encodeURIComponent(query)}&limit=30`,
  ];
  if (isIsbn) {
    endpoints.push(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn)}&limit=5`);
  }

  // Subject endpoint has different shape
  const subjectUrl = `https://openlibrary.org/subjects/${subjectSlug}.json?limit=30`;

  const requests = endpoints.map((url) => fetch(url).then((r) => r.json()).catch(() => ({ docs: [] })));
  const subjectReq = fetch(subjectUrl).then((r) => r.json()).catch(() => ({ works: [] }));

  const results = await Promise.all([...requests, subjectReq]);

  const mapDoc = (d) => {
    const coverId = d.cover_i;
    const coverUrl = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : "https://via.placeholder.com/150x220?text=No+Cover";
    return {
      title: d.title || "Untitled",
      author: d.author_name ? d.author_name.join(", ") : "Unknown Author",
      coverUrl,
      subjects: d.subject || [],
    };
  };

  const aggregate = [];
  // First N results are JSON with docs
  for (let i = 0; i < endpoints.length; i++) {
    const data = results[i];
    const docs = (data && data.docs) || [];
    aggregate.push(...docs.map(mapDoc));
  }

  // Subject results (works)
  const subjectData = results[results.length - 1];
  const works = (subjectData && subjectData.works) || [];
  aggregate.push(
    ...works.map((w) => {
      const coverId = w.cover_id;
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : "https://via.placeholder.com/150x220?text=No+Cover";
      return {
        title: w.title || "Untitled",
        author: w.authors && w.authors.length > 0 ? w.authors.map((a) => a.name).join(", ") : "Unknown Author",
        coverUrl,
        subjects: (w.subjects || w.subject || []).slice(0, 5),
      };
    })
  );

  // Deduplicate by title+author
  const seen = new Set();
  const unique = [];
  for (const b of aggregate) {
    const key = `${(b.title || '').toLowerCase()}|${(b.author || '').toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(b);
    }
  }

  return unique;
}
async function fetchAndRenderBySubject(subjectSlug) {
  try {
    relatedHeading.style.display = "block";
    relatedHeading.textContent = "Related Books";
    relatedContainer.innerHTML = "<p>Finding related by subject...</p>";

    const url = `https://openlibrary.org/subjects/${subjectSlug}.json?limit=12`;
    const resp = await fetch(url);
    const data = await resp.json();
    const works = data.works || [];
    const mapped = works.map((w) => {
      const coverId = w.cover_id;
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : "https://via.placeholder.com/150x220?text=No+Cover";
      return {
        title: w.title || "Untitled",
        author: w.authors && w.authors.length > 0 ? w.authors.map(a => a.name).join(", ") : "Unknown Author",
        coverUrl,
      };
    });
    displayBooks(mapped, relatedContainer);
  } catch (e) {
    relatedHeading.style.display = "none";
    relatedContainer.innerHTML = "";
    console.error(e);
  }
}

async function fetchAndRenderByAuthor(authorName) {
  try {
    relatedHeading.style.display = "block";
    relatedHeading.textContent = `More by ${authorName}`;
    relatedContainer.innerHTML = "<p>Finding related by author...</p>";

    const url = `https://openlibrary.org/search.json?author=${encodeURIComponent(authorName)}&limit=12`;
    const resp = await fetch(url);
    const data = await resp.json();
    const docs = data.docs || [];
    const mapped = docs.map((d) => {
      const coverId = d.cover_i;
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : "https://via.placeholder.com/150x220?text=No+Cover";
      return {
        title: d.title || "Untitled",
        author: d.author_name ? d.author_name.join(", ") : authorName,
        coverUrl,
      };
    });
    displayBooks(mapped, relatedContainer);
  } catch (e) {
    relatedHeading.style.display = "none";
    relatedContainer.innerHTML = "";
    console.error(e);
  }
}
// show more

  document.addEventListener("DOMContentLoaded", function() {
    const carousel = document.getElementById("new-releases-carousel");
    const cards = carousel.querySelectorAll(".book-card");
    const showMoreBtn = document.getElementById("show-more-btn");

    let visibleCount = 6; // how many cards to show initially
    const increment = 6; // how many more to show each click

    // Hide extra cards initially
    cards.forEach((card, index) => {
      if (index >= visibleCount) card.style.display = "none";
    });

    // Show more on click
    showMoreBtn.addEventListener("click", () => {
      let hiddenCards = [...cards].filter(c => c.style.display === "none");
      hiddenCards.slice(0, increment).forEach(c => c.style.display = "flex");

      // Hide button if no more to show
      if (hiddenCards.length <= increment) {
        showMoreBtn.style.display = "none";
      }
    });
  });

// Rating-Based Recommendation System
document.addEventListener("DOMContentLoaded", async function() {
  const engine = new RatingRecommendationEngine();
  const ratingCarousel = document.getElementById("rating-recommendations-carousel");
  const personalizedCarousel = document.getElementById("personalized-recommendations-carousel");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const homeLinks = document.querySelectorAll('.home-link');

  // Show loading state
  if (ratingCarousel) {
    ratingCarousel.innerHTML = "<p>Loading recommendations...</p>";
  }
  if (personalizedCarousel) {
    personalizedCarousel.innerHTML = "<p>Loading personalized recommendations...</p>";
  }

  try {
    // Load books data
    await engine.loadBooks();

    // Initial display - New & Trending (2015-2025 books)
    displayRatingRecommendations(engine, "new-trending");

    // Filter button handlers
    filterButtons.forEach((btn) => {
      btn.addEventListener("click", function() {
        // Remove active class from all buttons
        filterButtons.forEach((b) => b.classList.remove("active"));
        // Add active class to clicked button
        this.classList.add("active");
        // Get filter type
        const filterType = this.getAttribute("data-filter");
        displayRatingRecommendations(engine, filterType);
      });
    });

    // Display personalized recommendations
    displayPersonalizedRecommendations(engine);

  } catch (error) {
    console.error("Error initializing recommendation system:", error);
    if (ratingCarousel) {
      ratingCarousel.innerHTML = "<p>Error loading recommendations. Please refresh the page.</p>";
    }
    if (personalizedCarousel) {
      personalizedCarousel.innerHTML = "<p>Error loading personalized recommendations.</p>";
    }
  }

  // Make Home link scroll to top and reset UI when already on home page
  homeLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const isMain = location.pathname.endsWith('main.html') || location.pathname === '/' || location.pathname === '';
      if (isMain) {
        e.preventDefault();
        // Reset search UI
        if (queryInput) queryInput.value = '';
        if (resultsContainer) resultsContainer.innerHTML = '';
        if (relatedContainer) relatedContainer.innerHTML = '';
        if (relatedHeading) relatedHeading.style.display = 'none';
        // Reset recommendations to default
        displayRatingRecommendations(engine, "new-trending");
        displayPersonalizedRecommendations(engine);
        // Smooth scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // else let browser navigate to main.html
    });
  });
});

// Display rating-based recommendations
function displayRatingRecommendations(engine, filterType) {
  const carousel = document.getElementById("rating-recommendations-carousel");
  if (!carousel) return;

  let recommendations = [];

  switch (filterType) {
    case "highest-rated":
      recommendations = engine.getHighestRated(20);
      break;
    case "most-reviewed":
      recommendations = engine.getMostReviewed(20);
      break;
    case "popular":
      recommendations = engine.getMostPopular(20);
      break;
    case "recent-high-rated":
      recommendations = engine.getRecentHighRated(20);
      break;
    case "new-trending":
      recommendations = engine.getNewAndTrending(20);
      break;
    default:
      recommendations = engine.getHighestRated(20);
  }

  if (recommendations.length === 0) {
    carousel.innerHTML = "<p>No recommendations available for this filter.</p>";
    return;
  }

  carousel.innerHTML = recommendations.map((book) => engine.renderBookCard(book)).join("");
}

// Display personalized recommendations
function displayPersonalizedRecommendations(engine) {
  const carousel = document.getElementById("personalized-recommendations-carousel");
  if (!carousel) return;

  const recommendations = engine.getPersonalizedRecommendations(20);

  if (recommendations.length === 0) {
    carousel.innerHTML = "<p>No personalized recommendations available.</p>";
    return;
  }

  carousel.innerHTML = recommendations.map((book) => engine.renderBookCard(book)).join("");
}

// Display books with ratings
function displayBooksWithRatings(bookList, container, engine) {
  if (!bookList || bookList.length === 0) {
    container.innerHTML = "<p>No books found.</p>";
    return;
  }

  container.innerHTML = bookList
    .map((book) => {
      const rating = book.ratings_average
        ? engine.formatRating(book.ratings_average)
        : "";
      const reviewCount = book.ratings_count > 0 ? `(${book.ratings_count} reviews)` : "";
      
      const bookData = JSON.stringify({
        title: book.title,
        author: book.author,
        cover_url: book.cover_url || book.coverUrl,
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
          <img src="${book.cover_url || book.coverUrl || "https://via.placeholder.com/150x220?text=No+Cover"}" 
               alt="${book.title}" 
               class="book-image"
               onerror="this.src='https://via.placeholder.com/150x220?text=No+Cover'">
          <h3>${book.title}</h3>
          <p class="author">by ${book.author}</p>
          ${rating ? `<p class="rating">${rating} ${reviewCount}</p>` : ""}
        </div>
      `;
    })
    .join("");
}

// Book Details Modal Functions
let currentBookData = null;

// Make showBookDetails globally accessible
window.showBookDetails = async function(bookCardElement) {
  const bookDataStr = bookCardElement.getAttribute('data-book');
  if (!bookDataStr) return;
  
  try {
    const bookData = JSON.parse(bookDataStr.replace(/&quot;/g, '"'));
    currentBookData = bookData;
    
    // Show modal
    const modal = document.getElementById('bookDetailsModal');
    modal.classList.add('active');
    
    // Populate basic info
    document.getElementById('modalBookTitle').textContent = bookData.title || 'Unknown Title';
    document.getElementById('modalBookAuthor').textContent = bookData.author || 'Unknown Author';
    document.getElementById('modalBookCover').src = bookData.cover_url || bookData.coverUrl || 'https://via.placeholder.com/300x450?text=No+Cover';
    
    // Populate meta info
    const ratingEl = document.getElementById('modalBookRating');
    if (bookData.ratings_average) {
      ratingEl.textContent = `⭐ ${parseFloat(bookData.ratings_average).toFixed(1)}`;
      if (bookData.ratings_count) {
        ratingEl.textContent += ` (${bookData.ratings_count} reviews)`;
      }
    } else {
      ratingEl.textContent = 'No rating available';
    }
    
    const yearEl = document.getElementById('modalBookYear');
    yearEl.textContent = bookData.first_publish_year ? `Published: ${bookData.first_publish_year}` : '';
    
    const subjectEl = document.getElementById('modalBookSubject');
    const subjects = bookData.subject || bookData.additional_subjects || '';
    subjectEl.textContent = subjects ? `Genre: ${subjects.split(',')[0]}` : '';
    
    // Set Open Library link
    const openLibraryBtn = document.getElementById('btnOpenLibrary');
    if (openLibraryBtn) {
      if (bookData.key) {
        // Keys are in format like "/works/OL66554W" - construct full URL
        let keyPath = bookData.key.trim();
        // Ensure it starts with / if not already
        if (!keyPath.startsWith('/')) {
          keyPath = '/' + keyPath;
        }
        // Construct full Open Library URL
        openLibraryBtn.href = `https://openlibrary.org${keyPath}`;
      } else {
        // Fallback to search with title and author
        const searchQuery = encodeURIComponent(`${bookData.title} ${bookData.author || ''}`.trim());
        openLibraryBtn.href = `https://openlibrary.org/search?q=${searchQuery}`;
      }
      
      // Ensure the link opens in a new tab and is secure
      openLibraryBtn.target = '_blank';
      openLibraryBtn.rel = 'noopener noreferrer';
      
      // Remove any existing onclick handlers that might interfere
      openLibraryBtn.onclick = null;
    }
    
    // Fetch detailed description from Open Library
    document.getElementById('modalBookDescription').innerHTML = '<p>Loading description...</p>';
    await fetchBookDescription(bookData);
    
    // Populate additional info
    const detailsEl = document.getElementById('modalBookDetails');
    let detailsHtml = '';
    if (bookData.edition_count) {
      detailsHtml += `<p><strong>Editions:</strong> ${bookData.edition_count}</p>`;
    }
    if (bookData.additional_subjects) {
      const subjects = bookData.additional_subjects.split(',').slice(0, 5);
      detailsHtml += `<p><strong>Subjects:</strong> ${subjects.join(', ')}</p>`;
    }
    detailsEl.innerHTML = detailsHtml || '<p>No additional information available.</p>';
    
  } catch (error) {
    console.error('Error showing book details:', error);
  }
};

async function fetchBookDescription(bookData) {
  try {
    // Use the engine's description fetching to benefit from caching
    const engine = new RatingRecommendationEngine();
    await engine.loadBooks();
    
    const description = await engine.fetchBookDescription(bookData);
    
    const descEl = document.getElementById('modalBookDescription');
    if (description) {
      descEl.innerHTML = `<p>${description}</p>`;
    } else {
      descEl.innerHTML = '<p>No description available for this book.</p>';
    }
    
    // Store engine reference for later use in similarity
    window.recommendationEngine = engine;
  } catch (error) {
    document.getElementById('modalBookDescription').innerHTML = '<p>Unable to load description.</p>';
    console.error('Error fetching description:', error);
  }
}

// Close modal handlers
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('bookDetailsModal');
  const closeBtn = document.querySelector('.close-modal');
  const overlay = document.querySelector('.modal-overlay');
  const btnFindSimilar = document.getElementById('btnFindSimilar');
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  if (overlay) {
    overlay.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }
  
  // Find Similar Books button
  if (btnFindSimilar) {
    btnFindSimilar.addEventListener('click', async () => {
      if (!currentBookData) return;
      
      modal.classList.remove('active');
      
      // Use enhanced similarity if engine is available
      if (window.recommendationEngine) {
        const engine = window.recommendationEngine;
        relatedHeading.style.display = "block";
        relatedHeading.textContent = `Similar to "${currentBookData.title}"`;
        relatedContainer.innerHTML = "<p>Finding similar books based on author, description, and more...</p>";
        
        // Use enhanced similarity algorithm
        const similar = await engine.getSimilarHybrid(currentBookData, 12);
        if (similar.length > 0) {
          displayBooksWithRatings(similar, relatedContainer, engine);
        } else {
          relatedContainer.innerHTML = "<p>No similar books found.</p>";
        }
      } else {
        // Fallback to search
        queryInput.value = currentBookData.title;
        searchForm.dispatchEvent(new Event('submit'));
      }
      
      // Scroll to results
      setTimeout(() => {
        relatedContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    });
  }
  
  // Make book cards cursor pointer
  document.addEventListener('click', function(e) {
    if (e.target.closest('.book-card')) {
      e.target.closest('.book-card').style.cursor = 'pointer';
    }
  });
});

