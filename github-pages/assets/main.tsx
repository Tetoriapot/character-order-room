import { createRoot } from 'react-dom/client';
import { AssetStudio } from '../../components/studio/asset-studio';
import '../../app/globals.css';

createRoot(document.getElementById('root')!).render(
  <AssetStudio characterHref="../" />,
);
