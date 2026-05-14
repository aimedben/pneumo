import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { Lung3D } from "@/components/Lung3D";
import { predictXray } from "@/lib/predict.functions";
import { Button } from "@/components/ui/button";
import { Activity, Upload, Sparkles, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://pneumonie.aimadben2004.workers.dev/" }],
    meta: [
      {
        title: "Détection de Pneumonie par IA : Diagnostic Radiographique | Narimane Amsseli",
      },
      {
        name: "description",
        content: "Application de diagnostic pneumologique basé sur l'IA pour détecter la pneumonie sur radiographie thoracique. Démonstration technique par Narimane Amsseli.",
      },
      {
        name: "google-site-verification",
        content: "_4mssdWLltNkDLAPurbUxq3DmgyZIhqlwsQCqMJ0Erw",
      },
      { 
        name: "keywords", 
        content: "Narimane Amsseli, pneumonie, radiographie thoracique, x-ray, détection pneumonie, imagerie médicale, diagnostic pulmonaire, portfolio IA" 
      },
      { property: "og:title", content: "Narimane DiagnosticPneumo — Détection de pneumonie sur radiographie" },
      { property: "og:description", content: "Analyse de radiographie thoracique avec score de confiance par intelligence artificielle." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Narimane DiagnosticPneumo — Détection de pneumonie" },
      { name: "twitter:description", content: "Analyse de radiographie thoracique avec score de confiance." },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          name: "Narimane DiagnosticPneumo",
          description: "Outil d'aide au diagnostic permettant l'analyse de radiographies thoraciques pour la détection de la pneumonie.",
          inLanguage: "fr",
          about: { "@type": "MedicalCondition", name: "Pneumonie" },
        }),
      },
    ],
  }),
  component: Index,
});

type Status = "idle" | "loading" | "normal" | "pneumonia";
type HistoryItem = { name: string; prediction: string; confidence: number; at: number };

function Index() {
  const predict = useServerFn(predictXray);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<{ prediction: string; confidence: number; mock?: boolean } | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setStatus("idle");
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(f);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setStatus("loading");
    setResult(null);
    const buf = await file.arrayBuffer();
    let bin = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    const b64 = btoa(bin);
    try {
      const res = await predict({ data: { imageBase64: b64, filename: file.name } });
      const isP = res.prediction === "PNEUMONIA";
      setStatus(isP ? "pneumonia" : "normal");
      setResult(res);
      setHistory((h) => [{ name: file.name, prediction: res.prediction, confidence: res.confidence, at: Date.now() }, ...h].slice(0, 6));
    } catch (e) {
      console.error(e);
      setStatus("idle");
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStatus("idle");
  };

  return (
    <main className="min-h-screen relative overflow-hidden flex flex-col justify-between">
      {/* Ambient backdrop glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-30"
             style={{ background: "radial-gradient(circle, var(--neon) 0%, transparent 60%)" }} />
      </div>

      <div>
        <header className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl glass glow flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-glow block">Narimane DiagnosticPneumo</span>
              <p className="text-xs text-muted-foreground">Medical Imaging</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Système prêt
          </div>
        </header>

        <section className="container mx-auto px-6 pt-8 pb-16 grid lg:grid-cols-2 gap-10 items-center">
          {/* LEFT: hero text + upload */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 text-xs text-primary glass px-3 py-1 rounded-full mb-4">
                <Sparkles className="w-3 h-3" /> Aperçu d'analyse diagnostique
              </div>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
                Détection de la <span className="text-primary text-glow">pneumonie</span> par radiographie thoracique
              </h1>
              <p className="mt-4 text-muted-foreground max-w-lg">
                Importez une image de radiographie thoracique. La structure pulmonaire est analysée
                et un résultat est fourni avec un score de confiance.
              </p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`glass rounded-2xl p-6 cursor-pointer transition-all relative overflow-hidden ${drag ? "glow scale-[1.01]" : ""}`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {preview ? (
                <div className="relative">
                  <img src={preview} alt="X-ray preview" className="w-full max-h-80 object-contain rounded-xl" />
                  {status === "loading" && (
                    <div className="absolute inset-0 overflow-hidden rounded-xl">
                      <div className="absolute inset-x-0 h-1 bg-primary animate-scan" style={{ boxShadow: "0 0 20px var(--neon)" }} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-14 h-14 rounded-full glass flex items-center justify-center mb-3 animate-pulse-glow">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="font-medium">Glissez-déposez une radiographie</p>
                  <p className="text-sm text-muted-foreground mt-1">ou cliquez pour sélectionner un fichier (PNG, JPG)</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={analyze}
                disabled={!file || status === "loading"}
                size="lg"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 glow font-semibold"
              >
                {status === "loading" ? "Analyse en cours…" : "Analyser la radiographie"}
              </Button>
              {file && (
                <Button onClick={reset} variant="outline" size="lg">
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          {/* RIGHT: Correction TypeScript — Seul l'attribut pris en charge est passé */}
          <div className="flex items-center justify-center min-h-[400px] glass rounded-3xl p-6 relative">
            <Lung3D status={status} />
          </div>
        </section>
      </div>

      <footer className="w-full border-t border-white/10 bg-background/50 backdrop-blur-md mt-auto">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center gap-4 text-xs text-muted-foreground justify-between">
          <div className="flex items-start gap-2.5 max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-500">Avertissement médical :</strong> Cet outil est une démonstration technique basée sur l'intelligence artificielle pour le portfolio de Narimane Amsseli. Il ne fournit pas d'avis médical officiel et ne remplace en aucun cas l'examen, le diagnostic ou le conseil d'un professionnel de la santé qualifié.
            </p>
          </div>
          <p className="shrink-0">© {new Date().getFullYear()} Narimane Amsseli</p>
        </div>
      </footer>
    </main>
  );
}
