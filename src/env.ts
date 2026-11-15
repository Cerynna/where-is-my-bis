// Réglages connus au moment de la construction (variables VITE_… posées par la CI).

/** Version publiée (VITE_VERSION, posée par la CI de release), absente en local. */
export const VERSION: string | undefined = import.meta.env.VITE_VERSION || undefined;

/** Dépôt du code source. */
export const DEPOT = 'https://github.com/Cerynna/where-is-my-bis';

/**
 * Import depuis l'armurerie : il passe par le relais /armurerie du serveur Vite (npm run dev, npm run preview).
 * L'hébergement Firebase n'a pas encore de relais (il faudrait une fonction Cloud) : désactivé en ligne,
 * sauf si la construction pose VITE_ARMURERIE=1.
 */
export const ARMURERIE_DISPONIBLE: boolean = import.meta.env.DEV || import.meta.env.VITE_ARMURERIE === '1';
