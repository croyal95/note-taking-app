Note Taking Application

A full-stack note-taking application with user authentication, folder organization, and real-time saving capabilities. Built with Node.js, Express, MongoDB, and JavaScript.

// Features

User authentication (register, login, password change),
Create, read, update, and delete notes,
Organize notes in folders,
Real-time auto-saving,
Dark/light theme toggle,
Responsive design for mobile and desktop,
Session management with MongoDB store,
Secure password hashing,
Error logging and monitoring.

// Tech Stack
Backend

Node.js,
Express.js,
MongoDB with Mongoose,
Passport.js for authentication,
Winston for logging,
Express Session with Connect Mongo.

Frontend

JavaScript,
HTML5,
CSS3 with responsive design,
Local/Session Storage for state management.

Prerequisites

Node.js >= 16.0.0,
npm >= 8.0.0,
MongoDB.

// Installation

Clone the repository

git clone <repository-url>
cd note-taking-app

Install dependencies

npm install

Start MongoDB service
Run the application

# Development mode with nodemon
npm run dev

# Production mode
npm run prod

// API Endpoints
Authentication

POST /api/auth/register - Register new user,
POST /api/auth/login - User login,
POST /api/auth/logout - User logout,
POST /api/auth/change-password - Change password,
GET /api/auth/verify-session - Verify user session.

Notes

GET /api/notes - Get all notes,
POST /api/notes - Create new note,
PUT /api/notes/:id - Update note,
DELETE /api/notes/:id - Delete note.

Folders

GET /api/folders - Get all folders,
POST /api/folders - Create new folder,
PUT /api/folders/:id - Update folder,
DELETE /api/folders/:id - Delete folder.

// Security Features

CORS configuration for allowed origins,
Session management with secure cookies,
Password hashing using bcrypt.


// Additional scripts:

npm run lint - Run ESLint,
npm run lint:fix - Fix ESLint errors,
npm run format - Format code with Prettier.

License
ISC
Author
Cole Royal
