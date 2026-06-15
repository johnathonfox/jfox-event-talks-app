# BigQuery Release Pulse

BigQuery Release Pulse is a modern, dark-themed, glassmorphic web application built to help you track, filter, and share Google Cloud BigQuery updates.

## 🚀 Features

- **Real-Time Feed Digestion**: Automatically pulls and segments Google's official BigQuery release notes RSS feed.
- **Efficient Server caching**: Implements a 10-minute cache on the backend to optimize fetch speeds and minimize outbound requests.
- **Dynamic Category Filters & Search**: Search updates by keyword or filter them by categories (`Feature`, `Changed`, `Deprecated`, `Other`).
- **Interactive Copy-to-Clipboard**: Copy direct links to individual release updates with one click.
- **Social Sharing Integration**: Select any update to draft and format a tweet optimized for the 280-character limit, then open it directly on X (Twitter).

---

## 📁 Project Structure

```text
agy-cli-projects/
├── bq-release-notes/
│   ├── app.py                # Flask Server entry point
│   ├── requirements.txt      # Python dependencies
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css     # Glassmorphic custom stylesheet
│   │   └── js/
│   │       └── main.js       # Search, selection, and share logic
│   └── templates/
│       └── index.html        # App interface markup
├── news.txt                  # Sample world news feed
├── summary.txt               # Parsed summary of the news feed
└── .gitignore                # Git exclusion patterns
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have **Python 3.8+** and **Git** installed on your system.

### 2. Set Up a Virtual Environment
Navigate to the application folder and initialize a virtual environment:

```bash
cd bq-release-notes
python -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell)**:
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
- **macOS / Linux**:
  ```bash
  source .venv/bin/activate
  ```

### 3. Install Dependencies
Install the required packages using pip:

```bash
pip install -r requirements.txt
```

### 4. Run the Application
Start the Flask development server:

```bash
python app.py
```

Open your browser and navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)**.
