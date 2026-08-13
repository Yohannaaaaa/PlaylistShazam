"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ImportPage() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function parseLines(text: string) {
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [title, artist = ""] = line.split(" - ").map((s) => s.trim());
        return { title, artist };
      })
      .filter((t) => t.title);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tracks = parseLines(raw);
    if (tracks.length === 0) {
      setError("Ajoute au moins un morceau, un par ligne.");
      return;
    }
    sessionStorage.setItem("shazam_tracks", JSON.stringify(tracks));
    router.push("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-4 px-6 py-12">
      <h1 className="text-2xl font-bold">Importer mes Shazams</h1>
      <p className="text-sm text-foreground/70">
        Shazam ne propose pas d&apos;export automatique de ton historique.
        Colle ta liste ci-dessous, un morceau par ligne, au format{" "}
        <code className="rounded bg-foreground/10 px-1">Titre - Artiste</code>.
        (Tu peux retrouver ton historique dans l&apos;app Shazam &rarr; Mes
        Shazams, ou dans ta bibliothèque Apple Music si elle y est
        synchronisée.)
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={12}
          placeholder={"Flowers - Miley Cyrus\nAs It Was - Harry Styles"}
          className="w-full rounded-lg border border-foreground/20 bg-transparent p-3 font-mono text-sm outline-none focus:border-[#1DB954]"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          className="self-start rounded-full bg-[#1DB954] px-6 py-3 font-semibold text-black transition hover:opacity-90"
        >
          Continuer
        </button>
      </form>
    </main>
  );
}
