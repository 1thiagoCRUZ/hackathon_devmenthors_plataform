import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import {
  Gavel,
  Code2,
  CheckCircle2,
  Rocket,
  Sparkles,
  Lock,
  ChevronLeft,
  MessageSquare,
  LogOut,
  ExternalLink,
  Check,
  ChevronRight,
  User,
  Layers
} from "lucide-react";
import logo from "@/assets/devmenthors_LogoColor.png";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  CRITERIA,
  clearAuth,
  loadAuth,
  loadSubmissions,
  saveVote,
  getVotingProgress,
  getForm,
  type AuthUser,
  type CriteriaKey,
  type CriteriaScores,
  type Submission,
  type Role,
  type VotingProgress,
  type FormInfo,
} from "@/lib/submissions";

const emptyScores = (): CriteriaScores => ({
  innovation: -1,
  design: -1,
  execution: -1,
});

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

function VotePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [items, setItems] = useState<Submission[]>([]);
  const [progress, setProgress] = useState<VotingProgress | null>(null);
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [selectedProject, setSelectedProject] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Votação State
  const [currentScores, setCurrentScores] = useState<CriteriaScores>(emptyScores());
  const [currentNotes, setCurrentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData(forceRefresh = false) {
    const u = loadAuth();
    setUser(u);
    if (!u) {
      setIsLoading(false);
      return;
    }

    const cacheKey = `voteData_${u.id}`;

    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setItems(parsed.items);
          setProgress(parsed.progress);
          setFormInfo(parsed.formInfo);
          setIsLoading(false);
          return;
        } catch (e) {
          // If JSON parse fails, ignore and fetch
        }
      }
    }

    setIsLoading(true);
    const [f, s, p] = await Promise.all([
      getForm('hack-2026'),
      loadSubmissions('hack-2026'),
      getVotingProgress('hack-2026')
    ]);

    setFormInfo(f);
    setItems(s);
    setProgress(p);
    sessionStorage.setItem(cacheKey, JSON.stringify({ formInfo: f, items: s, progress: p }));
    setIsLoading(false);
  }

  const votedIds = useMemo(() => new Set(progress?.votedSubmissions.map(s => Number(s.id)) || []), [progress]);

  // Not logged in
  if (!user) {
    return (
      <GateScreen
        title="Faça login para votar"
        description="A votação é exclusiva para jurados e mentores cadastrados."
        cta={
          <Button asChild size="lg" className="gap-2">
            <Link to="/login">
              Entrar <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    );
  }

  if (user && formInfo) {
    if (user.role === "admin" && !formInfo.adminsCanVote) {
      return (
        <GateScreen
          title="Administradores não votam"
          description="A permissão para admins está desativada."
          cta={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/permissoes">
                  Ir para Permissões <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  clearAuth();
                  setUser(null);
                }}
              >
                Sair
              </Button>
            </div>
          }
        />
      );
    }

    if (user.role === "mentor" && !formInfo.isVotePublic) {
      return (
        <GateScreen
          title="Votação Pública Fechada"
          description="Apenas jurados oficiais podem avaliar projetos no momento."
          cta={
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                clearAuth();
                setUser(null);
              }}
            >
              Sair
            </Button>
          }
        />
      );
    }
  }

  const voterType: Role = user.role;

  const setCriterion = (key: CriteriaKey, value: number) => {
    setCurrentScores((prev) => ({ ...prev, [key]: value }));
  };

  const submitVote = async () => {
    if (!selectedProject) return;
    if (!CRITERIA.every((c) => currentScores[c.key] >= 0)) {
      return toast.error("Por favor, preencha as notas de todos os critérios.");
    }

    try {
      setIsSubmitting(true);
      await saveVote({
        submissionId: selectedProject.id,
        innovation: currentScores.innovation,
        design: currentScores.design,
        execution: currentScores.execution,
        notes: currentNotes.trim() || undefined,
      });
      toast.success("Voto registrado com sucesso!");

      // Recarregar os dados para atualizar o dashboard
      await loadData(true);

      // Voltar ao dashboard
      closeDetails();
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar o voto.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDetails = (project: Submission) => {
    setSelectedProject(project);
    setCurrentScores(emptyScores());
    setCurrentNotes("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeDetails = () => {
    setSelectedProject(null);
    setCurrentScores(emptyScores());
    setCurrentNotes("");
  };

  return (
    <Shell
      user={user}
      onLogout={() => {
        clearAuth();
        navigate("/login");
      }}
    >
      <div className="flex flex-1 flex-col">
        {!selectedProject ? (
          // DASHBOARD VIEW
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-8 sm:px-8">
            <header className="mb-10 text-center sm:text-left sm:flex sm:items-end sm:justify-between">
              <div>
                <div
                  className={`mb-3 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${voterType === "juror"
                      ? "border-zinc-800/30 bg-zinc-900 text-white"
                      : "border-primary/20 bg-primary/10 text-primary"
                    }`}
                >
                  {voterType === "juror" ? (
                    <>
                      <Gavel className="h-3.5 w-3.5" /> Jurado
                    </>
                  ) : voterType === "admin" ? (
                    <>
                      <Lock className="h-3.5 w-3.5" /> Admin
                    </>
                  ) : (
                    <>
                      <Code2 className="h-3.5 w-3.5" /> Mentor
                    </>
                  )}
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Dashboard de Votação
                </h1>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  Selecione um projeto para analisar os materiais e dar a sua nota.
                </p>
              </div>

              {progress && (
                <div className="mt-6 sm:mt-0 bg-card border border-border rounded-2xl p-4 flex flex-col items-center sm:items-end min-w-[200px]">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Progresso</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black leading-none text-primary">{progress.votedSubmissions.length}</span>
                    <span className="text-sm font-semibold text-muted-foreground mb-1">/ {progress.totalSubmissions} avaliados</span>
                  </div>
                </div>
              )}
            </header>

            {!items.length && isLoading ? (
              <div className="mt-12 flex flex-col items-center justify-center space-y-4 py-10">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
                <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-wide">
                  Buscando projetos...
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
                {items.map((project) => {
                  const isVoted = votedIds.has(Number(project.id));
                  return (
                    <div
                      key={project.id}
                      onClick={() => openDetails(project)}
                      className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${isVoted ? "bg-green-500/10 text-green-600" : "bg-secondary text-muted-foreground"
                            }`}>
                            {isVoted ? <><CheckCircle2 className="h-3 w-3" /> Avaliado</> : "Pendente"}
                          </div>
                        </div>
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          // DETAIL & VOTING VIEW
          <div className="mx-auto w-full max-w-6xl px-5 pb-20 pt-8 sm:px-8">
            <Button variant="ghost" onClick={closeDetails} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 mr-1" /> Voltar ao Dashboard
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* INFORMAÇÕES DO PROJETO */}
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
                      {selectedProject.representativeEmail ? (
                        <p className="text-sm text-muted-foreground mt-1">Contato: <a className="text-primary hover:underline" href={`mailto:${selectedProject.representativeEmail}`}>{selectedProject.representativeEmail}</a></p>
                      ) : null}
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

                      {/* Render PDFs or embedded documents */}
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

                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-3">Equipe</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.members.map((m, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {/* FORMULÁRIO DE AVALIAÇÃO */}
              <div className="lg:col-span-2">
                <div className="sticky top-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                    <TrophyIcon className="h-5 w-5 text-primary" />
                    Dar Nota
                  </h3>

                  {votedIds.has(Number(selectedProject.id)) ? (
                    <div className="mt-4 flex flex-col items-center justify-center rounded-2xl bg-green-500/10 p-6 text-center text-green-600 border border-green-500/20">
                      <CheckCircle2 className="h-10 w-10 mb-3" />
                      <p className="font-bold">Projeto já avaliado!</p>
                      <p className="mt-1 text-xs text-green-600/80">O seu voto foi registrado com sucesso. Não é possível alterar a nota.</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-6">Analise os materiais e atribua uma nota de 1 a 5 estrelas.</p>

                      <div className="space-y-6">
                        {CRITERIA.map((c) => (
                          <div key={c.key}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-foreground">{c.label}</span>
                              <span className="text-xs font-bold text-muted-foreground bg-secondary px-2 rounded-md">
                                {currentScores[c.key] >= 0 ? `${currentScores[c.key]}/10` : "—"}
                              </span>
                            </div>
                            <ScoreButtons
                              value={currentScores[c.key]}
                              onChange={(v) => setCriterion(c.key, v)}
                            />
                          </div>
                        ))}

                        <div>
                          <label className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" /> Observações
                          </label>
                          <Textarea
                            className="min-h-24 resize-none text-sm"
                            placeholder="Feedback opcional..."
                            value={currentNotes}
                            onChange={(e) => setCurrentNotes(e.target.value)}
                          />
                        </div>

                        <Button
                          onClick={submitVote}
                          disabled={isSubmitting}
                          className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:brightness-110"
                        >
                          {isSubmitting ? "Enviando..." : <><Check className="h-4 w-4" /> Confirmar Avaliação</>}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-auto border-t border-border/60 bg-background/60 py-6 text-center text-xs text-muted-foreground backdrop-blur">
          Hackathon DevMenthors • Unimar
        </footer>
      </div>
    </Shell>
  );
}

function TrophyIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 3 7 6 7s6-1 6-7V2Z" />
    </svg>
  )
}

function Shell({
  user,
  onLogout,
  children,
}: {
  user: AuthUser;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)]">
      <Toaster position="top-center" />
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 pt-6 sm:px-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <img src={logo} alt="DevMenthors" className="h-6 w-auto" />
          DevMenthors
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-bold text-foreground">{user.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {user.role === "juror"
                ? "Jurado"
                : user.role === "mentor"
                  ? "Mentor"
                  : "Admin"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            aria-label="Sair"
            className="text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
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

function ScoreButtons({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 mt-2">
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
        const isSelected = value === n;
        return (
          <button
            key={n}
            type="button"
            aria-label={`Nota ${n}`}
            onClick={() => onChange(n)}
            className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold transition-all ${isSelected
                ? "border-primary bg-primary text-primary-foreground shadow-md scale-110 z-10"
                : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-secondary/80"
              }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

export default function Vote() {
  return <VotePage />;
}
