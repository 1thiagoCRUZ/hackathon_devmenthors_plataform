import { useEffect, useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Mail,
  Loader2,
  Lock,
} from "lucide-react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  loadUsers,
  createUser,
  sendCredentialsEmail,
  type AuthUser,
} from "@/lib/submissions";

export default function UsersPage() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("juror"); // Default: Jurado
  const [submitting, setSubmitting] = useState(false);

  // Email sending states (tracking loading by user ID)
  const [sendingEmailId, setSendingEmailId] = useState<string | number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await loadUsers();
      setUsers(data);
    } catch {
      toast.error("Erro ao carregar lista de usuários.");
    } finally {
      setLoading(false);
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setSubmitting(true);
    try {
      const newUser = await createUser(name.trim(), email.trim(), role);
      toast.success(`Usuário ${newUser.name} criado com sucesso!`);
      
      // Reset form & dialog
      setName("");
      setEmail("");
      setRole("juror");
      setDialogOpen(false);
      
      // Refresh list
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCredentials = async (userId: string | number, userEmail: string) => {
    setSendingEmailId(userId);
    try {
      const result = await sendCredentialsEmail(userId);
      
      if (result.testPreviewUrl) {
        toast.success(`E-mail enviado! (Visualização disponível)`, {
          description: `O e-mail foi interceptado pelo Ethereal Mail para testes.`,
          action: {
            label: "Ver E-mail",
            onClick: () => window.open(result.testPreviewUrl, "_blank"),
          },
          duration: 10000,
        });
      } else {
        toast.success(`E-mail com as credenciais de acesso enviado para ${userEmail}!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao disparar e-mail de acesso.");
    } finally {
      setSendingEmailId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    
    // Obter label correspondente à role para buscar por ela também
    const rLabel = getRoleLabel(u.role).toLowerCase();
    
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      rLabel.includes(q)
    );
  });

  function getRoleLabel(r: string) {
    const normalized = r.toUpperCase();
    if (normalized === "ADMIN") return "Admin";
    if (normalized === "DEV" || normalized === "MENTOR") return "Mentor";
    return "Jurado";
  }

  function getRoleBadgeStyle(r: string) {
    const normalized = r.toUpperCase();
    if (normalized === "ADMIN") {
      return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    }
    if (normalized === "DEV" || normalized === "MENTOR") {
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    }
    return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }

  const initials = (name: string) =>
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "?";

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <PageHeader
        title="Gerenciar Usuários"
        subtitle="Adicione e gerencie os jurados, mentores e organizadores do hackathon."
        actions={
          <Badge variant="secondary" className="px-3 py-1.5 text-xs font-semibold">
            {users.length} {users.length === 1 ? "usuário" : "usuários"}
          </Badge>
        }
      />

      <main className="w-full px-6 py-8 sm:px-10">
        {/* Top actions bar */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail ou perfil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-colors">
                <UserPlus className="h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px] bg-card border-border">
              <form onSubmit={handleCreateUser}>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold text-foreground">Cadastrar Novo Usuário</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Crie credenciais de acesso para a plataforma. O perfil padrão é definido como Jurado.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold text-foreground">Nome Completo</Label>
                    <Input
                      id="name"
                      placeholder="Ex: João da Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="border-border bg-secondary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Ex: joao.silva@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="border-border bg-secondary/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-semibold text-foreground">Perfil de Acesso (Role)</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="border-border bg-secondary/20 w-full text-foreground">
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border text-foreground">
                        <SelectItem value="juror">Jurado (Padrão)</SelectItem>
                        <SelectItem value="mentor">Mentor (DEV)</SelectItem>
                        <SelectItem value="admin">Administrador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-xl border border-indigo-500/10 bg-indigo-500/5 p-4 flex items-start gap-3">
                    <Lock className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Senha Provisória</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        A senha de acesso do usuário criado será gerada automaticamente como <strong className="text-indigo-400 font-mono">devmenthors123</strong>. Você poderá disparar o e-mail de acesso para o usuário imediatamente após a criação através da lista de usuários.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                    className="border-border hover:bg-secondary/40 text-muted-foreground"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1.5"
                  >
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users Table */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
              Carregando lista de usuários...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                {search ? "Tente buscar por outro termo ou nome." : "Nenhum usuário foi cadastrado no sistema ainda."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-secondary/20">
                  <TableRow className="border-b border-border/80 hover:bg-transparent">
                    <TableHead className="font-semibold text-foreground py-4">Usuário</TableHead>
                    <TableHead className="font-semibold text-foreground">Perfil (Role)</TableHead>
                    <TableHead className="font-semibold text-foreground">Data de Criação</TableHead>
                    <TableHead className="font-semibold text-foreground text-right pr-6">Ações de Acesso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-xs font-bold text-indigo-500">
                            {initials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground leading-none truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-semibold capitalize border px-2 py-0.5 text-[11px] rounded-full ${getRoleBadgeStyle(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        }) : "—"}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sendingEmailId !== null}
                          onClick={() => handleSendCredentials(u.id, u.email)}
                          className="border-indigo-500/20 hover:border-indigo-500/40 text-indigo-400 hover:text-indigo-300 bg-indigo-500/5 hover:bg-indigo-500/10 gap-1.5 text-xs font-semibold py-1.5 h-8 transition-all duration-200"
                        >
                          {sendingEmailId === u.id ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Mail className="h-3.5 w-3.5" />
                              Enviar Acesso
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
