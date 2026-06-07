import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Apply saved palette theme on initial load
const savedPalette = localStorage.getItem('palette');
if (savedPalette === 'classic') {
  document.documentElement.classList.add('theme-classic');
}
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
