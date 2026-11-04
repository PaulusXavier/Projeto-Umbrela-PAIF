// Gera os trechos do conhecimento ampliado do Paulus (PAIF, CRAS, SUAS) e mescla em conhecimento.json.
//   fonte:   docs/paif-conhecimento-ampliado.md
//   destino: conhecimento.json (a base de normas e apoio do Paulus)
// Idempotente: remove os documentos que esta fonte declara antes de inserir de novo, então pode rodar quantas vezes quiser.
// Uso:  node scripts/gerar-conhecimento-paif-ampliado.mjs && node worker/preparar.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const fonte = path.join(raiz, "docs", "paif-conhecimento-ampliado.md");
const destino = path.join(raiz, "conhecimento.json");

const md = fs.readFileSync(fonte, "utf8").replace(/<!--[\s\S]*?-->/g, "").replace(/\r\n/g, "\n");
const trechos = [];
let doc = null, ref = null, buf = [];

function fecharTrecho() {
  if (doc && ref) {
    const texto = buf.join(" ").replace(/\s+/g, " ").trim();
    if (texto) doc.itens.push({ referencia: ref, texto });
  }
  ref = null; buf = [];
}

const docs = [];
for (const linha of md.split("\n")) {
  let m;
  if ((m = /^# DOC\s+(\S+)\s*$/.exec(linha))) {
    fecharTrecho();
    doc = { id: m[1], titulo: "", norma: "", ano: 2026, tipo: "apoio", itens: [] };
    docs.push(doc);
  } else if (doc && !ref && (m = /^(titulo|norma|ano|tipo):\s*(.+)$/.exec(linha))) {
    doc[m[1]] = m[1] === "ano" ? Number(m[2]) : m[2].trim();
  } else if (doc && (m = /^##\s+(.+)$/.exec(linha))) {
    fecharTrecho();
    ref = m[1].trim();
  } else if (ref) {
    buf.push(linha);
  }
}
fecharTrecho();

const problemas = [];
for (const d of docs) {
  if (!d.titulo || !d.norma) problemas.push(`${d.id}: faltam titulo/norma`);
  if (!d.itens.length) problemas.push(`${d.id}: sem trechos`);
  d.itens.forEach((it, i) => {
    if (it.texto.length > 1400) problemas.push(`${d.id}#${i + 1} "${it.referencia}": ${it.texto.length} caracteres (o Worker corta em 1400)`);
    trechos.push({
      id: `${d.id}#${i + 1}`, doc: d.id, titulo: d.titulo, norma: d.norma, ano: d.ano,
      referencia: it.referencia, texto: it.texto, tipo: d.tipo
    });
  });
}
if (problemas.length) { console.error("Corrija antes de gerar:\n- " + problemas.join("\n- ")); process.exit(1); }

const base = JSON.parse(fs.readFileSync(destino, "utf8"));
const meus = new Set(docs.map(d => d.id));
const mantidos = base.filter(v => !meus.has(v.doc));
const removidos = base.length - mantidos.length;
fs.writeFileSync(destino, JSON.stringify(mantidos.concat(trechos)) + "\n");
console.log(`conhecimento.json: ${removidos} trechos antigos desta fonte removidos, ${trechos.length} inseridos em ${docs.length} documentos. Total: ${mantidos.length + trechos.length}.`);
