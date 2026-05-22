import { useEffect, useState } from "react";
import { Users, Presentation } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { getForm, toggleFormStatus, type FormInfo } from "@/lib/submissions";

export default function Permissions() {
  const [formInfo, setFormInfo] = useState<FormInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const f = await getForm('hack-2026');
    setFormInfo(f);
    setLoading(false);
  }

  const handleToggleStatus = async (field: keyof FormInfo, value: boolean) => {
    if (!formInfo) return;
    try {
      await toggleFormStatus(formInfo.id, { [field]: value });
      setFormInfo((prev) => prev ? { ...prev, [field]: value } : null);
      if (field === "isVotePublic") {
        toast.success(value ? "Votação pública (Devs) ativada." : "Votação pública (Devs) desativada.");
      } else if (field === "adminsCanVote") {
        toast.success(value ? "Admins podem votar." : "Admins bloqueados de votar.");
      }
      // Clear cache so admin dashboard gets fresh data too
      sessionStorage.removeItem('adminData');
    } catch {
      toast.error("Erro ao alterar permissões.");
    }
  };

  return (
    <AppLayout>
      <Toaster position="top-right" />
      <PageHeader
        title="Permissões"
        subtitle="Gerencie as regras de acesso e votação do formulário."
      />

      <main className="w-full max-w-4xl px-6 py-8 sm:px-10">
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary mb-2"></div>
              Carregando configurações...
            </div>
          ) : !formInfo ? (
            <div className="flex flex-col items-center justify-center py-2 text-center">
              <h3 className="text-sm font-semibold text-foreground">
                Nenhum formulário ativo
              </h3>
              <p className="mt-1 mb-4 text-xs text-muted-foreground">
                Não foi possível carregar as configurações do evento.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="flex items-start justify-between gap-4 pb-6 border-b border-border/50">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Votação Pública (DEVs)
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Permitir que usuários DEV votem nos projetos. A média dos DEVs terá peso de 20% na nota final, 
                      enquanto os Jurados representarão 80%.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formInfo.isVotePublic}
                  onCheckedChange={(v) => handleToggleStatus("isVotePublic", v)}
                  className="mt-1"
                />
              </div>

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Presentation className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Admins Podem Votar
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Permite que administradores possam dar notas. O peso será igual ao de um jurado oficial.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formInfo.adminsCanVote}
                  onCheckedChange={(v) => handleToggleStatus("adminsCanVote", v)}
                  className="mt-1"
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </AppLayout>
  );
}
