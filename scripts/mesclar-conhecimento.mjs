/*
  Atualiza conhecimento.json com o pacote GERAL novo do Paulus SEM perder os documentos que só existem aqui
  (Tipificação, Trilha da primeira infância, CFP/CRAS, PNAS...).

  Uso (na pasta do projeto):
    node scripts/mesclar-conhecimento.mjs ../Paulus/dist/conhecimento-geral.json
  Depois: node worker/preparar.mjs (se for publicar o Worker local) e aumente o CACHE_NAME do sw.js.

  Regra: fica TUDO do pacote novo; do conhecimento.json atual só entram os documentos (campo "doc") e ids que o pacote novo não tem.
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origem = process.argv[2];
if (!origem) { console.error('Uso: node scripts/mesclar-conhecimento.mjs caminho/para/conhecimento-geral.json'); process.exit(1); }

const alvo = path.join(raiz, 'conhecimento.json');
const novo = JSON.parse(fs.readFileSync(path.resolve(origem), 'utf8'));
const atual = JSON.parse(fs.readFileSync(alvo, 'utf8'));
if (!Array.isArray(novo) || !Array.isArray(atual)) { console.error('Os dois arquivos precisam ser listas de trechos.'); process.exit(1); }

const docsNovos = new Set(novo.map(x => x.doc));
const idsNovos = new Set(novo.map(x => x.id));
const soAqui = atual.filter(x => !docsNovos.has(x.doc) && !idsNovos.has(x.id));
const mesclado = novo.concat(soAqui);

fs.writeFileSync(alvo, JSON.stringify(mesclado));
const docsAqui = [...new Set(soAqui.map(x => x.doc))];
console.log(`conhecimento.json: ${novo.length} do pacote novo + ${soAqui.length} só daqui (${docsAqui.length} documentos: ${docsAqui.join(', ')}) = ${mesclado.length} trechos, ${(fs.statSync(alvo).size / 1e6).toFixed(2)} MB`);
