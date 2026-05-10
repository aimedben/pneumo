import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // On ajoute la configuration spécifique pour le SEO ici
  vite: {
    plugins: [
      // Si Lovable ne le génère pas par défaut, vous pouvez l'ajouter ici
      // Note: Assurez-vous que l'URL 'host' est votre domaine de production
    ],
    build: {
      // Options de build supplémentaires si nécessaire
    }
  }
});
