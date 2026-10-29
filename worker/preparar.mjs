// Prepara os dados do Worker como módulos JS (funciona em qualquer versão do Wrangler e no Node):
//   resumo-app.mjs  <- docs/umbrella-para-o-worker.md
//   bases.mjs       <- conhecimento.json (normas) + conhecimento-umbrella.json (o que o app ensina)
// Roda sozinho no deploy (wrangler.toml, [build]) e à mão: node worker/preparar.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.join(aqui, "..");
const aviso = "// GERADO por worker/preparar.mjs. Não edite: rode `node worker/preparar.mjs`.\n";

const md = fs.readFileSync(path.join(raiz, "docs", "umbrella-para-o-worker.md"), "utf8").trim();
fs.writeFileSync(path.join(aqui, "resumo-app.mjs"), aviso + "export const RESUMO_APP = " + JSON.stringify(md) + ";\n");

const lerJson = f => JSON.parse(fs.readFileSync(path.join(raiz, f), "utf8"));
const normas = lerJson("conhecimento.json"), app = lerJson("conhecimento-umbrella.json");
fs.writeFileSync(path.join(aqui, "bases.mjs"), aviso + "export const NORMAS = " + JSON.stringify(normas) + ";\nexport const APP = " + JSON.stringify(app) + ";\n");
console.log(`resumo-app.mjs: ${md.length} car. · bases.mjs: ${normas.length} trechos de normas + ${app.length} do app`);
