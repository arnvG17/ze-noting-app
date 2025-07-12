# NotingApp Frontend

A modern React frontend for the NotingApp - an AI-powered document summarization and note-taking application.

## Features

- **Modern UI/UX**: Beautiful, responsive design with smooth animations
- **Document Upload**: Drag-and-drop file upload for PDF, DOCX, and TXT files
- **AI Chatbot**: Interactive chatbot for document-related questions
- **Real-time Processing**: Live status updates during document processing
- **PDF Downloads**: Download summarized notes as PDF files
- **Mobile Responsive**: Optimized for all device sizes

## Tech Stack

- **React 18**: Latest React with hooks and modern patterns
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing
- **React Dropzone**: Drag-and-drop file upload
- **React Hot Toast**: Beautiful toast notifications
- **CSS3**: Modern styling with gradients and animations

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Project Structure

```
frontend/
├── public/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx      # Main landing page
│   │   ├── Header.jsx           # Navigation header
│   │   ├── DocumentUpload.jsx   # File upload component
│   │   ├── Chatbot.jsx          # AI chatbot modal
│   │   ├── Features.jsx         # Features section
│   │   └── Footer.jsx           # Footer component
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Entry point
│   ├── index.css                # Global styles
│   ├── App.css                  # App-specific styles
│   └── components.css           # Component styles
├── package.json
├── vite.config.js
└── README.md
```

## API Integration

The frontend communicates with the backend API through the following endpoints:

- `POST /api/upload` - Upload and process documents
- `POST /api/ask` - Chat with AI about documents

The API proxy is configured in `vite.config.js` to forward requests to the backend server running on port 5000.

## Key Components

### LandingPage
The main landing page featuring:
- Hero section with compelling copy
- Document upload area
- Features showcase
- Footer with links

### DocumentUpload
Handles file upload with:
- Drag-and-drop functionality
- File type validation (PDF, DOCX, TXT)
- File size limits (10MB)
- Upload progress indication
- Download functionality for processed notes

### Chatbot
Interactive AI assistant with:
- Modal interface
- Real-time messaging
- Typing indicators
- Message history
- Error handling

## Styling

The application uses a modern design system with:
- Gradient backgrounds and buttons
- Glassmorphism effects
- Smooth animations and transitions
- Responsive grid layouts
- Custom scrollbars
- Mobile-first approach

## Development

### Adding New Components

1. Create a new component in `src/components/`
2. Add corresponding styles to `src/components.css`
3. Import and use in the appropriate parent component

### Styling Guidelines

- Use CSS custom properties for consistent theming
- Follow BEM methodology for class naming
- Implement responsive design with mobile-first approach
- Use CSS Grid and Flexbox for layouts
- Add smooth transitions for better UX

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
