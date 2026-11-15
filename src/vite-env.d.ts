/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Version publiée, posée par la CI (ex. « 0.1.3 »). */
  readonly VITE_VERSION?: string;
  /** « 1 » : le relais /armurerie existe sur l'hébergement, l'import du personnage est proposé. */
  readonly VITE_ARMURERIE?: string;
}
