# Hackathon Forms API

Uma API REST robusta projetada para suportar a alta concorrência típica dos momentos finais de um Hackathon, onde dezenas ou centenas de equipes enviam seus projetos (incluindo arquivos pesados) simultaneamente.

## 🚀 Tecnologias Utilizadas

- **Node.js + Express.js**: Orquestração HTTP utilizando `ES Modules`.
- **Prisma ORM + PostgreSQL**: Modelagem e interação com o banco de dados (configurado para usar Connection Pooling).
- **Redis + BullMQ**: Mensageria e processamento assíncrono de filas (background jobs).
- **Vitest**: Framework ultra-rápido para testes unitários.
- **PM2**: Gerenciador de processos em Node.js (pronto para rodar em modo *Cluster*).

---

## 🧠 Como o Projeto Funciona (Arquitetura de Mensageria)

O maior gargalo de uma API de Hackathon é o **upload síncrono de arquivos pesados**. Se a API tentar fazer o upload de todos os PDFs ou ZIPs na Thread principal, o servidor sofrerá *Timeout* e as conexões cairão.

A solução adotada foi o padrão de **Mensageria**:
1. **O Produtor (A Rota)**: A equipe envia os dados de texto e os arquivos via `multipart/form-data`. O backend usa o Multer apenas para jogar os arquivos na pasta temporária. O sistema salva o texto no banco (status `PROCESSING`), insere os metadados dos arquivos em uma Fila no Redis (BullMQ), e já devolve rapidamente um `202 Accepted` para o usuário.
2. **O Consumidor (O Worker)**: Em um processo completamente isolado da rota HTTP principal, um "Worker" fica escutando a fila. Ele processa, faz o upload real do arquivo para a nuvem/storage definitivo, limpa os temporários e atualiza o banco de dados para `PROCESSED`.

---

## 💻 Como Rodar o Projeto

### Pré-requisitos:
1. Node.js instalado (v18 ou superior).
2. PostgreSQL rodando.
3. Redis rodando (No Windows, você pode baixar o *Memurai* ou utilizar o binário nativo do *tporadowski*).

### Passos:
1. **Instale as dependências**:
   ```bash
   npm install
   ```
2. **Configure o `.env`**: Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:
   ```env
   DATABASE_URL="postgresql://usuario:senha@localhost:5432/hackathon_db?connection_limit=20&pool_timeout=10"
   REDIS_URL="redis://localhost:6379"
   PORT=3000
   JWT_SECRET="sua-chave-super-secreta"
   ```
3. **Crie o Banco de Dados**:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
4. **Inicie o servidor (Modo Dev)**:
   ```bash
   node src/server.js
   ```
   *Se quiser testar para produção com Cluster, utilize: `npx pm2 start ecosystem.config.cjs`*

---

## 🔗 Rotas da API

### 1. Autenticação (`/api/auth`)
*   `POST /api/auth/register`
    *   **Descrição**: Cria um novo usuário.
    *   **Body**: `{ "name": "...", "email": "...", "password": "...", "role": "ADMIN" | "JUDGE" }`
*   `POST /api/auth/login`
    *   **Descrição**: Retorna o token JWT e os dados do usuário.
    *   **Body**: `{ "email": "...", "password": "..." }`

### 2. Formulários / Hackathons (`/api/forms`)
*   `POST /api/forms` **(Requer Auth ADMIN)**
    *   **Descrição**: Cria um novo evento.
    *   **Body**: `{ "title": "Hackathon 2026", "slug": "hack-2026" }`
*   `GET /api/forms` **(Requer Auth)**
    *   **Descrição**: Lista os Hackathons cadastrados.
*   `PATCH /api/forms/:id/toggle` **(Requer Auth ADMIN)**
    *   **Descrição**: Abre ou fecha a recepção de submissões para aquele evento.
    *   **Body**: `{ "isOpen": false }`

### 3. Submissão de Projetos (`/api/submissions`)
*   `POST /api/submissions` **(Público - Com Rate Limit)**
    *   **Descrição**: A rota mais pesada. Recebe um FormData com texto e os arquivos anexados (`files`). Se tiver arquivo, devolve `202 Accepted` e envia para o Worker.
    *   **Body (FormData)**: `formId`, `projectName`, `description`, `teamMembers` (JSON Array), `links` (JSON Array), e múltiplos `files`.

### 4. Avaliação e Jurados (`/api/evaluations`)
*   `POST /api/evaluations` **(Requer Auth JUDGE/ADMIN)**
    *   **Descrição**: Envia a avaliação de um jurado sobre um projeto. Um jurado não pode avaliar o mesmo projeto duas vezes.
    *   **Body**: `{ "submissionId": "...", "criterionInnovation": 8.5, "criterionDesign": 9, "criterionTechnical": 10, "notes": "..." }`
*   `GET /api/evaluations/ranking/:formId` **(Requer Auth)**
    *   **Descrição**: Puxa em tempo real a média geral das notas e devolve a lista do maior para o menor (Pódio).

---

## 🧪 Testes Unitários e Validações

O projeto conta com uma suíte de Testes Unitários utilizando **Vitest**. Os testes foram construídos fazendo *Mock* (simulação) do cliente do Prisma, permitindo validar rigorosamente as regras de negócio em milissegundos sem tocar no banco de dados real.

**Como Rodar:**
```bash
npm run test
```

### O que os testes validam?
1. **`FormService`**:
   *   Valida se a API impede a criação de formulários com o mesmo `slug` (link duplicado).
   *   Valida a inserção limpa do criador.
2. **`SubmissionService`**:
   *   Valida se o projeto é barrado quando tenta ser submetido em um formulário `isOpen: false`.
   *   Testa a condicional: Se enviar sem arquivos, o banco salva o projeto direto como `PROCESSED`. Se enviar com arquivos, garante que o `uploadQueue.add` (Fila do Redis) será invocado.
3. **`EvaluationService`**:
   *   Verifica a geração do `finalScore` (Média aritmética entre Inovação, Design e Técnica).
   *   Testa o algoritmo de **Ranking**, simulando múltiplos projetos com múltiplas notas para provar que a lista volta perfeitamente ordenada do primeiro ao último colocado baseado na média geral.
