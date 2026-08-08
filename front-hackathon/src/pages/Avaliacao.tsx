import { useEffect, useState } from "react";
import {
  Trophy,
  QrCode,
  Gavel,
  Star,
  Crown,
  Inbox,
  Link2,
  Copy,
  Check,
  RefreshCw,
  Users,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Mail,
  Send,
  Loader2,
  Presentation,
  User,
  Layers,
  Bot,
  Rocket,
  ExternalLink,
  ChevronLeft,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { QRCodeModal } from "@/components/QRCodeModal";
import {
  getForm,
  getRanking,
  getVotingReport,
  loadAuth,
  sendWinnerEmail,
  loadSubmissions,
  type VotingReportProject,
  type Submission,
} from "@/lib/submissions";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { sendTestWinnerEmail } from "@/lib/submissions";

function AvaliacaoPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [origin, setOrigin] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'report' | 'presentation'>('ranking');
  const [report, setReport] = useState<VotingReportProject[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedPresentationProject, setSelectedPresentationProject] = useState<Submission | null>(null);
  const [sendingWinnerId, setSendingWinnerId] = useState<number | string | null>(null);

  const [isRevealMode, setIsRevealMode] = useState(false);
  const [revealStep, setRevealStep] = useState(3); // 3 -> 3rd place, 2 -> 2nd place, 1 -> 1st place
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const startReveal = (step: number) => {
    setIsRevealMode(true);
    setRevealStep(step);
    setCountdown(5);
  };

  const nextReveal = (nextStep: number) => {
    setRevealStep(nextStep);
    setCountdown(5);
  };

  const authUser = loadAuth();
  const isAdmin = authUser?.role === 'admin';

  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [sendingTest, setSendingTest] = useState(false);

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) {
      toast.error("Por favor, digite um e-mail válido.");
      return;
    }
    setSendingTest(true);
    try {
      const result = await sendTestWinnerEmail(testEmailAddress.trim());
      setTestEmailDialogOpen(false);
      if (result.testPreviewUrl) {
        toast.success(`E-mail de teste disparado para ${testEmailAddress}!`, {
          description: `Visualização disponível no Ethereal Mail.`,
          action: {
            label: "Ver E-mail",
            onClick: () => window.open(result.testPreviewUrl, "_blank"),
          },
          duration: 10000,
        });
      } else {
        toast.success(`E-mail de teste disparado com sucesso para ${testEmailAddress}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao disparar e-mail de teste.");
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendWinnerEmail = async (submissionId: number | string, position: number, projectName: string) => {
    setSendingWinnerId(submissionId);
    try {
      const result = await sendWinnerEmail(submissionId, position);
      const posLabel = position === 1 ? '1º lugar (Campeão)' : `${position}º lugar`;
      if (result.testPreviewUrl) {
        toast.success(`E-mail de ${posLabel} enviado (${projectName})!`, {
          description: `Visualização disponível no Ethereal Mail.`,
          action: {
            label: "Ver E-mail",
            onClick: () => window.open(result.testPreviewUrl, "_blank"),
          },
          duration: 10000,
        });
      } else {
        toast.success(`E-mail oficial de ${posLabel} enviado para a equipe do projeto ${projectName}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar e-mail para o vencedor.");
    } finally {
      setSendingWinnerId(null);
    }
  };

  useEffect(() => {
    loadData();
    loadVotingReport();
    setOrigin(window.location.origin);
  }, []);

  async function loadData(forceRefresh = false) {
    const cacheKey = 'avaliacaoData';
    
    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setRanking(parsed.ranking || []);
          setSubmissions(parsed.submissions || []);
          setLoading(false);
          return;
        } catch (e) {
          // If JSON parse fails, ignore and fetch
        }
      }
    }

    setLoading(true);
    const f = await getForm('hackhealth');
    if (f) {
      const [data, subs] = await Promise.all([
        getRanking(f.id),
        loadSubmissions('hackhealth')
      ]);
      const rankingData = data.ranking || [];
      setRanking(rankingData);
      setSubmissions(subs || []);
      sessionStorage.setItem(cacheKey, JSON.stringify({ ranking: rankingData, submissions: subs || [] }));
    }
    setLoading(false);
  }

  async function loadVotingReport(forceRefresh = false) {
    const cacheKey = 'avaliacaoReport';

    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setReport(parsed.report || []);
          setReportLoading(false);
          return;
        } catch (e) {
          // Ignore invalid cache and fetch fresh data
        }
      }
    }

    setReportLoading(true);
    const data = await getVotingReport('hackhealth');
    setReport(data);
    if (selectedProjectId === null && data.length > 0) {
      setSelectedProjectId(data[0].id);
    }
    sessionStorage.setItem(cacheKey, JSON.stringify({ report: data }));
    setReportLoading(false);
  }

  const voteUrl = origin ? `${origin}/vote` : "";

  const handleRefreshRanking = async () => {
    await loadData(true);
    toast.success("Ranking atualizado!");
  };

  const handleRefreshReport = async () => {
    await loadVotingReport(true);
    toast.success("Relatório atualizado!");
  };

  const selectedProject = report.find((project) => project.id === selectedProjectId) || null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(voteUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <AppLayout>
      {isRevealMode && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-zinc-950 text-white animate-in fade-in zoom-in-95 duration-700">
          <div className="max-w-4xl w-full px-8 text-center">
            {countdown !== null ? (
              <div className="flex flex-col items-center justify-center animate-in zoom-in-50 duration-300">
                <span className="text-[200px] font-black text-white leading-none drop-shadow-2xl animate-pulse">
                  {countdown}
                </span>
              </div>
            ) : revealStep === 0 ? (
               <div key="fim" className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-1000 fill-mode-both">
                  <div className="flex justify-center mb-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                      <Trophy className="h-12 w-12" />
                    </div>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                    Obrigado!
                  </h1>
                  <p className="mt-6 text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
                    Parabéns a todos os participantes e vencedores pelo excelente trabalho desenvolvido.
                  </p>
               </div>
            ) : (() => {
              const rankItem = ranking[revealStep - 1];
              if (!rankItem) return <div className="text-2xl font-bold text-white/50">Fim da Apresentação</div>;
              
              const projectDetails = submissions.find(s => Number(s.id) === Number(rankItem.id));
              const posText = revealStep === 1 ? "1º LUGAR - CAMPEÃO" : `${revealStep}º LUGAR`;
              const posColor = revealStep === 1 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/10 shadow-[0_0_30px_rgba(250,204,21,0.2)]" : revealStep === 2 ? "text-zinc-300 border-zinc-300/30 bg-zinc-300/10" : "text-amber-600 border-amber-600/30 bg-amber-600/10";
              
              return (
                <div key={revealStep} className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-1000 fill-mode-both">
                  <div className={`inline-block rounded-full px-8 py-2.5 backdrop-blur-md border ${posColor} mb-6 transition-all`}>
                    <h2 className="text-2xl md:text-3xl font-black uppercase tracking-[0.25em]">
                      {posText}
                    </h2>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-black text-white leading-tight drop-shadow-2xl">
                    {projectDetails?.projectName || rankItem.projectName}
                  </h1>
                  
                  {projectDetails && projectDetails.members && projectDetails.members.length > 0 && (
                     <div className="mt-8 flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                        {projectDetails.members.map((m: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/20">
                             <User className="h-4 w-4 text-white/70" />
                             <span className="text-sm font-medium text-white/90">{m.name}</span>
                          </div>
                        ))}
                     </div>
                  )}
                  
                  {projectDetails?.description && (
                    <p className="mt-10 text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed line-clamp-4">
                      {projectDetails.description}
                    </p>
                  )}
                </div>
              );
            })()}
          </div>
          
          <div className="absolute bottom-10 flex gap-4 w-full justify-center px-10">
            <div className="flex-1"></div>
            <div className="flex gap-4 items-center">
              {revealStep === 0 ? (
                <Button size="lg" className="bg-white text-zinc-950 hover:bg-zinc-200 font-bold text-base px-8 h-12" onClick={() => setIsRevealMode(false)}>
                  Fechar Tela Cheia <XCircle className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10" onClick={() => setIsRevealMode(false)}>
                     Sair da Tela Cheia
                  </Button>
                  {revealStep < 3 && (
                    <Button variant="ghost" className="border border-white/20 text-white hover:bg-white/10 hover:text-white h-12 px-6" onClick={() => setRevealStep(prev => prev + 1)}>
                      Anterior
                    </Button>
                  )}
                  {revealStep > 1 ? (
                    <Button size="lg" className="bg-white text-zinc-950 hover:bg-white/90 font-bold text-base px-8 h-12" onClick={() => nextReveal(revealStep - 1)} disabled={countdown !== null}>
                      Revelar Próximo <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  ) : (
                    <Button size="lg" className="bg-yellow-400 text-yellow-950 hover:bg-yellow-500 font-bold text-base px-8 h-12" onClick={() => setRevealStep(0)} disabled={countdown !== null}>
                      Finalizar Apresentação <Check className="ml-2 h-5 w-5" />
                    </Button>
                  )}
                </>
              )}
            </div>
            <div className="flex-1"></div>
          </div>
        </div>
      )}
      <Toaster position="top-right" />
      <PageHeader
        title="Avaliação & Votos"
        subtitle="Jurados (peso 70%) e mentores (peso 30%) avaliam os projetos pelos 3 critérios."
        actions={
          <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold">
            Ranking ao vivo
          </Badge>
        }
      />

      <main className="w-full px-6 py-8 sm:px-10">
        {/* QR Code section — único para todos */}
        <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white">
                <QrCode className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-foreground">
                  Página única de votação
                </h3>
                <p className="mt-0.5 max-w-xl text-xs text-muted-foreground">
                  Compartilhe este QR Code com jurados e mentores. Cada um faz
                  login com sua conta para registrar os votos nos 3 critérios.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="flex flex-1 items-center gap-2 truncate rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-muted-foreground sm:min-w-72">
                    <Link2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{voteUrl || "—"}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copy}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => setQrOpen(true)}
              className="gap-2 bg-zinc-900 text-white hover:bg-zinc-800"
            >
              <QrCode className="h-4 w-4" /> Exibir QR no telão
            </Button>
          </div>
        </section>

        <div className="mb-6 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={activeTab === 'ranking' ? 'secondary' : 'outline'}
            onClick={() => setActiveTab('ranking')}
          >
            Ranking
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'report' ? 'secondary' : 'outline'}
            onClick={() => setActiveTab('report')}
          >
            Relatório de Engajamento
          </Button>
          <Button
            size="sm"
            variant={activeTab === 'presentation' ? 'secondary' : 'outline'}
            onClick={() => {
              setActiveTab('presentation');
              setSelectedPresentationProject(null);
            }}
          >
            Apresentação Top 3
          </Button>
        </div>

        {activeTab === 'presentation' ? (
          <div className="space-y-6">
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
                <Presentation className="h-4 w-4" /> Apresentação Top 3
              </h2>
              <Button onClick={() => startReveal(3)} className="gap-2 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/25 hover:brightness-110">
                <Play className="h-4 w-4 fill-current" /> Iniciar Revelação Tela Cheia
              </Button>
            </div>

            {selectedPresentationProject ? (
              // DETAIL VIEW FOR TOP 3
              <div className="mx-auto w-full max-w-5xl pb-10">
                <Button variant="ghost" onClick={() => setSelectedPresentationProject(null)} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Voltar aos Top 3
                </Button>

                <div className="space-y-8">
                  <section className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Rocket className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{selectedPresentationProject.projectName}</h2>
                        {(() => {
                          const date = new Date(selectedPresentationProject.createdAt);
                          return Number.isFinite(date.getTime()) ? (
                            <p className="text-sm text-muted-foreground">Entregue em {date.toLocaleDateString('pt-BR')}</p>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-2">A Solução</h3>
                    <p className="text-base leading-relaxed text-foreground whitespace-pre-wrap">
                      {selectedPresentationProject.description}
                    </p>

                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-8 mb-3">Links e Materiais</h3>
                    {selectedPresentationProject.materials.length > 0 ? (
                      <div className="flex flex-col gap-5">
                        <div className="flex flex-wrap gap-3">
                          {(() => {
                            const linkMaterials = selectedPresentationProject.materials.filter((m: any) => {
                              if (!m.url) return false;
                              const isVideo = !!parseVideoUrl(m.url);
                              const isPdf = /\.pdf(\?|$)/i.test(m.url) || (m.name && m.name.toLowerCase().endsWith('.pdf'));
                              return !isVideo && !isPdf;
                            });

                            return linkMaterials.map((m: any, i: number) => {
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

                        {selectedPresentationProject.materials.map((m: any, i: number) => {
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
                        {selectedPresentationProject.materials.map((m: any, i: number) => {
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
                      {selectedPresentationProject.members.map((m: any, i: number) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm font-medium text-foreground">
                          {m.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-8">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        Uso de Inteligência Artificial
                      </h3>
                      {selectedPresentationProject.usedAI ? (
                        <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/15 border border-violet-500/25 px-3 py-1 text-xs font-bold text-violet-600">
                              <Bot className="h-3.5 w-3.5" />
                              IA utilizada no desenvolvimento
                            </span>
                          </div>
                          {selectedPresentationProject.aiDescription && (
                            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pt-1">
                              {selectedPresentationProject.aiDescription}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                          <span className="text-sm text-muted-foreground">Equipe declarou <strong>não ter utilizado</strong> IA no desenvolvimento.</span>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            ) : (
              // CARDS LIST (Top 3)
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {ranking.slice(0, 3).map((rankItem, idx) => {
                  const projectDetails = submissions.find(s => Number(s.id) === Number(rankItem.id));
                  if (!projectDetails) return null;
                  
                  return (
                    <div
                      key={rankItem.id}
                      onClick={() => setSelectedPresentationProject(projectDetails)}
                      className="group relative flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${idx === 0 ? "bg-yellow-400/20 text-yellow-700" : idx === 1 ? "bg-zinc-300/30 text-zinc-700" : "bg-amber-700/20 text-amber-800"}`}>
                            {idx === 0 ? <><Crown className="h-3 w-3" /> 1º Lugar</> : idx === 1 ? "2º Lugar" : "3º Lugar"}
                          </div>
                          
                          <div className="text-xs font-bold text-primary flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md">
                            <Star className="h-3 w-3 fill-primary" /> {rankItem.averageScore.toFixed(2)}
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                          {projectDetails.projectName}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {projectDetails.description}
                        </p>
                      </div>
                      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-4 w-4" /> {projectDetails.members.length} membros
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Layers className="h-4 w-4" /> {projectDetails.materials.length} links
                        </div>
                      </div>
                      {projectDetails.usedAI && (
                        <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 px-2.5 py-1.5 text-[11px] font-semibold text-violet-600">
                          <Bot className="h-3.5 w-3.5" />
                          Utilizou IA
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === 'ranking' ? (
          <>
            <h2 className="mb-4 flex items-center justify-between gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Ranking</span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setTestEmailAddress(authUser?.email || "");
                      setTestEmailDialogOpen(true);
                    }}
                    className="gap-1.5 border-indigo-500/20 text-indigo-600 hover:bg-indigo-500/5 hover:text-indigo-700 font-semibold"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Enviar E-mail de Teste
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefreshRanking}
                  disabled={loading}
                  className="gap-1.5 font-semibold"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              </div>
            </h2>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-3"></div>
                Carregando ranking...
              </div>
            ) : ranking.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Sem projetos para avaliar
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Quando as avaliações começarem, elas aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {ranking.map((row, idx) => (
                  <RankingRow
                    key={row.id}
                    position={idx + 1}
                    data={row}
                    isAdmin={isAdmin}
                    onSendWinnerEmail={handleSendWinnerEmail}
                    sendingId={sendingWinnerId}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="mb-4 flex items-center justify-between gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex items-center gap-2"><Gavel className="h-4 w-4" /> Relatório de Engajamento</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshReport}
                disabled={reportLoading}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${reportLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </h2>

            {reportLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-3"></div>
                Carregando relatório...
              </div>
            ) : report.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  Nenhum relatório disponível
                </h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Não há projetos processados ou nenhuma avaliação registrada ainda.
                </p>
              </div>
            ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Projetos entregues
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-foreground">
                          {report.length}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Selecione um projeto para ver quem já votou e quem está pendente.
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Total votaram
                      </p>
                      <p className="mt-3 text-3xl font-bold text-foreground">
                        {selectedProject ? selectedProject.votedByJudges.length + selectedProject.votedByMentors.length : 0}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Total pendentes
                      </p>
                      <p className="mt-3 text-3xl font-bold text-foreground">
                        {selectedProject ? selectedProject.pendingJudges.length + selectedProject.pendingMentors.length : 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Projetos
                  </p>
                  <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                    {report.map((project) => {
                      const isSelected = selectedProjectId === project.id;
                      return (
                        <button
                          key={project.id}
                          type="button"
                          onClick={() => setSelectedProjectId(project.id)}
                          className={`w-full rounded-3xl border p-4 text-left transition ${isSelected ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/70'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{project.projectName}</h4>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {project.votedByJudges.length + project.votedByMentors.length} votaram · {project.pendingJudges.length + project.pendingMentors.length} pendentes
                              </p>
                            </div>
                            <ChevronRight className={`h-4 w-4 transition ${isSelected ? 'rotate-90 text-primary' : 'text-muted-foreground'}`} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {selectedProject ? (
                <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Projeto selecionado
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-foreground">
                        {selectedProject.projectName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Veja os detalhes por tipo de avaliador e cobre quem está pendente.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-border bg-secondary/70 px-4 py-2 text-sm text-muted-foreground">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                      <span>{selectedProject.votedByJudges.length + selectedProject.votedByMentors.length} votaram</span>
                    </div>
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-3xl border border-border bg-background p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Jurados que votaram</p>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedProject.votedByJudges.length} de jurados</p>
                        </div>
                      </div>
                      {selectedProject.votedByJudges.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum jurado registrou voto ainda.</p>
                      ) : (
                        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {selectedProject.votedByJudges.map((judge) => (
                            <li key={judge.id} className="rounded-2xl border border-border bg-card p-3">
                              <p className="font-semibold text-foreground">{judge.name}</p>
                              <p className="text-sm text-muted-foreground">{judge.email}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-3xl border border-border bg-background p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-700">
                          <XCircle className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Jurados pendentes</p>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedProject.pendingJudges.length} ainda não votaram</p>
                        </div>
                      </div>
                      {selectedProject.pendingJudges.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Todos os jurados já votaram.</p>
                      ) : (
                        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {selectedProject.pendingJudges.map((judge) => (
                            <li key={judge.id} className="rounded-2xl border border-border bg-card p-3">
                              <p className="font-semibold text-foreground">{judge.name}</p>
                              <p className="text-sm text-muted-foreground">{judge.email}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-3xl border border-border bg-background p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
                          <CheckCircle2 className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mentores que votaram</p>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedProject.votedByMentors.length} de mentores</p>
                        </div>
                      </div>
                      {selectedProject.votedByMentors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum mentor registrou voto ainda.</p>
                      ) : (
                        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {selectedProject.votedByMentors.map((mentor) => (
                            <li key={mentor.id} className="rounded-2xl border border-border bg-card p-3">
                              <p className="font-semibold text-foreground">{mentor.name}</p>
                              <p className="text-sm text-muted-foreground">{mentor.email}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-3xl border border-border bg-background p-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10 text-red-700">
                          <XCircle className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mentores pendentes</p>
                          <p className="mt-1 text-sm text-muted-foreground">{selectedProject.pendingMentors.length} ainda não votaram</p>
                        </div>
                      </div>
                      {selectedProject.pendingMentors.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Todos os mentores já votaram.</p>
                      ) : (
                        <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                          {selectedProject.pendingMentors.map((mentor) => (
                            <li key={mentor.id} className="rounded-2xl border border-border bg-card p-3">
                              <p className="font-semibold text-foreground">{mentor.name}</p>
                              <p className="text-sm text-muted-foreground">{mentor.email}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </section>
              ) : (
                <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
                  <p className="text-sm font-semibold text-foreground">Selecione um projeto para ver os detalhes.</p>
                  <p className="mt-2 text-sm">Clique em um card do lado direito para carregar o relatório por projeto.</p>
                </div>
              )}
            </div>
          )}
          </>
        )}
      </main>

      <QRCodeModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        url={voteUrl}
        title="Vote nos projetos"
        subtitle="Jurados e mentores — faça login e avalie os 3 critérios."
      />

      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 bg-card border-border">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-2 text-indigo-500 font-bold text-xs uppercase tracking-wider">
              <Mail className="h-4 w-4" />
              <span>Enviar E-mail de Teste</span>
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Testar Layout do E-mail
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Digite o e-mail de destino para receber uma simulação real da mensagem que os 3 primeiros colocados vão receber.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              E-mail de Destino
            </label>
            <Input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="exemplo@gmail.com"
              className="text-sm bg-background border-border focus:ring-primary rounded-xl px-3 py-2 h-10"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(false)}
              disabled={sendingTest}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailAddress.trim()}
              className="rounded-xl bg-primary text-primary-foreground gap-2 font-semibold"
            >
              {sendingTest ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Disparar Teste
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function RankingRow({
  position,
  data,
  isAdmin,
  onSendWinnerEmail,
  sendingId,
}: {
  position: number;
  data: any;
  isAdmin: boolean;
  onSendWinnerEmail: (submissionId: number | string, position: number, projectName: string) => void;
  sendingId: number | string | null;
}) {
  const medal =
    position === 1
      ? "bg-yellow-400/20 text-yellow-700"
      : position === 2
        ? "bg-zinc-300/30 text-zinc-700"
        : position === 3
          ? "bg-amber-700/20 text-amber-800"
          : "bg-secondary text-muted-foreground";

  const isSending = sendingId === data.id;

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${medal}`}
        >
          {position === 1 ? <Crown className="h-5 w-5" /> : position}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-foreground">
              {data.projectName}
            </h3>
            {position <= 3 && (
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 font-bold text-[10px]">
                {position === 1 ? "1º Lugar" : position === 2 ? "2º Lugar" : "3º Lugar"}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {data.evaluationsCount}{" "}
            {data.evaluationsCount === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>

        {isAdmin && position <= 3 && (
          <Button
            size="sm"
            variant="outline"
            disabled={sendingId !== null}
            onClick={() => onSendWinnerEmail(data.id, position, data.projectName)}
            className="border-indigo-500/20 hover:border-indigo-500/40 text-indigo-500 hover:text-indigo-600 bg-indigo-500/5 hover:bg-indigo-500/10 gap-1.5 text-xs font-semibold h-9 px-3 shrink-0"
          >
            {isSending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Notificar Vencedor
              </>
            )}
          </Button>
        )}

        <div className="rounded-xl bg-primary/10 px-4 py-2 text-center shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Nota Final
          </p>
          <p className="mt-0.5 flex items-center justify-center gap-1 text-2xl font-extrabold text-primary">
            <Star className="h-5 w-5 fill-current" />
            {data.averageScore.toFixed(2)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function Avaliacao() {
  return <AvaliacaoPage />;
}
