import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Rocket,
  Sparkles,
  ChevronLeft,
  Bot,
  User,
  Layers,
  ExternalLink,
  Code,
  Globe,
  PenTool,
  Presentation,
  Paperclip,
  ArrowRight,
  Lock,
  ChevronRight,
  LogOut,
} from "lucide-react";
import logo from "@/assets/devmenthors_LogoColor.png";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import {
  loadSubmissions,
  loadAuth,
  clearAuth,
  type Submission,
  type AuthUser,
} from "@/lib/submissions";

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M2.5 7.1C2.3 8.3 2 10.5 2 12s.3 3.7.5 4.9A2.5 2.5 0 0 0 5.1 19c2.1.2 5.1.3 6.9.3s4.8-.1 6.9-.3a2.5 2.5 0 0 0 2.6-2.1c.2-1.2.5-3.4.5-4.9s-.3-3.7-.5-4.9A2.5 2.5 0 0 0 18.9 5c-2.1-.2-5.1-.3-6.9-.3s-4.8.1-6.9.3A2.5 2.5 0 0 0 2.5 7.1Z" />
    <path d="m10 15 5-3-5-3v6Z" />
  </svg>
);

function parseVideoUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) {
      let videoId = "";
      if (parsed.hostname.includes("youtu.be")) {
        videoId = parsed.pathname.slice(1);
      } else {
        videoId = parsed.searchParams.get("v") || "";
      }
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const videoId = parts[parts.length - 1];
      if (videoId && !isNaN(Number(videoId))) return `https://player.vimeo.com/video/${videoId}`;
    }
    return null;
  } catch {
    return null;
  }
}

function GateScreen({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)] px-5">
      <Toaster position="top-center" />
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex justify-center">{cta}</div>
      </div>
    </div>
  );
}

export default function ProjetosPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [selectedProject, setSelectedProject] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const u = loadAuth();
    setUser(u);
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const s = await loadSubmissions('hackhealth');
    setItems(s);
    setIsLoading(false);
  }

  const openDetails = (project: Submission) => {
    setSelectedProject(project);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeDetails = () => {
    setSelectedProject(null);
  };

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  if (!user) {
    return (
      <GateScreen
        title="Acesso Restrito"
        description="A visualização dos projetos é exclusiva para jurados e administradores cadastrados."
        cta={
          <Button asChild size="lg" className="gap-2">
            <Link to="/login">
              Fazer Login <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    );
  }

  if (user.role !== "juror" && user.role !== "admin") {
    return (
      <GateScreen
        title="Permissão Insuficiente"
        description="A sua conta não tem permissão para visualizar a galeria de projetos."
        cta={
          <Button asChild size="lg" className="gap-2">
            <Link to="/">
              Voltar ao Início <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)]">
      <Toaster position="top-center" />
      
      {/* HEADER */}
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8 border-b border-border/40 pb-5">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <img src={logo} alt="DevMenthors" className="h-6 w-auto" />
          DevMenthors
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-foreground">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {user.role === "juror" ? "Jurado" : "Admin"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Sair"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 flex-col">
        {!selectedProject ? (
          // LIST VIEW
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8">
            <header className="mb-10 text-center sm:text-left">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Projetos Entregues
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Galeria de Soluções
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Explore os projetos desenvolvidos durante o Hackathon DevMenthors.
              </p>
            </header>

            {isLoading ? (
              <div className="mt-12 flex flex-col items-center justify-center space-y-4 py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
                  Carregando projetos...
                </p>
              </div>
            ) : items.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
                <Sparkles className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Nenhum projeto foi entregue ainda. Volte mais tarde.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => openDetails(project)}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                  >
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                        {project.projectName}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <User className="h-4 w-4" /> {project.members.length} membros
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Layers className="h-4 w-4" /> {project.materials.length} links
                      </div>
                    </div>
                    {project.usedAI && (
                      <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-violet-600">
                        <Bot className="h-3.5 w-3.5" />
                        Utilizou IA no desenvolvimento
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // DETAIL VIEW
          <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
            <Button variant="ghost" onClick={closeDetails} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar à Galeria
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* INFORMATION COLUMN */}
              <div className="lg:col-span-3 space-y-8">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Rocket className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{selectedProject.projectName}</h2>
                      {(() => {
                        const date = new Date(selectedProject.createdAt);
                        return Number.isFinite(date.getTime()) ? (
                          <p className="text-sm text-muted-foreground">Entregue em {date.toLocaleDateString('pt-BR')}</p>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-2">A Solução</h3>
                  <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                    {selectedProject.description}
                  </p>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-3">Links e Materiais</h3>
                  {selectedProject.materials.length > 0 ? (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-wrap gap-3">
                        {(() => {
                          const linkMaterials = selectedProject.materials.filter((m) => {
                            if (!m.url) return false;
                            const isVideo = !!parseVideoUrl(m.url);
                            const isPdf = /\.pdf(\?|$)/i.test(m.url) || (m.name && m.name.toLowerCase().endsWith('.pdf'));
                            return !isVideo && !isPdf;
                          });

                          return linkMaterials.map((m, i) => {
                            let hostname = "Link";
                            try { hostname = new URL(m.url).hostname.replace('www.', ''); } catch (e) { }
                            return (
                              <a
                                key={i}
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium hover:bg-secondary hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-4 w-4" /> {hostname}
                              </a>
                            );
                          });
                        })()}
                      </div>

                      {selectedProject.materials.map((m, i) => {
                        const embedUrl = parseVideoUrl(m.url);
                        if (!embedUrl) return null;
                        return (
                          <div key={`video-${i}`} className="w-full overflow-hidden rounded-xl border border-border shadow-sm aspect-video bg-black/5">
                            <iframe
                              src={embedUrl}
                              title="Video Player"
                              className="w-full h-full border-0"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          </div>
                        );
                      })}

                      {selectedProject.materials.map((m, i) => {
                        const isPdf = m.url && (/\.pdf(\?|$)/i.test(m.url) || (m.name && m.name.toLowerCase().endsWith('.pdf')));
                        if (!isPdf) return null;
                        return (
                          <div key={`pdf-${i}`} className="w-full overflow-hidden rounded-3xl border border-border shadow-sm bg-card">
                            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{m.name || 'Documento PDF'}</p>
                                <p className="text-xs text-muted-foreground">Clique para abrir em nova aba ou role para visualizar abaixo.</p>
                              </div>
                              <a
                                href={m.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full border border-border bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
                              >
                                Abrir em nova aba
                              </a>
                            </div>
                            <div className="overflow-hidden rounded-b-3xl border-t border-border bg-white">
                              <iframe src={m.url} title={`Documento-${i}`} className="w-full h-[640px] border-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">Nenhum material anexado.</p>
                  )}
                </section>
              </div>

              {/* DETAILS SIDEBAR */}
              <div className="lg:col-span-2 space-y-6">
                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4">Membros da Equipe</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.members.map((m, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-foreground">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-violet-500" />
                    Inteligência Artificial
                  </h3>
                  {selectedProject.usedAI ? (
                    <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4 space-y-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 px-3 py-1 text-xs font-bold text-violet-600">
                        IA utilizada no desenvolvimento
                      </span>
                      {selectedProject.aiDescription && (
                        <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pt-1">
                          {selectedProject.aiDescription}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                      <span className="text-sm text-muted-foreground">Equipe declarou não ter utilizado IA no desenvolvimento.</span>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-auto border-t border-border/60 bg-background/60 py-6 text-center text-xs text-muted-foreground backdrop-blur">
          Hackathon DevMenthors • Unimar
        </footer>
      </div>
    </div>
  );
}
