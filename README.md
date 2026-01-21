# Settings Management System

A full-stack application for managing arbitrary JSON configuration data with a REST API backend and React frontend.

## Tech Stack

- **Backend**: Node.js, Express, SQLite (better-sqlite3)
- **Frontend**: React 18 with Vite
- **Deployment**: Docker & Docker Compose

## Quick Start

### Prerequisites
- Docker and Docker Compose installed

### Running the Application

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd settings-management
   ```

2. Start the application:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
    - **Frontend UI**: http://localhost:5173
    - **Backend API**: http://localhost:3001

## Features

### Frontend UI

- **Search by ID**: Search for a specific settings object by its UUID. Displays HTTP 404 error if not found.
- **Visual JSON Editor**: Block-based editor (similar to Scratch/Code.org) with:
    - Fixed JSON syntax (brackets, quotes, colons)
    - Editable key and value fields
    - Type selector (text, number, true/false, JSON)
    - Input validation with error messages
    - Add/remove fields dynamically
- **Raw JSON Editor**: Traditional textarea for advanced users
- **CRUD Operations**: Create, read, update, and delete settings
- **Pagination**: Navigate through settings with Previous/Next buttons
- **Success/Error Messages**: Clear feedback with HTTP status codes

### Input Validation

The Visual Editor validates input in real-time:
- **Number type**: Shows "Not a number!" error if letters are entered
- **JSON type**: Shows "Invalid JSON!" error if syntax is wrong
- **Create/Update buttons**: Disabled until all validation errors are fixed

## API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| POST | `/settings` | Create a new settings object | 201 Created |
| GET | `/settings` | Get paginated list of settings | 200 OK |
| GET | `/settings/:id` | Get a specific settings object | 200 OK / 404 Not Found |
| PUT | `/settings/:id` | Replace a settings object | 200 OK / 404 Not Found |
| DELETE | `/settings/:id` | Delete a settings object (idempotent) | 204 No Content |

### Pagination

The `GET /settings` endpoint supports pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

Example: `GET /settings?page=2&limit=5`

### Example Requests

**Create Settings:**
```bash
curl -X POST http://localhost:3001/settings \
  -H "Content-Type: application/json" \
  -d '{"theme": "dark", "language": "en"}'
```

**Get All Settings:**
```bash
curl http://localhost:3001/settings?page=1&limit=10
```

**Get One Setting:**
```bash
curl http://localhost:3001/settings/<id>
```

**Update Settings:**
```bash
curl -X PUT http://localhost:3001/settings/<id> \
  -H "Content-Type: application/json" \
  -d '{"theme": "light", "language": "es"}'
```

**Delete Settings:**
```bash
curl -X DELETE http://localhost:3001/settings/<id>
```

## Design Decisions

### Database: SQLite
- Chosen for simplicity - no separate database container needed
- Data persists via Docker volume
- Stores JSON as TEXT, parsed on read

### Pagination: Page-based (Limit/Offset)
- Simple limit/offset pagination
- Returns total count and total pages for UI navigation
- Default: 10 items per page

### API Design
- RESTful conventions followed
- DELETE is idempotent (always returns 204)
- Proper HTTP status codes:
    - 201 for successful creation
    - 404 for not found (GET, PUT)
    - 204 for successful deletion

### Visual JSON Editor
- Block-based design inspired by Scratch/Code.org
- Users edit only values, not JSON syntax
- Type validation prevents invalid data
- Light color scheme for better readability

### Error Handling
- HTTP status codes displayed to users (e.g., "Error 404: Settings not found")
- Input validation errors shown inline
- Success messages auto-clear after 5 seconds

## Development

### Running without Docker

**Backend:**
```bash
cd backend
npm install
mkdir -p data
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Note: When running locally without Docker, update the Vite proxy target in `vite.config.js`:
```javascript
proxy: {
  '/settings': {
    target: 'http://localhost:3001',  // Change from 'http://backend:3001'
    changeOrigin: true
  }
}
```

## Testing the API with Postman

1. **GET all settings**: `GET http://localhost:3001/settings?page=1&limit=5`
2. **GET one setting**: `GET http://localhost:3001/settings/{id}`
3. **POST create**: `POST http://localhost:3001/settings` with JSON body
4. **PUT update**: `PUT http://localhost:3001/settings/{id}` with JSON body
5. **DELETE**: `DELETE http://localhost:3001/settings/{id}`# Setting-Management
