import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Users,
  FileText,
  Send,
  Code,
  Globe,
  PenTool,
  Presentation,
  Paperclip,
  UserPlus,
  Link as LinkIcon,
  Lock,
  CheckCircle2,
  Mail,
  Bot,
} from "lucide-react";
import logo from "@/assets/devmenthors_LogoColor.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  getForm,
  saveSubmission,
  type FormInfo,
  type MaterialType,
} from "@/lib/submissions";

type Member = { id: string; name: string };
type Material = { id: string; type: MaterialType; url: string; file?: File | null };

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

const MATERIAL_TYPES = [
  { value: "github", label: "Repositório (GitHub)", icon: Code },
  { value: "deploy", label: "Deploy / Site", icon: Globe },
  { value: "video", label: "Vídeo", icon: YoutubeIcon },
  { value: "figma", label: "Figma / Design", icon: PenTool },
  { value: "slides", label: "Slides / Apresentação", icon: Presentation },
  { value: "other", label: "PDF / Docs", icon: Paperclip },
] as const;

const uid = () => Math.random().toString(36).slice(2, 9);
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("") || "?";

const materialPlaceholder = (type: MaterialType) => {
  switch (type) {
    case "video":
      return "https://youtu.be/your-video-id";
    case "github":
      return "https://github.com/owner/repo";
    case "deploy":
      return "https://your-site.example.com";
    case "figma":
      return "https://www.figma.com/file/your-file-id";
    case "slides":
      return "https://docs.google.com/presentation/d/your-file-id";
    case "other":
    default:
      return "https://drive.google.com/file/d/your-file-id or selecione um arquivo";
  }
};

const materialFileAccept =
  ".pdf,.doc,.docx,.ppt,.pptx,.txt,.odt";

export default function Home() {
  const params = useParams<{ slug?: string }>();
  const slug = params.slug || 'hackhealth';
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchForm() {
      const f = await getForm(slug);
      setFormInfo(f);
      setLoading(false);
    }
    fetchForm();
  }, [slug]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)]">
      <Toaster position="top-center" />
      <PublicHeader />
      <main className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-8">
        {loading ? (
          <div className="text-center mt-10">Carregando formulário...</div>
        ) : formInfo?.isOpen ? (
          <FormBody slug={slug} />
        ) : (
          <ClosedState isNone={!formInfo} />
        )}
      </main>
      <footer className="border-t border-border/60 bg-background/60 py-6 text-center text-xs text-muted-foreground backdrop-blur">
        Hackathon DevMenthors • Unimar
      </footer>
    </div>
  );
}

function PublicHeader() {
  return (
    <header className="mx-auto w-full max-w-3xl px-5 pt-10 sm:px-8">
      <div className="flex flex-col items-center text-center">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
          {/* <Sparkles className="h-3.5 w-3.5" /> */}
          Hackathon DevMenthors
        </div>
        <div className="mb-4 flex h-24 w-24 items-center justify-center">
          <img src={logo} alt="Hackathon DevMenthors" className="h-20 w-auto" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Entregue seu projeto
        </h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
          Conte sobre sua ideia, apresente a equipe e compartilhe os materiais.
          Leva menos de 5 minutos.
        </p>
      </div>
    </header>
  );
}

function ClosedState({ isNone }: { isNone: boolean }) {
  return (
    <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <Lock className="h-7 w-7" />
      </div>
      <h2 className="text-2xl font-bold text-foreground">
        {isNone ? "Formulário indisponível" : "Entregas encerradas"}
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
        {isNone
          ? "O formulário de submissão ainda não foi criado pela organização."
          : "O formulário de submissão está fechado no momento. Aguarde a organização reabrir as entregas."}
      </p>
    </div>
  );
}

function FormBody({ slug }: { slug: string }) {
  const [projectName, setProjectName] = useState("");
  const [representativeEmail, setRepresentativeEmail] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<Member[]>([
    { id: uid(), name: "" },
    { id: uid(), name: "" },
    { id: uid(), name: "" },
    { id: uid(), name: "" },
    { id: uid(), name: "" },
  ]);
  const [materials, setMaterials] = useState<Material[]>([
    { id: uid(), type: "video", url: "" },
    { id: uid(), type: "github", url: "" },
    { id: uid(), type: "other", url: "", file: null },
  ]);
  const [usedAI, setUsedAI] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(representativeEmail.trim());

  const progress = useMemo(() => {
    let score = 0;
    if (projectName.trim() && emailValid) score += 25;
    if (description.trim().length >= 20) score += 25;
    if (members.every((m) => m.name.trim()) && members.length >= 1) score += 25;
    if (materials.some((m) => m.url.trim() || m.file)) score += 25;
    return score;
  }, [projectName, emailValid, description, members, materials]);

  const addMember = () => setMembers((m) => [...m, { id: uid(), name: "" }]);
  const removeMember = (id: string) =>
    setMembers((m) => (m.length > 1 ? m.filter((x) => x.id !== id) : m));
  const updateMember = (id: string, name: string) =>
    setMembers((m) => m.map((x) => (x.id === id ? { ...x, name } : x)));

  const addMaterial = () =>
    setMaterials((l) => [...l, { id: uid(), type: "other", url: "" }]);
  const removeMaterial = (id: string) =>
    setMaterials((l) => l.filter((x) => x.id !== id));
  const updateMaterial = (id: string, patch: Partial<Material>) =>
    setMaterials((l) => l.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return toast.error("Informe o nome do projeto.");
    if (!emailValid)
      return toast.error("Informe um e-mail válido do representante.");
    if (members.some((m) => !m.name.trim()))
      return toast.error("Preencha o nome de todos os integrantes.");
    if (description.trim().length < 20)
      return toast.error("Descreva a ideia com pelo menos 20 caracteres.");
    if (materials.some((m) => m.type === "other" && !m.file))
      return toast.error("Para PDF / Docs, selecione o arquivo e não use link.");
    if (usedAI && aiDescription.trim().length < 10)
      return toast.error("Descreva o uso da IA com pelo menos 10 caracteres.");

    setSubmitting(true);
    
    try {
      const submissionMaterials = materials
        .filter((m) => m.url.trim() || m.file)
        .map((m) => ({ id: m.id, type: m.type, url: m.url }));

      await saveSubmission({
        id: uid(),
        projectName: projectName.trim(),
        representativeEmail: representativeEmail.trim(),
        description: description.trim(),
        members: members.map((m) => ({ ...m, name: m.name.trim() })),
        materials: submissionMaterials,
        createdAt: new Date().toISOString(),
      }, slug, materials, usedAI, aiDescription.trim());
      
      setSubmitting(false);
      setSuccess(true);
    } catch (error: any) {
      setSubmitting(false);
      toast.error(error.message || "Erro de conexão. Não foi possível enviar.");
    }
  };

  if (success) {
    return (
      <div className="mt-10 rounded-3xl border border-border bg-card p-10 text-center shadow-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">
          Projeto entregue!
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          Obrigado por participar do Hackathon DevMenthors. Boa sorte! 🚀
        </p>
        <Button
          className="mt-6"
          variant="outline"
          onClick={() => {
            setSuccess(false);
            setProjectName("");
            setRepresentativeEmail("");
            setDescription("");
            setMembers([
              { id: uid(), name: "" },
              { id: uid(), name: "" },
              { id: uid(), name: "" },
              { id: uid(), name: "" },
              { id: uid(), name: "" },
            ]);
            setMaterials([{ id: uid(), type: "video", url: "" }]);
          }}
        >
          Enviar outro projeto
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 mb-6 rounded-2xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground">Progresso da entrega</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card
          step={1}
          icon={<FileText className="h-4 w-4" />}
          title="Sobre o projeto"
          subtitle="Identifique a ideia da equipe"
        >
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do projeto</Label>
              <Input
                id="projectName"
                placeholder="Ex.: EcoTrack — monitor de pegada de carbono"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                maxLength={100}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="representativeEmail" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-primary" />
                E-mail do representante do grupo
              </Label>
              <Input
                id="representativeEmail"
                type="email"
                placeholder="representante@exemplo.com"
                value={representativeEmail}
                onChange={(e) => setRepresentativeEmail(e.target.value)}
                maxLength={150}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Usaremos esse e-mail para entrar em contato sobre a entrega e os resultados.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição da ideia</Label>
              <Textarea
                id="description"
                placeholder="Qual o problema, a solução proposta e os diferenciais do projeto?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                maxLength={1500}
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/1500
              </p>
            </div>
          </div>
        </Card>

        <Card
          step={2}
          icon={<Users className="h-4 w-4" />}
          title="Integrantes da equipe"
          subtitle={`${members.length} ${members.length === 1 ? "pessoa" : "pessoas"}`}
        >
          <div className="space-y-3">
            {members.map((m, idx) => (
              <div
                key={m.id}
                className="group flex items-center gap-3 rounded-xl border border-border bg-background p-2 pl-3 transition-all duration-200 hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 animate-in fade-in slide-in-from-top-1"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-xs font-bold text-primary ring-1 ring-primary/15">
                  {m.name.trim() ? initials(m.name) : idx + 1}
                </div>
                <Input
                  placeholder={`Nome do integrante ${idx + 1}`}
                  value={m.name}
                  onChange={(e) => updateMember(m.id, e.target.value)}
                  maxLength={120}
                  className="border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(m.id)}
                  disabled={members.length === 1}
                  aria-label="Remover integrante"
                  className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                if (members.length >= 5) {
                  toast.error('Máximo de 5 integrantes.');
                  return;
                }
                addMember();
              }}
              disabled={members.length >= 5}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-3 text-sm font-medium transition-all active:scale-100 ${members.length >= 5 ? 'border-border/40 text-muted-foreground/60 cursor-not-allowed bg-background' : 'border-border hover:scale-[1.01] hover:border-primary/60 hover:bg-primary/5 hover:text-primary'}`}
            >
              <UserPlus className="h-4 w-4" />
              {members.length >= 5 ? 'Limite atingido (5)' : 'Adicionar integrante'}
            </button>
          </div>
        </Card>

        <Card
          step={3}
          icon={<LinkIcon className="h-4 w-4" />}
          title="Materiais do projeto"
          subtitle="Repositório, deploy, vídeo, design, slides..."
        >
          <div className="space-y-3">
            {materials.map((mat) => {
              return (
                <div
                  key={mat.id}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-border bg-background p-3 transition-all hover:border-primary/40 sm:grid-cols-[200px_1fr_auto] sm:items-center sm:gap-3 animate-in fade-in slide-in-from-top-1"
                >
                  <Select
                    value={mat.type}
                    onValueChange={(v) =>
                      updateMaterial(mat.id, {
                        type: v as MaterialType,
                        url: v === "other" ? "" : mat.url,
                        file: v === "other" ? mat.file ?? null : null,
                      })
                    }
                  >
                    <SelectTrigger className="h-10 border-border bg-secondary/60">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIAL_TYPES.map((t) => {
                        const TIcon = t.icon;
                        return (
                          <SelectItem key={t.value} value={t.value}>
                            <span className="flex items-center gap-2">
                              <TIcon className="h-4 w-4 text-primary" />
                              {t.label}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {mat.type !== "other" ? (
                    <Input
                      type="url"
                      placeholder={materialPlaceholder(mat.type)}
                      value={mat.url}
                      onChange={(e) =>
                        updateMaterial(mat.id, { url: e.target.value })
                      }
                      maxLength={500}
                    />
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-foreground">
                        Arquivo PDF / Docs
                      </label>
                      <input
                        type="file"
                        accept={materialFileAccept}
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          updateMaterial(mat.id, { file, url: "" });
                        }}
                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground file:rounded-md file:border file:border-border file:bg-secondary/70 file:px-3 file:py-2 file:text-sm file:text-foreground"
                      />
                      {mat.file ? (
                        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">
                          <span className="truncate">{mat.file.name}</span>
                          <button
                            type="button"
                            onClick={() => updateMaterial(mat.id, { file: null })}
                            className="text-primary hover:underline"
                          >
                            Remover
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Selecione um arquivo PDF ou documento.
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMaterial(mat.id)}
                    aria-label="Remover material"
                    className="h-10 w-10 justify-self-end"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              );
            })}

            <button
              type="button"
              onClick={addMaterial}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground transition-all hover:scale-[1.01] hover:border-primary/60 hover:bg-primary/5 hover:text-primary active:scale-100"
            >
              <Plus className="h-4 w-4" />
              Adicionar material
            </button>
          </div>
        </Card>

        <Card
          step={4}
          icon={<Bot className="h-4 w-4" />}
          title="Uso de Inteligência Artificial"
          subtitle="Transparência no desenvolvimento"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="used-ai-toggle" className="cursor-pointer text-sm font-medium">
                  O time utilizou IA no desenvolvimento?
                </Label>
                <p className="text-xs text-muted-foreground">
                  Ex.: ChatGPT, GitHub Copilot, Gemini, Cursor...
                </p>
              </div>
              <Switch
                id="used-ai-toggle"
                checked={usedAI}
                onCheckedChange={(checked) => {
                  setUsedAI(checked);
                  if (!checked) setAiDescription("");
                }}
              />
            </div>

            {usedAI && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <Label htmlFor="ai-description">
                  Como e para que utilizou a IA?
                </Label>
                <Textarea
                  id="ai-description"
                  placeholder="Ex.: Usamos o GitHub Copilot para acelerar a escrita de código e o ChatGPT para estruturar a arquitetura da solução e gerar ideias de funcionalidades."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={4}
                  maxLength={800}
                />
                <p className="text-right text-xs text-muted-foreground">
                  {aiDescription.length}/800
                </p>
              </div>
            )}
          </div>
        </Card>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="group w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/40 hover:brightness-110"
        >
          <Send
            className={`h-4 w-4 transition-transform ${submitting ? "animate-pulse" : "group-hover:translate-x-0.5"}`}
          />
          {submitting ? "Enviando..." : "Enviar projeto"}
        </Button>
      </form>
    </>
  );
}

function Card({
  step,
  icon,
  title,
  subtitle,
  children,
}: {
  step?: number;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <header className="flex items-center gap-3 border-b border-border/60 bg-secondary/30 px-6 py-4">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
          {step !== undefined && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow">
              {step}
            </span>
          )}
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}
