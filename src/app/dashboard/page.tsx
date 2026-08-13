"use client";

import { useEffect, useState } from "react";

type ImportedTrack = { title: string; artist: string };
type SpotifyMatch = {
  id: string;
  uri: string;
  name: string;
  artists: string[];
  album: string;
  imageUrl: string | null;
  externalUrl: string;
};
type MatchResult = { query: ImportedTrack; match: SpotifyMatch | null };

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [playlistName, setPlaylistName] = useState("Mes Shazams");
  const [creating, setCreating] = useState(false);
  const [playlist, setPlaylist] = useState<{ id: string; url: string } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("shazam_tracks");
    const tracks: ImportedTrack[] | null = raw ? JSON.parse(raw) : null;

    if (!tracks) {
      Promise.resolve().then(() => {
        setError("Aucun morceau importé. Retourne sur la page d'import.");
        setLoading(false);
      });
      return;
    }

    fetch("/api/spotify/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tracks }),
    })
      .then((res) => {
        if (res.status === 401) throw new Error("not_authenticated");
        return res.json();
      })
      .then((data: { results: MatchResult[] }) => {
        setResults(data.results);
        setSelected(
          new Set(
            data.results
              .filter((r) => r.match)
              .map((r) => r.match!.uri)
          )
        );
      })
      .catch(() =>
        setError(
          "Impossible de récupérer les correspondances Spotify. Reconnecte-toi."
        )
      )
      .finally(() => setLoading(false));
  }, []);

  function toggle(uri: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uri)) next.delete(uri);
      else next.add(uri);
      return next;
    });
  }

  async function handleCreatePlaylist() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/spotify/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playlistName,
          trackUris: Array.from(selected),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "unknown_error");
      setPlaylist({ id: data.playlistId, url: data.playlistUrl });
    } catch {
      setError("La création de la playlist a échoué. Réessaie.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p>Recherche de tes morceaux sur Spotify…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold">Tes morceaux</h1>
      {error && <p className="text-sm text-red-500">{error}</p>}

      {playlist ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-foreground/70">
            Playlist créée ! Écoute-la directement ici :
          </p>
          <iframe
            title="Playlist Spotify"
            src={`https://open.spotify.com/embed/playlist/${playlist.id}`}
            width="100%"
            height="352"
            allow="encrypted-media"
            className="rounded-lg"
          />
          <a
            href={playlist.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-[#1DB954] underline"
          >
            Ouvrir dans Spotify
          </a>
        </div>
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-foreground/10">
            {results.map(({ query, match }, i) => (
              <li key={i} className="flex items-center gap-3 py-3">
                <input
                  type="checkbox"
                  disabled={!match}
                  checked={!!match && selected.has(match.uri)}
                  onChange={() => match && toggle(match.uri)}
                  className="size-4"
                />
                {match?.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={match.imageUrl}
                    alt=""
                    className="size-10 rounded object-cover"
                  />
                )}
                <div className="flex flex-col">
                  {match ? (
                    <>
                      <span className="font-medium">{match.name}</span>
                      <span className="text-sm text-foreground/60">
                        {match.artists.join(", ")}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-medium line-through opacity-60">
                        {query.title}
                      </span>
                      <span className="text-sm text-red-500">
                        Introuvable sur Spotify
                      </span>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 border-t border-foreground/10 pt-4">
            <label className="flex flex-col gap-1 text-sm">
              Nom de la playlist
              <input
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="rounded-lg border border-foreground/20 bg-transparent p-2 outline-none focus:border-[#1DB954]"
              />
            </label>
            <button
              onClick={handleCreatePlaylist}
              disabled={creating || selected.size === 0}
              className="self-start rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {creating
                ? "Création…"
                : `Créer la playlist (${selected.size} morceaux)`}
            </button>
          </div>
        </>
      )}
    </main>
  );
}
