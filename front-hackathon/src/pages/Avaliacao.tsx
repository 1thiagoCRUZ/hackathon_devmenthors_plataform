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
  type VotingReportProject,
} from "@/lib/submissions";

function AvaliacaoPage() {
  const [ranking, setRanking] = useState<any[]>([]);
  const [origin, setOrigin] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ranking' | 'report'>('ranking');
  const [report, setReport] = useState<VotingReportProject[]>([]);
  const [reportLoading, setReportLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

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
          setLoading(false);
          return;
        } catch (e) {
          // If JSON parse fails, ignore and fetch
        }
      }
    }

    setLoading(true);
    const f = await getForm('hack-2026');
    if (f) {
      const data = await getRanking(f.id);
      const rankingData = data.ranking || [];
      setRanking(rankingData);
      sessionStorage.setItem(cacheKey, JSON.stringify({ ranking: rankingData }));
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
    const data = await getVotingReport('hack-2026');
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
        </div>

        {activeTab === 'ranking' ? (
          <>
            <h2 className="mb-4 flex items-center justify-between gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className="flex items-center gap-2"><Trophy className="h-4 w-4" /> Ranking</span>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefreshRanking}
                disabled={loading}
                className="gap-1.5"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
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
    </AppLayout>
  );
}

function RankingRow({
  position,
  data,
}: {
  position: number;
  data: any;
}) {
  const medal =
    position === 1
      ? "bg-yellow-400/20 text-yellow-700"
      : position === 2
        ? "bg-zinc-300/30 text-zinc-700"
        : position === 3
          ? "bg-amber-700/20 text-amber-800"
          : "bg-secondary text-muted-foreground";

  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold ${medal}`}
        >
          {position === 1 ? <Crown className="h-5 w-5" /> : position}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-foreground">
            {data.projectName}
          </h3>
          <p className="text-xs text-muted-foreground">
            {data.evaluationsCount}{" "}
            {data.evaluationsCount === 1 ? "avaliação" : "avaliações"}
          </p>
        </div>
        <div className="rounded-xl bg-primary/10 px-4 py-2 text-center">
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
