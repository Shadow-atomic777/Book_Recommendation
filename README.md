# Book Recommendation System

A comprehensive book recommendation engine and web application. This project uses machine learning (Sentence Transformers and FAISS) for semantic search, alongside a modular frontend for a rich user experience.

## 🏗️ Project Structure

The codebase is organized into several distinct modules:

* **`book_recom_backend`**: The core Python recommendation script. It generates semantic embeddings for books using `sentence-transformers` and performs high-speed similarity search using `faiss`. It also features fuzzy string matching for query auto-correction.
* **`bookReco/`**: The modern frontend web application and data toolset. 
  * Features modular JavaScript (`recommendationEngine.js`, `script.js`).
  * Contains Python scripts for dataset generation/cleaning.
  * Contains detailed documentation on the rating and recommendation algorithms used in the browser.
* **`backend/`**: Contains data science notebooks (e.g., `book.ipynb`) used for exploratory data analysis (EDA) and initial model experimentation.
* **`frontend/`**: Contains legacy UI prototypes and static assets.

## ✨ Features

- **Semantic Search**: Understands the meaning behind book queries instead of just relying on keyword matches.
- **Fuzzy Matching**: Automatically corrects typos when searching for book titles or authors.
- **Responsive Web UI**: A dedicated frontend interface for users to discover new books, view ratings, and get personalized recommendations.

## 🚀 Setup & Installation

### Backend Requirements

To run the core Python recommendation engine, you need to install the required dependencies:

```bash
pip install sentence-transformers pandas numpy torch rapidfuzz faiss-cpu
```

*Note: Before running `book_recom_backend`, make sure to update the hardcoded file paths inside the script to point to the correct dataset locations on your local machine.*

### Frontend

The frontend is a static web application. You can simply open `bookReco/main.html` in your browser, or serve it using a local development server:

```bash
# From the project root
python -m http.server 8000
```
Then navigate to `http://localhost:8000/bookReco/main.html`.