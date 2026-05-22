import { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  ExternalLink,
  Trash2,
  Inbox,
  Code,
  Globe,
  PenTool,
  Presentation,
  Paperclip,
  Search,
  FolderKanban,
  Lock,
  Unlock,
  Copy,
  Check,
  Link2,
  QrCode,
  type LucideIcon,
} from "lucide-react";
import { QRCodeModal } from "@/components/QRCodeModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import {
  deleteSubmission,
  getForm,
  loadSubmissions,
  toggleFormStatus,
  type FormInfo,
  type MaterialType,
  type Submission,
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

export const TYPE_META: Record<MaterialType, { label: string; icon: LucideIcon | React.FC<any> }> = {
  github: { label: "GitHub", icon: Code },
  deploy: { label: "Deploy", icon: Globe },
  video: { label: "Vídeo", icon: YoutubeIcon },
  figma: { label: "Figma", icon: PenTool },
  slides: { label: "Slides", icon: Presentation },
  other: { label: "Outro", icon: Paperclip },
};

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "?";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

function AdminPage() {
  const [items, setItems] = useState<Submission[]>([]);
  const [query, setQuery] = useState("");
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");
  const [qrOpen, setQrOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formInfo?.slug) {
      setPublicUrl(`${window.location.origin}/${formInfo.slug}`);
    } else {
      setPublicUrl(`${window.location.origin}/`);
    }
  }, [formInfo]);

  async function loadData(forceRefresh = false) {
    const cacheKey = 'adminData';
    
    if (!forceRefresh) {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setFormInfo(parsed.formInfo);
          setItems(parsed.items);
          setLoading(false);
          return;
        } catch (e) {
          // If JSON parse fails, ignore and fetch
        }
      }
    }

    setLoading(true);
    const [f, s] = await Promise.all([
      getForm('hack-2026'),
      loadSubmissions('hack-2026')
    ]);
    
    setFormInfo(f);
    setItems(s);
    sessionStorage.setItem(cacheKey, JSON.stringify({ formInfo: f, items: s }));
    setLoading(false);
  }

  const filtered = items.filter((s) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      s.projectName.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.members.some((m) => m.name.toLowerCase().includes(q))
    );
  });

  const handleDelete = async (id: string) => {
    await deleteSubmission(id);
    setItems((all) => all.filter((s) => s.id !== id));
    toast.success("Projeto removido.");
    // Clear cache so next load gets fresh data
    sessionStorage.removeItem('adminData');
  };

  const handleToggleStatus = async (field: keyof FormInfo, value: boolean) => {
    if (!formInfo) return;
    try {
      await toggleFormStatus(formInfo.id, { [field]: value });
      setFormInfo((prev) => prev ? { ...prev, [field]: value } : null);
      if (field === "isOpen") {
        toast.success(value ? "Formulário aberto para entregas." : "Formulário fechado.");
      } else if (field === "isVotePublic") {
        toast.success(value ? "Votação pública (Devs) ativada." : "Votação pública (Devs) desativada.");
      } else if (field === "adminsCanVote") {
        toast.success(value ? "Admins podem votar." : "Admins bloqueados de votar.");
      }
      // Clear cache so next load gets fresh data
      sessionStorage.removeItem('adminData');
    } catch {
      toast.error("Erro ao alterar status.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <PageHeader
        title="Projetos Entregues"
        subtitle="Acompanhe entregas e gerencie o formulário público."
        actions={
          <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold">
            {items.length} {items.length === 1 ? "entrega" : "entregas"}
          </Badge>
        }
      />

      <main className="w-full px-6 py-8 sm:px-10">
        <div className="mb-6 grid gap-4 lg:grid-cols-2">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-2"></div>
                Carregando formulário...
              </div>
            ) : !formInfo ? (
              <div className="flex flex-col items-center justify-center py-2 text-center">
                <h3 className="text-sm font-semibold text-foreground">
                  Nenhum formulário ativo
                </h3>
                <p className="mt-1 mb-4 text-xs text-muted-foreground">
                  Não foi encontrado um form com o slug esperado.
                </p>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      formInfo.isOpen
                        ? "bg-primary/10 text-primary"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {formInfo.isOpen ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Entregas {formInfo.isOpen ? "abertas" : "fechadas"}
                    </h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formInfo.isOpen
                        ? "Equipes podem enviar projetos pelo link público."
                        : "Visitantes verão uma mensagem de encerramento."}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formInfo.isOpen}
                  onCheckedChange={(v) => handleToggleStatus("isOpen", v)}
                  aria-label="Abrir ou fechar formulário"
                />
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Link2 className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-foreground">
                  Link público do formulário
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Compartilhe com as equipes participantes.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 truncate rounded-lg border border-border bg-secondary/60 px-3 py-2 font-mono text-xs text-foreground">
                    {publicUrl || "—"}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={copyLink}
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
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    asChild
                    className="gap-1.5"
                  >
                    <a href={publicUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" /> Abrir
                    </a>
                  </Button>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setQrOpen(true)}
                  className="mt-3 w-full gap-1.5 bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  <QrCode className="h-3.5 w-3.5" /> Exibir QR Code na tela
                </Button>
              </div>
            </div>
          </section>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por projeto, integrante ou descrição..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            Buscando projetos e informações do formulário...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState hasItems={items.length > 0} />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((s) => (
              <ProjectCard key={s.id} submission={s} />
            ))}
          </div>
        )}
      </main>
      <QRCodeModal
        open={qrOpen}
        onOpenChange={setQrOpen}
        url={publicUrl}
        title="Entrega de projetos"
        subtitle="Equipes do hackathon — aponte a câmera para enviar seu projeto."
      />
    </AppLayout>
  );
}

function ProjectCard({
  submission,
}: {
  submission: Submission;
}) {
  return (
    <article className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <FolderKanban className="h-5 w-5" />
        </div>
        <Badge className="bg-primary/10 text-[10px] font-bold uppercase tracking-wider text-primary hover:bg-primary/15">
          Entregue
        </Badge>
      </header>

      <h3 className="text-lg font-bold leading-snug text-foreground">
        {submission.projectName}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
        {submission.description}
      </p>

      <div className="mt-4 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Equipe
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex -space-x-2">
            {submission.members.slice(0, 4).map((m) => (
              <div
                key={m.id}
                title={m.name}
                className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-card bg-primary/10 text-[10px] font-semibold text-primary"
              >
                {initials(m.name)}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {submission.members.map((m) => m.name).join(", ")}
          </span>
        </div>
      </div>

      {submission.materials.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Materiais
          </p>
          <div className="flex flex-wrap gap-2">
            {submission.materials.map((m) => {
              const meta = TYPE_META[m.type];
              const Icon = meta.icon;
              return (
                <a
                  key={m.id}
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              );
            })}
          </div>
        </div>
      )}

      <footer className="mt-5 flex items-center justify-start border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> {submission.members.length} {submission.members.length === 1 ? 'membro' : 'membros'}
        </span>
      </footer>
    </article>
  );
}

function EmptyState({ hasItems }: { hasItems: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/50 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">
        {hasItems ? "Nenhum projeto encontrado" : "Nenhuma entrega ainda"}
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasItems
          ? "Tente outro termo de busca."
          : "Quando as equipes enviarem seus projetos, eles aparecerão aqui."}
      </p>
    </div>
  );
}

export default function Admin() {
  return <AdminPage />;
}
