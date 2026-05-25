document.addEventListener("DOMContentLoaded", async () => {
  const carousel = document.getElementById("new-releases-carousel");
  const showMoreBtn = document.getElementById("show-more-btn");

  let books = [];
  let visibleCount = 7;

  // 🟢 Fetch newly released books from Open Library
  async function fetchNewReleases() {
    try {
      const response = await fetch(
        "https://openlibrary.org/search.json?sort=new&limit=50&q=fiction"
      );
      const data = await response.json();

      // ✅ Filter only books between 2023–2025
      books = (data.docs || []).filter((book) => {
        const year = book.first_publish_year;
        return year && year >= 2023 && year <= 2025;
      });

      // fallback in case too few results
      if (books.length < 5) {
        books = (data.docs || []).slice(0, 30);
      }

      renderBooks();
    } catch (error) {
      console.error("Error fetching new releases:", error);
    }
  }

  // 🟢 Render the books
  function renderBooks() {
    carousel.innerHTML = "";

    books.slice(0, visibleCount).forEach((book) => {
      const title = book.title || "Untitled";
      const author = book.author_name ? book.author_name.join(", ") : "Unknown Author";
      const year = book.first_publish_year || "N/A";
      const coverId = book.cover_i;
      const coverUrl = coverId
        ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
        : "https://via.placeholder.com/150x220?text=No+Cover";

      const bookCard = document.createElement("div");
      bookCard.classList.add("book-card");
      
      // Store book data for modal
      const bookData = {
        title: title,
        author: author,
        cover_url: coverUrl,
        first_publish_year: year,
        key: book.key || ""
      };
      bookCard.setAttribute('data-book', JSON.stringify(bookData).replace(/"/g, '&quot;'));
      bookCard.onclick = function() { showBookDetails(this); };
      
      bookCard.innerHTML = `
        <img src="${coverUrl}" alt="${title}" loading="lazy" onerror="this.onerror=null;this.src='https://via.placeholder.com/150x220?text=No+Cover'">
        <div class="book-card-info">
          <h3>${title}</h3>
          <p>By ${author}</p>
          <p>Released: ${year}</p>
        </div>
      `;
      carousel.appendChild(bookCard);
    });

    showMoreBtn.textContent =
      visibleCount >= books.length ? "Show Less" : "Show More";
  }

  // 🟢 Handle "Show More" toggle
  showMoreBtn.addEventListener("click", () => {
    if (visibleCount >= books.length) {
      visibleCount = 7;
    } else {
      visibleCount += 7;
    }
    renderBooks();
  });

  // 🟢 Start fetching
  fetchNewReleases();
});
