// React core library to enable strict mode (helps catch bugs early)
import { StrictMode } from 'react'
// Creates the app root to render everything into the page
import { createRoot } from 'react-dom/client'
// Import global CSS styles
import './index.css'
// Import the main app component
import App from './App.jsx'
// Allows you to use links and page navigation
import { BrowserRouter } from 'react-router-dom'
// AppContext provides global state (shared data) across components
import { AppContextProvider } from './context/AppContext.jsx'
// ClerkProvider handles user authentication (login, logout, etc.)
import { ClerkProvider } from '@clerk/clerk-react'
// Get the Clerk public key from environment variables (for authentication)
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
// Show an error if the Clerk key is missing (app won’t work without it)
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

// This is where the app actually gets rendered into the HTML page
createRoot(document.getElementById('root')).render(
  // Wrap the app in ClerkProvider for authentication support
  // afterSignOutUrl means: when the user logs out, send them to the homepage
  <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl='/'>
    {/* Enable routing in the app (links, navigation, etc.) */}
    <BrowserRouter>
      {/* AppContextProvider lets components share global state (like user info) */}
      <AppContextProvider>
        {/* The actual app UI */}
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </ClerkProvider>
)
