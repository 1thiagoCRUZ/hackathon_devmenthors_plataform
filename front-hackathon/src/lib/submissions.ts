export type MaterialType =
  | "github"
  | "deploy"
  | "video"
  | "figma"
  | "slides"
  | "other";

export type Submission = {
  id: string; // no backend é int mas pode vir como int e a gente parseia string ou vice-versa
  projectName: string;
  description: string;
  representativeEmail?: string;
  leaderEmail?: string; // a api manda de volta?
  members: { id?: string; name: string }[];
  teamMembers?: any; // para suportar retorno da api
  materials: { id?: string; type: MaterialType; url: string; name?: string }[];
  links?: string[]; // retorno da api
  createdAt: string;
};

export type Role = "ADMIN" | "JUDGE" | "DEV" | "admin" | "juror" | "mentor";

export type AuthUser = {
  id: number | string;
  name: string;
  email: string;
  role: Role;
  token?: string;
};

const AUTH_KEY = "hackathon-auth";
const getAPI = () => import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/* ---------------- Auth ---------------- */

export function loadAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuth(user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: AUTH_KEY }));
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${getAPI()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error("Credenciais inválidas");
  }
  const data = await res.json();
  const userData = { ...data.user, token: data.token };
  
  // Normalizar a role do backend para o padrão do frontend
  const rawRole = (userData.role || "").toUpperCase();
  if (rawRole === "ADMIN") userData.role = "admin";
  else if (rawRole === "JUDGE") userData.role = "juror";
  else if (rawRole === "DEV") userData.role = "mentor";
  else userData.role = rawRole.toLowerCase();

  setAuth(userData);
  return userData;
}

/* ---------------- Forms & Status ---------------- */

export type FormInfo = {
  id: number;
  title: string;
  slug: string;
  isOpen: boolean;
  isVotePublic: boolean;
  adminsCanVote: boolean;
};

export async function getForm(slug: string = 'hack-2026'): Promise<FormInfo | null> {
  try {
    // A rota de forms list agora é pública para o frontend checar o status
    const res = await fetch(`${getAPI()}/forms`);
    if (!res.ok) return null;
    const forms: FormInfo[] = await res.json();
    const f = forms.find(f => f.slug === slug);
    return f || null;
  } catch {
    return null;
  }
}

export async function toggleFormStatus(id: number | string, data: Partial<FormInfo>) {
  const auth = loadAuth();
  const token = auth ? auth.token : '';
  const res = await fetch(`${getAPI()}/forms/${id}/toggle`, {
    method: "PATCH",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Erro ao alterar status do form");
}

/* ---------------- Submissions ---------------- */

export async function loadSubmissions(slug: string = 'hack-2026'): Promise<Submission[]> {
  try {
    const auth = loadAuth();
    const token = auth ? auth.token : '';
    const res = await fetch(`${getAPI()}/forms/${slug}/submissions`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    // Adaptar o retorno da API para a interface do frontend
    return data.map((d: any) => {
      const teamMembers = Array.isArray(d.teamMembers)
        ? d.teamMembers
        : typeof d.teamMembers === 'string'
          ? JSON.parse(d.teamMembers)
          : [];

      const linksArray: string[] = Array.isArray(d.links)
        ? d.links
        : typeof d.links === 'string'
          ? JSON.parse(d.links)
          : [];

      const filesArray: any[] = Array.isArray(d.files)
        ? d.files
        : typeof d.files === 'string'
          ? JSON.parse(d.files)
          : [];

      const linkMaterials = linksArray.map((url: string, i: number) => ({ id: `link-${d.id}-${i}`, type: 'other', url }));
      const fileMaterials = filesArray.map((f: any, i: number) => ({ id: `file-${d.id}-${i}`, type: 'other', url: f.url, name: f.name }));

      const materials = [...linkMaterials, ...fileMaterials];

      return {
        id: String(d.id),
        projectName: d.projectName,
        description: d.description,
        representativeEmail: d.leaderEmail,
        members: teamMembers,
        materials,
        createdAt: d.createdAt,
      };
    });
  } catch {
    return [];
  }
}

export async function saveSubmission(s: Submission, slug: string = 'hack-2026', materialsWithFiles: Array<{ id: string; type: MaterialType; url: string; file?: File | null }> = []) {
  const formData = new FormData();
  formData.append('projectName', s.projectName);
  formData.append('description', s.description);
  formData.append('leaderEmail', s.representativeEmail || '');
  
  const teamMembers = s.members.map(m => ({ name: m.name }));
  formData.append('teamMembers', JSON.stringify(teamMembers));
  
  const links = s.materials.map(m => m.url).filter(Boolean);
  formData.append('links', JSON.stringify(links));

  materialsWithFiles.forEach((material) => {
    if (material.file) {
      formData.append('files', material.file);
    }
  });

  const response = await fetch(`${getAPI()}/forms/${slug}/submissions`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Erro na resposta da API");
  }
}

export async function deleteSubmission(id: string, slug: string = 'hack-2026') {
  // Apenas simulando pois a API não parece ter rota de DELETE submissions na documentação mostrada
  console.log("Delete chamado para", id, slug);
}

/* ---------------- Voting / Avaliação ---------------- */

export const CRITERIA = [
  { key: "innovation", label: "Inovação", description: "Originalidade e criatividade da ideia." },
  { key: "design", label: "Design & UX", description: "Identidade visual e experiência de uso." },
  { key: "execution", label: "Execução técnica", description: "Qualidade da implementação e funcionamento." },
] as const;
export type CriteriaKey = (typeof CRITERIA)[number]["key"];
export type CriteriaScores = Record<CriteriaKey, number>;

export async function saveVote(payload: { submissionId: string | number; innovation: number; design: number; execution: number; notes?: string }) {
  const auth = loadAuth();
  const token = auth ? auth.token : '';
  const body = {
    submissionId: Number(payload.submissionId),
    criterionInnovation: payload.innovation,
    criterionDesign: payload.design,
    criterionTechnical: payload.execution,
    notes: payload.notes || ""
  };
  const res = await fetch(`${getAPI()}/evaluations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Erro ao salvar voto");
}

export type ProjectScore = {
  jurorAvg: number;
  jurorCount: number;
  mentorAvg: number;
  mentorCount: number;
  jurorCriteria: Record<CriteriaKey, number>;
  mentorCriteria: Record<CriteriaKey, number>;
  finalScore: number;
};

export async function getRanking(formId: number): Promise<{ ranking: any[] }> {
  const auth = loadAuth();
  const token = auth ? auth.token : '';
  const res = await fetch(`${getAPI()}/evaluations/ranking/${formId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!res.ok) return { ranking: [] };
  return res.json();
}

export type VotingProgress = {
  totalSubmissions: number;
  votedSubmissions: { id: number; projectName: string }[];
  pendingVotesCount: number;
  pendingSubmissions: { id: number; projectName: string; description: string }[];
};

export async function getVotingProgress(slug: string = 'hack-2026'): Promise<VotingProgress | null> {
  try {
    const auth = loadAuth();
    const token = auth ? auth.token : '';
    const res = await fetch(`${getAPI()}/forms/${slug}/voting-progress`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export type VotingReportProject = {
  id: number;
  projectName: string;
  votedByJudges: { id: number; name: string; email: string }[];
  pendingJudges: { id: number; name: string; email: string }[];
  votedByMentors: { id: number; name: string; email: string }[];
  pendingMentors: { id: number; name: string; email: string }[];
};

export async function getVotingReport(slug: string = 'hack-2026'): Promise<VotingReportProject[]> {
  try {
    const auth = loadAuth();
    const token = auth ? auth.token : '';
    const res = await fetch(`${getAPI()}/forms/${slug}/voting-report`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}
