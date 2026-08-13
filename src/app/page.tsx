"use client";

import Image from "next/image";
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
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/logo.jpg"
        alt="MyPlaylist"
        width={260}
        height={260}
        className="rounded-2xl"
        priority
      />
      <h1 className="sr-only">PlaylistShazam</h1>
      <p className="max-w-md text-foreground/70">
        Importe les morceaux que tu as Shazamés et transforme-les
        automatiquement en playlist Spotify, prête à écouter.
      </p>

      {auth.status === "loading" && <p className="text-sm">Chargement…</p>}

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
          <p>Connecté en tant que {auth.displayName}</p>
          <a
            href="/import"
            className="rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition hover:opacity-90"
          >
            Importer mes Shazams
          </a>
        </div>
      )}
    </main>
  );
}
