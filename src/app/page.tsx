"use client";

import { useEffect, useState } from "react";

type AuthState =
  | { status: "loading" }
  | { status: "out" }
  | { status: "in"; displayName: string };

export default function Home() {
  const [auth, setAuth] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setAuth({ status: "in", displayName: data.displayName });
        } else {
          setAuth({ status: "out" });
        }
      })
      .catch(() => setAuth({ status: "out" }));
  }, []);

  return (
    <main
      className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-black bg-contain bg-center bg-no-repeat px-6 text-center"
      style={{ backgroundImage: "url(/logo.jpg)" }}
    >
      <h1 className="sr-only">MyPlaylist</h1>
      <div className="flex flex-col items-center gap-6 rounded-3xl bg-black/60 px-6 py-8 backdrop-blur-sm">
        <p className="max-w-md text-white/80">
          Importe les morceaux que tu as Shazamés et transforme-les
          automatiquement en playlist Spotify, prête à écouter.
        </p>

        {auth.status === "loading" && (
          <p className="text-sm text-white/60">Chargement…</p>
        )}

        {auth.status === "out" && (
          <a
            href="/api/auth/login"
            className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Se connecter avec Spotify
          </a>
        )}

        {auth.status === "in" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-white">Connecté en tant que {auth.displayName}</p>
            <a
              href="/import"
              className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition hover:opacity-90"
            >
              Importer mes Shazams
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
