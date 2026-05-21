import http from 'k6/http';
import { check, sleep } from 'k6';
import { FormData } from 'https://jslib.k6.io/formdata/0.0.2/index.js';

export const options = {
  stages: [
    { duration: '10s', target: 200 },
    { duration: '40s', target: 500 },
    { duration: '10s', target: 0 },
  ],
};

const BASE_URL = 'http://localhost:3001/api/forms/hack-2026/submissions';

export default function () {
  // Simula ~30% dos usuários enviando arquivos e 70% enviando apenas links
  const hasFile = Math.random() > 0.7;

  const fd = new FormData();
  fd.append('projectName', `Hackathon Project VU:${__VU} IT:${__ITER}`);
  fd.append('description', 'Test load description');
  fd.append('leaderEmail', `lider${__VU}@load.com`);
  fd.append('teamMembers', JSON.stringify([{ name: 'K6 User 1' }, { name: 'K6 User 2' }]));
  fd.append('links', JSON.stringify(['https://github.com/test']));

  if (hasFile) {
    // Cria um arquivo mockado em memória para testar o multer e o parser
    fd.append('files', http.file('arquivo de teste dummy load', 'demo.txt', 'text/plain'));
  }

  const res = http.post(BASE_URL, fd.body(), {
    headers: { 'Content-Type': `multipart/form-data; boundary=${fd.boundary}` },
  });

  // Validando o comportamento da API sob estresse
  check(res, {
    'created (201 - no file)': (r) => r.status === 201,
    'accepted (202 - with file)': (r) => r.status === 202,
    'rate limited (429 - block worked)': (r) => r.status === 429,
  });

  // Pacing simulando o comportamento de usuários lendo e clicando.
  sleep(Math.random() * 2); 
}
