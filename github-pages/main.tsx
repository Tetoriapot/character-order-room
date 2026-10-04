import { createRoot } from 'react-dom/client';
import { CharacterStudio } from '../components/studio/character-studio';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(<CharacterStudio assetsHref="./assets/" />);
