# PlaylistShazam

Transforme les morceaux que tu as Shazamés en playlist Spotify, prête à écouter directement sur le site.

## Fonctionnement

1. Connexion à ton compte Spotify (OAuth).
2. Import de tes morceaux Shazamés (Shazam n'a pas d'export automatique public, donc on colle la liste manuellement pour l'instant : `Titre - Artiste`, un par ligne).
3. Le site cherche chaque morceau sur Spotify et te montre les correspondances trouvées.
4. Une playlist Spotify est créée automatiquement avec les morceaux sélectionnés, écoutable directement depuis le site (lecteur intégré).

## Mise en route

1. Crée une app sur le [dashboard développeur Spotify](https://developer.spotify.com/dashboard) :
   - Redirect URI : `http://localhost:3000/api/auth/callback`
2. Copie `.env.example` en `.env.local` et renseigne `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET`.
3. Installe les dépendances et lance le serveur de dev :

```bash
npm install
npm run dev
```

4. Ouvre [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- Tailwind CSS
- API Web Spotify (OAuth Authorization Code + Search + Playlists)
