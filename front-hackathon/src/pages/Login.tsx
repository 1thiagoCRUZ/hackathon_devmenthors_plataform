import { useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import logo from "@/assets/devmenthors_LogoColor.png";
import { login } from "@/lib/submissions";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      return toast.error("Preencha e-mail e senha.");
    }
    
    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Bem-vindo(a), ${user.name.split(" ")[0]}!`);
      const target = (user.role === "ADMIN" || user.role === "admin") ? "/admin" : "/vote";
      navigate(target);
    } catch (err: any) {
      toast.error(err.message || "Credenciais inválidas. Confira o e-mail e a senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)]">
      <Toaster position="top-center" />
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-5 py-8 items-center justify-center lg:px-10">
        
        {/* Brand */}
        <div className="mb-8 text-center w-full">
          <Link
            to="/"
            className="inline-flex flex-col items-center gap-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <img src={logo} alt="DevMenthors" className="h-12 w-auto" />
            <span>DevMenthors</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Acesso <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Restrito</span>
          </h1>
          <p className="mt-4 mx-auto max-w-sm text-sm text-muted-foreground">
            Login para administradores, jurados e mentores.
          </p>
        </div>

        {/* Form */}
        <div className="w-full">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
          >
            <h2 className="text-lg font-bold text-foreground">Entrar</h2>
            
            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  E-mail
                </Label>
                <Input
                  type="email"
                  className="mt-2 h-11"
                  placeholder="seunome@devmenthors.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Senha
                </Label>
                <Input
                  type="password"
                  className="mt-2 h-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="mt-6 w-full gap-2 bg-gradient-to-r from-primary to-primary/80 text-base shadow-lg shadow-primary/25 hover:brightness-110"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Quer entregar um projeto?{" "}
              <Link to="/" className="font-semibold text-primary hover:underline">
                Acesse o formulário público
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
