import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

/** En développement, recharge la page quand `npm run donnees` réécrit les objets. */
function rechargerDonnees(): Plugin {
  const fichier = path.resolve(import.meta.dirname, 'public/data/objets.json');
  return {
    name: 'recharger-donnees',
    configureServer(server) {
      server.watcher.add(fichier);
      server.watcher.on('change', (f) => {
        if (path.resolve(f) === fichier) server.ws.send({ type: 'full-reload' });
      });
    },
  };
}

// Site statique : tout est servi depuis dist/, les données et les icônes depuis public/.
export default defineConfig({
  plugins: [react(), rechargerDonnees()],
  base: './',
  // Le cache des scripts de données change sans cesse pendant un téléchargement : rien à recharger.
  server: { watch: { ignored: ['**/.cache/**'] } },
});
