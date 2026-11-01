// Teste local do Worker, sem rede: a API da Anthropic é simulada. Rode: node worker/teste-local.mjs
import worker, { _teste } from "./index.mjs";

let falhas = 0;
const ok = (c, m) => { console.log((c ? "OK   " : "FALHA ") + m); if (!c) falhas++; };

// 1) A busca acha a nota certa para perguntas do dia a dia
const casos = [
  ["o que é o PAIF?", /PAIF/i],
  ["quantas famílias por técnico posso acompanhar?", /fam[ií]lias/i],
  ["quando posso encerrar o acompanhamento?", /encerr/i],
  ["PAIF pode ser exigido como condicionalidade do Bolsa Família?", /volunt|condicionalidade/i],
  ["qual a diferença entre PAIF e PAEFI?", /PAEFI|CREAS/i],
  ["o que são benefícios eventuais?", /eventua/i],
  ["como registrar observações no prontuário sem juízo de valor?", /registro|prontu|juizo|juízo/i],
  // PAF a fundo (guia de apoio, roteiros do Paulus e Referências do CFP, item 3.10)
  ["como escrever as metas do PAF?", /observ[aá]vel|prazo|meta/i],
  ["o que fazer quando a meta não foi alcançada?", /adequar|readequ|ajustar o plano/i],
  ["a família não comparece, o que faço?", /ades[aã]o|volunt|punição|punicao/i],
  ["qual a diferença entre acompanhamento particularizado e em grupo?", /particularizado/i],
  ["como saber se o acompanhamento deu certo?", /êxito|exito|seguranças/i],
  ["o PAF avalia a família?", /n[aã]o visa avaliar|n[aã]o avalia|avaliar a fam[ií]lia|culpar/i],
  ["como atender família migrante venezuelana no PAF?", /migra/i],
  ["qual o papel do psicólogo no PAF?", /psic[oó]log/i],
  ["como contar famílias em acompanhamento no RMA?", /RMA/i],
];
const { refinar } = (await import("../paulus-consulta.js")).default;
for (const [p, re] of casos) {
  const q = refinar(p).expandida;
  const t = _teste.buscar(_teste.INDICE_APP, q, 6).concat(_teste.buscar(_teste.INDICE_NORMAS, q, 4));
  const txt = t.map(v => (v.titulo || "") + " " + v.texto).join(" ");
  ok(t.length > 0 && re.test(txt), `busca: "${p}" → ${t.length} trechos (${(t[0] && (t[0].titulo || "").slice(0, 50)) || "-"})`);
}

// 2) Fluxo completo com a Anthropic simulada
const sse = pedacos => new Response(new ReadableStream({ start(c) {
  const e = new TextEncoder();
  for (const p of pedacos) c.enqueue(e.encode(`event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: p } })}\n\n`));
  c.close();
} }), { status: 200, headers: { "content-type": "text/event-stream" } });

let corpoEnviado = null;
// Login simulado: chave RSA de teste no lugar do JWKS do Google.
const par = await crypto.subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwkTeste = { ...(await crypto.subtle.exportKey("jwk", par.publicKey)), kid: "k1", alg: "RS256" };
const b64j = o => Buffer.from(JSON.stringify(o)).toString("base64url");
async function fazerToken(sub) {
  const n = Math.floor(Date.now() / 1000), h = b64j({ alg: "RS256", kid: "k1" }), p = b64j({ aud: "proj-teste", iss: "https://securetoken.google.com/proj-teste", sub, iat: n, exp: n + 3600 });
  const sig = Buffer.from(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", par.privateKey, new TextEncoder().encode(h + "." + p))).toString("base64url");
  return h + "." + p + "." + sig;
}
const TOKEN = await fazerToken("usuario-1");

globalThis.fetch = async (url, init) => { if (String(url).includes("securetoken@system")) return new Response(JSON.stringify({ keys: [jwkTeste] }), { headers: { "Cache-Control": "max-age=300" } }); corpoEnviado = JSON.parse(init.body); return sse(["O PAIF é o serviço ", "de proteção à família [1].\n", "SUGESTÕES: Quem é atendido? | Como funciona o PAF?"]); };

const env = { ANTHROPIC_API_KEY: "teste", ALLOWED_ORIGINS: "https://x.github.io", FIREBASE_PROJECT_ID: "proj-teste" };
const pedir = (corpo, origem = "https://x.github.io") => worker.fetch(new Request("https://w.dev/", { method: "POST", headers: { Origin: origem, Authorization: "Bearer " + TOKEN }, body: JSON.stringify(corpo) }), env);

let r = await pedir({ app: "umbrella", pergunta: "O que é o PAIF?", pagina: "registros", historico: [], fichas: [], stream: true });
const texto = await r.text();
ok(r.status === 200 && /event-stream/.test(r.headers.get("content-type")), "stream 200 text/event-stream");
ok(/"fontes":\[/.test(texto) && /"t":"O PAIF é o serviço "/.test(texto) && /\[DONE\]/.test(texto), "SSE traduzido: fontes + pedaços + [DONE]");
ok(r.headers.get("access-control-allow-origin") === "https://x.github.io", "CORS da origem permitida");
ok(/O PAF em detalhe/.test(corpoEnviado.system[0].text) && /Número de encontros, duração/.test(corpoEnviado.system[0].text), "prompt: bloco \"O PAF em detalhe\" e aviso de que o número de encontros não é norma");
ok(corpoEnviado.system[0].cache_control && /ESSENCIAL DO PAIF/.test(corpoEnviado.system[0].text) && /RESUMO DO APP/.test(corpoEnviado.system[0].text), "prompt: essencial + resumo do app (cacheado)");
ok(/TRECHOS RECUPERADOS/.test(corpoEnviado.system[1].text) && /\[1\]/.test(corpoEnviado.system[1].text), "prompt: trechos numerados");
ok(corpoEnviado.messages.length === 1 && corpoEnviado.messages[0].role === "user", "mensagens começam pelo usuário");

// 3) Histórico: alterna papéis e termina no usuário
const m = _teste.montarMensagens([{ papel: "paulus", texto: "oi" }, { papel: "usuario", texto: "a" }, { papel: "usuario", texto: "b" }, { papel: "paulus", texto: "c" }], "d");
ok(m[0].role === "user" && m.every((x, i) => i === 0 || x.role !== m[i - 1].role) && m.at(-1).role === "user" && m.at(-1).content.endsWith("d"), "histórico válido para a API");

// 4) Privacidade e limites
r = await pedir({ pergunta: "A família da Maria, CPF 123.456.789-09, precisa de cesta" });
ok(r.status === 400, "bloqueia CPF no servidor");
r = await pedir({ pergunta: "ligar para (95) 99123-4567" });
ok(r.status === 400, "bloqueia telefone no servidor");
r = await pedir({ pergunta: "o que é PAIF?" }, "https://malicioso.com");
ok(r.status === 403, "recusa origem não autorizada");
r = await worker.fetch(new Request("https://w.dev/", { method: "OPTIONS", headers: { Origin: "https://x.github.io" } }), env);
ok(r.status === 204, "preflight OPTIONS");
r = await worker.fetch(new Request("https://w.dev/", { method: "POST", headers: { Origin: "https://x.github.io" }, body: JSON.stringify({ pergunta: "oi" }) }), { ALLOWED_ORIGINS: "https://x.github.io", FIREBASE_PROJECT_ID: "proj-teste" });
ok(r.status === 503, "sem chave da API → 503 com motivo");
r = await worker.fetch(new Request("https://w.dev/", { method: "POST", headers: { Origin: "https://x.github.io" }, body: JSON.stringify({ pergunta: "o que é PAIF?" }) }), env);
ok(r.status === 401, "sem token de login → 401");
r = await worker.fetch(new Request("https://w.dev/", { method: "POST", headers: { Origin: "https://x.github.io", Authorization: "Bearer " + TOKEN.slice(0, -4) + "AAAA" }, body: JSON.stringify({ pergunta: "o que é PAIF?" }) }), env);
ok(r.status === 401, "token adulterado → 401");
let ultimo; for (let i = 0; i < 12; i++) ultimo = await pedir({ pergunta: "o que é PAIF?" });
ok(ultimo.status === 429, "limite por minuto → 429 com { erro }");

console.log(falhas ? `\n${falhas} falha(s)` : "\nTudo certo");
process.exit(falhas ? 1 : 0);
