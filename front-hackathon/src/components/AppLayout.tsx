import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ShieldCheck,
  ExternalLink,
  LogOut,
  Trophy,
  Lock,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clearAuth,
  loadAuth,
  type AuthUser,
  type Role,
} from "@/lib/submissions";
import logo from "@/assets/devmenthors_LogoColor.png";

type NavItem = { to: string; label: string; icon: LucideIcon; roles: Role[] };

const NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Projetos Entregues",
    icon: ShieldCheck,
    roles: ["admin"],
  },
  {
    to: "/avaliacao",
    label: "Avaliação & Votos",
    icon: Trophy,
    roles: ["admin"],
  },
  {
    to: "/vote",
    label: "Página de Votação",
    icon: Trophy,
    roles: ["juror", "mentor"],
  },
];

export function AppLayout({
  children,
  requiredRoles = ["admin"],
}: {
  children: React.ReactNode;
  requiredRoles?: Role[];
}) {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    setUser(loadAuth());
    const sync = () => setUser(loadAuth());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!user) {
    return (
      <Gate
        title="Acesso restrito"
        description="Faça login como administrador para acessar esta área."
      />
    );
  }

  if (!requiredRoles.includes(user.role)) {
    return (
      <Gate
        title="Você não tem acesso"
        description={`Esta área é exclusiva para ${requiredRoles
          .map(roleLabel)
          .join(" ou ")}.`}
        showLogout
      />
    );
  }

  const visible = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen w-full bg-secondary/40">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-background lg:flex">
        <div className="flex items-center gap-3 px-6 py-5">
          <img src={logo} alt="DevMenthors" className="h-10 w-10 object-contain" />
          <div>
            <p className="text-sm font-bold leading-tight text-foreground">
              DevMenthors
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {roleLabel(user.role)}
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4">
          <SectionLabel>Navegação</SectionLabel>
          {visible.map((it) => (
            <NavLink key={it.to} {...it} active={pathname === it.to} />
          ))}

          <SectionLabel>Público</SectionLabel>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            Ver formulário
          </a>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
              {initialsOf(user.name)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {user.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <button
              type="button"
              aria-label="Sair"
              onClick={() => {
                clearAuth();
                navigate("/login");
              }}
              className="text-destructive transition-opacity hover:opacity-70"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

function Gate({
  title,
  description,
  showLogout = false,
}: {
  title: string;
  description: string;
  showLogout?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_oklch(0.95_0.05_263)_0%,_oklch(0.98_0.01_263)_50%,_var(--background)_100%)] px-5">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Lock className="h-7 w-7" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link to="/login">
              Ir para o login
            </Link>
          </Button>
          {showLogout && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                clearAuth();
                navigate("/login");
              }}
            >
              Sair
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
}: NavItem & { active: boolean }) {
  return (
    <Link
      to={to}
      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 mt-5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function roleLabel(r: Role) {
  return r === "admin" ? "Admin" : r === "juror" ? "Jurado" : "Mentor";
}

function initialsOf(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((n) => n[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border bg-background px-6 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
