import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useRef, useState } from "react";
import { Lung3D } from "@/components/Lung3D";
import { predictXray } from "@/lib/predict.functions";
import { Button } from "@/components/ui/button";
import { Activity, Upload, Sparkles, AlertTriangle, ShieldCheck, Brain, BarChart2, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://pneumonie.aimadben2004.workers.dev/" }],
    meta: [
      { title: "Détection de Pneumonie par IA : Diagnostic Radiographique | Narimane Amsseli" },
      {
        name: "description",
        content: "Application de diagnostic pneumologique basé sur l'IA pour détecter la pneumonie sur radiographie thoracique. Démonstration technique par Narimane Amsseli.",
      },
      { name: "google-site-verification", content: "_4mssdWLltNkDLAPurbUxq3DmgyZIhqlwsQCqMJ0Erw" },
      { name: "keywords", content: "Narimane Amsseli, pneumonie, radiographie thoracique, x-ray, détection pneumonie, imagerie médicale, diagnostic pulmonaire, portfolio IA" },
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

const infoCards = [
  {
    icon: Brain,
    title: "Modèle DenseNet121",
    desc: "Réseau convolutif pré-entraîné sur ImageNet, affiné sur le dataset Chest X-Ray de Kaggle (5 856 images).",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: BarChart2,
    title: "Haute précision",
    desc: "Optimisé pour minimiser les faux négatifs sur la classification binaire NORMAL / PNEUMONIE.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Clock,
    title: "Analyse rapide",
    desc: "Résultat en quelques secondes via le backend FastAPI. Score de confiance fourni à chaque analyse.",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
  {
    icon: ShieldCheck,
    title: "Confidentialité",
    desc: "Aucune image conservée après l'analyse. Le traitement est effectué à la volée sans stockage.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

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
      setHistory((h) => [
        { name: file.name, prediction: res.prediction, confidence: res.confidence, at: Date.now() },
        ...h,
      ].slice(0, 6));
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

  const isPneumonia = status === "pneumonia";
  const resultColor = isPneumonia ? "#f87171" : "#34d399";

  return (
    <main className="min-h-screen relative overflow-x-hidden flex flex-col">
      {/* Ambient backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, var(--neon) 0%, transparent 60%)" }}
        />
      </div>

      {/* ── HEADER ── */}
      <header className="w-full sticky top-0 z-30 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl glass glow flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-glow block leading-none">
                Narimane DiagnosticPneumo
              </span>
              <p className="text-[11px] text-muted-foreground">Medical Imaging · AI</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground glass px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Système prêt
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="container mx-auto px-6 pt-12 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        {/* LEFT */}
        <div className="space-y-7">
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-primary glass px-3 py-1 rounded-full mb-4">
              <Sparkles className="w-3 h-3" /> Aperçu d'analyse diagnostique
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight tracking-tight">
              Détection de la{" "}
              <span className="text-primary text-glow">pneumonie</span>{" "}
              par radiographie thoracique
            </h1>
            <p className="mt-4 text-muted-foreground max-w-lg text-sm leading-relaxed">
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
                <img src={preview} alt="X-ray preview" className="w-full max-h-72 object-contain rounded-xl" />
                {status === "loading" && (
                  <div className="absolute inset-0 overflow-hidden rounded-xl">
                    <div
                      className="absolute inset-x-0 h-1 bg-primary animate-scan"
                      style={{ boxShadow: "0 0 20px var(--neon)" }}
                    />
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

          {/* Buttons */}
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

          {/* ── RESULT CARD ── */}
          {result && (
            <div
              className="glass rounded-2xl p-6 transition-all duration-500"
              style={{
                border: `1px solid ${isPneumonia ? "rgba(248,113,113,0.4)" : "rgba(52,211,153,0.4)"}`,
                boxShadow: `0 0 32px ${isPneumonia ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)"}`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: isPneumonia ? "rgba(248,113,113,0.15)" : "rgba(52,211,153,0.15)" }}
                >
                  {isPneumonia ? (
                    <AlertTriangle className="w-6 h-6" style={{ color: resultColor }} />
                  ) : (
                    <ShieldCheck className="w-6 h-6" style={{ color: resultColor }} />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Résultat</p>
                  <p className="text-2xl font-bold tracking-tight" style={{ color: resultColor }}>
                    {isPneumonia ? "Pneumonie détectée" : "Normal"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">Confiance</p>
                  <p className="text-2xl font-bold">{result.confidence.toFixed(1)}%</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(result.confidence, 100)}%`,
                    background: resultColor,
                    boxShadow: `0 0 10px ${resultColor}`,
                  }}
                />
              </div>

              {result.mock && (
                <p className="text-[11px] text-muted-foreground mt-3">
                  ⓘ Mode démo — définissez{" "}
                  <code className="text-primary">BACKEND_URL</code> pour activer l'analyse réelle.
                </p>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: 3D lung */}
        <div className="flex items-center justify-center min-h-[400px] glass rounded-3xl p-6 relative">
          <Lung3D status={status} />
          <div className="absolute bottom-4 left-4 right-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isPneumonia ? "#f87171" : status === "normal" ? "#34d399" : "var(--neon)" }}
              />
              {status === "loading"
                ? "Scan en cours…"
                : isPneumonia
                ? "Anomalie détectée"
                : status === "normal"
                ? "Pattern sain"
                : "En attente"}
            </span>
          </div>
        </div>
      </section>

      {/* ── INFO CARDS ── */}
      <section className="container mx-auto px-6 pt-12 pb-16 border-t border-white/5">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold tracking-tight">Comment ça fonctionne</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Un modèle d'apprentissage profond analyse votre radiographie en temps réel et retourne un diagnostic avec score de confiance.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {infoCards.map(({ icon: Icon, title, desc, color, bg }) => (
            <div
              key={title}
              className="glass rounded-2xl p-5 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── METHODOLOGY ── */}
      <section className="container mx-auto px-6 pb-16">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl font-bold">Méthodologie</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            L'algorithme utilise un réseau de neurones convolutifs (CNN) spécialisé dans l'imagerie médicale.
            Il segmente les structures pulmonaires pour identifier les opacités, infiltrats ou consolidations
            caractéristiques d'une pneumonie bactérienne ou virale.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {["Précision: ~94%", "Dataset: Kaggle / ChestXray", "Temps d'analyse: < 2s", "Modèle: DenseNet121"].map((tag) => (
              <span key={tag} className="px-4 py-1.5 glass rounded-full text-xs font-mono text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── HISTORY ── */}
      {history.length > 0 && (
        <section className="container mx-auto px-6 pb-16">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Historique des analyses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((h, i) => (
              <div key={i} className="glass rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{h.name}</p>
                  <p className="text-[11px] text-muted-foreground">{new Date(h.at).toLocaleTimeString("fr-FR")}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold" style={{ color: h.prediction === "PNEUMONIA" ? "#f87171" : "#34d399" }}>
                    {h.prediction === "PNEUMONIA" ? "Pneumonie" : "Normal"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{h.confidence.toFixed(0)}%</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="mt-auto w-full border-t border-white/10 bg-background/50 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row items-center gap-4 text-xs text-muted-foreground justify-between">
          <div className="flex items-start gap-2.5 max-w-2xl">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong className="text-amber-500">Avertissement médical :</strong> Cet outil est une démonstration
              technique basée sur l'intelligence artificielle pour le portfolio de Narimane Amsseli. Il ne fournit
              pas d'avis médical officiel et ne remplace en aucun cas l'examen, le diagnostic ou le conseil d'un
              professionnel de la santé qualifié.
            </p>
          </div>
          <p className="shrink-0">© {new Date().getFullYear()} Narimane Amsseli</p>
        </div>
      </footer>
    </main>
  );
}