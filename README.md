# JH Knowledge Base

A personal knowledge base application for saving and summarizing online articles using AI.

## Features

- **Article Extraction**: Automatically extracts content from web articles
- **AI Summarization**: Uses OpenAI GPT-4 to create customizable summaries
- **Searchable Database**: Search through your saved articles
- **Responsive Design**: Works on desktop and mobile
- **Export Data**: Download all your articles as JSON

## Setup

### Prerequisites

- Python 3.9+
- Node.js 16+
- MongoDB (local or MongoDB Atlas)
- OpenAI API Key

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd "knowledge base"
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```
   OPENAI_API_KEY=your_openai_api_key
   MONGODB_URL=your_mongodb_connection_string
   DATABASE_NAME=jh_knowledge_base
   PORT=8000
   ```

5. Build the frontend:
   ```bash
   cd frontend
   npm run build
   cd ..
   ```

### Running Locally

1. Start the backend server:
   ```bash
   cd backend
   python main.py
   ```

2. Open your browser to `http://localhost:8000`

### Running in Development

For development with hot reload:

1. Start the backend:
   ```bash
   cd backend
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. Start the frontend (in a new terminal):
   ```bash
   cd frontend
   npm start
   ```

3. Frontend will be available at `http://localhost:3000`

## Deployment

### Heroku

1. Create a Heroku app:
   ```bash
   heroku create your-app-name
   ```

2. Set environment variables:
   ```bash
   heroku config:set OPENAI_API_KEY=your_key
   heroku config:set MONGODB_URL=your_mongodb_atlas_url
   heroku config:set DATABASE_NAME=jh_knowledge_base
   ```

3. Deploy:
   ```bash
   git push heroku main
   ```

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Add it to your environment variables

## Usage

1. **Add Article**: Paste a URL in the input field and click "Add Knowledge Item"
2. **Review**: The app will show the extracted article with AI-generated summary
3. **Save or Discard**: Choose to save the article to your knowledge base or discard it
4. **Browse**: View all saved articles on the home screen
5. **Search**: Use the search bar to find specific articles
6. **Settings**: Customize the AI summarization prompt
7. **Export**: Download all your data as JSON

## Technology Stack

- **Backend**: FastAPI, Python
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: MongoDB
- **AI**: OpenAI GPT-4
- **Web Scraping**: BeautifulSoup, requests
- **Deployment**: Heroku

## License

MIT License