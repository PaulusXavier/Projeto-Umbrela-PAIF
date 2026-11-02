/* Roda DENTRO das janelas de impressão (carregado por <script src>, pois o CSP do app proíbe script inline).
   Extraído de app.js; os dados chegam por <script type="application/json" id="umb-pdfs|umb-cfg">. */

/* Roda DENTRO da janela de impressão (injetada como texto via Function.toString — por isso é autossuficiente
   e não usa crase nem "${"). cfg = { larguraMm, alturaMm, paginasAntes }.
   1) lista só o essencial (Partes, subpartes e uma linha para os anexos) que estão em #corpo-paf;
   2) clona a tabela-casca do documento para um contêiner de colunas com a largura e a altura exatas da área útil
      da folha, onde cada coluna equivale a uma página impressa; a coluna em que cada título cai é a sua página;
   3) escreve o sumário (com links internos) e os números. Se algo falhar, o sumário sai sem números. */
function sumarioPafNaJanela(cfg) {
  var doc = document;
  var corpo = doc.getElementById("corpo-paf");
  var lista = doc.getElementById("sumarioLista");
  if (!corpo || !lista) return { ok: false, motivo: "sem corpo" };

  function limpo(s) { return String(s || "").replace(/\s+/g, " ").trim(); }
  function maiusc(s) { return s.toLocaleUpperCase("pt-BR"); }
  function textoDe(el, tirar) {
    var c = el.cloneNode(true);
    var rem = c.querySelectorAll(tirar);
    for (var i = 0; i < rem.length; i++) rem[i].parentNode.removeChild(rem[i]);
    return limpo(c.textContent);
  }

  // ---- 1) itens do sumário ----
  var itens = [];
  var nos = corpo.querySelectorAll(".sep-cadastro.parte, .sub-parte, h2, .anexo-titulo");
  var temSub = false, temAnexo = false;
  for (var i = 0; i < nos.length; i++) {
    var el = nos[i];
    if (!el.getClientRects().length) continue;   // oculto: não entra no sumário nem no contador de seções
    var rotulo = "", nivel = 0;
    if (el.classList.contains("sep-cadastro")) {
      var pn = el.querySelector(".parte-n");
      var tit = textoDe(el, "small, .parte-n");
      rotulo = maiusc((pn ? limpo(pn.textContent) + " — " : "") + tit);
      nivel = 0; temSub = false;
    } else if (el.classList.contains("sub-parte")) {
      var b = el.querySelector("b");
      rotulo = (b ? limpo(b.textContent) + "  " : "") + textoDe(el, "small, b");
      nivel = 1; temSub = true;
    } else if (el.tagName === "H2") {
      continue;   // sumário enxuto: só o essencial (Partes e subpartes); as seções numeradas ficam fora
    } else {
      if (temAnexo) continue;   // todos os anexos entram numa única linha, apontando para o primeiro
      temAnexo = true;
      rotulo = "ANEXOS";
      nivel = 0; temSub = false;
    }
    if (!rotulo) continue;
    var idx = itens.length;
    el.setAttribute("data-sm", String(idx));
    if (!el.id) el.id = "sm-" + idx;
    itens.push({ rotulo: rotulo, nivel: nivel, id: el.id, pagina: null });
  }

  // ---- 3a) monta as linhas (números ainda vazios; ocupam o mesmo espaço depois de preenchidos) ----
  lista.innerHTML = "";
  var linhas = [];
  for (var k = 0; k < itens.length; k++) {
    var a = doc.createElement("a");
    a.className = "sm-lin sm-n" + itens[k].nivel;
    a.setAttribute("href", "#" + itens[k].id);
    var t = doc.createElement("span"); t.className = "sm-t"; t.textContent = itens[k].rotulo;
    var pt = doc.createElement("span"); pt.className = "sm-pt";
    var pp = doc.createElement("span"); pp.className = "sm-p"; pp.textContent = "00";
    a.appendChild(t); a.appendChild(pt); a.appendChild(pp);
    lista.appendChild(a);
    linhas.push(pp);
  }

  // ---- 2) medição ----
  var host = null;
  try {
    var casca = doc.querySelector(".print-shell");
    if (!casca || !itens.length) throw new Error("sem casca");
    var larg = cfg.larguraMm, alt = cfg.alturaMm;

    // Cópia fiel das regras CSS do documento (na mesma ordem, para a cascata sair igual), com duas diferenças:
    // regras de @media print passam a valer, e quebras de PÁGINA forçadas viram quebras de COLUNA.
    var copia = [];
    function copiar(regras) {
      for (var r = 0; r < regras.length; r++) {
        var rg = regras[r];
        if (rg.type === 1) {
          copia.push(rg.cssText
            .replace(/page-break-(before|after)\s*:\s*always/g, "break-$1:column")
            .replace(/(break-(?:before|after)\s*:\s*)(?:page|always|left|right|recto|verso)\b/g, "$1column"));
        } else if (rg.type === 4) {
          var m = rg.media ? rg.media.mediaText : "";
          if (/print/.test(m) && !/screen/.test(m)) copiar(rg.cssRules);
        }
      }
    }
    for (var s = 0; s < doc.styleSheets.length; s++) {
      var regras = null;
      try { regras = doc.styleSheets[s].cssRules; } catch (e) { regras = null; }
      if (regras) copiar(regras);
    }
    // A linha única do corpo do documento pode (e deve) quebrar entre páginas, mesmo com "break-inside: avoid" herdado de "tr".
    copia.push(".print-shell > tbody > tr, .print-shell > tbody > tr > td { break-inside: auto !important; page-break-inside: auto !important; }");
    var estilo = doc.createElement("style");
    estilo.setAttribute("data-medicao", "1");
    estilo.textContent = copia.join("\n");

    host = doc.createElement("div");
    host.setAttribute("aria-hidden", "true");
    host.style.cssText = "position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;overflow:visible;" +
      "width:" + larg + "mm;height:" + alt + "mm;column-width:" + larg + "mm;column-gap:0;column-fill:auto;";
    var clone = casca.cloneNode(true);
    var ifr = clone.querySelectorAll("iframe");
    for (var q = 0; q < ifr.length; q++) ifr[q].removeAttribute("src");
    var scr = clone.querySelectorAll("script");
    for (var z = 0; z < scr.length; z++) scr[z].parentNode.removeChild(scr[z]);
    host.appendChild(estilo);
    host.appendChild(clone);
    doc.body.appendChild(host);

    // Cabeçalho e rodapé institucionais se repetem em TODA página impressa e tomam espaço fixo; as colunas de medição
    // não os repetem, então sua altura é descontada da altura útil e eles saem da cópia.
    var cab = clone.querySelector("thead"), rod = clone.querySelector("tfoot");
    var ocupado = (cab ? cab.getBoundingClientRect().height : 0) + (rod ? rod.getBoundingClientRect().height : 0);
    if (cab) cab.style.display = "none";
    if (rod) rod.style.display = "none";
    host.style.height = "calc(" + alt + "mm - " + ocupado + "px)";

    var hostBox = host.getBoundingClientRect();
    var larguraPx = hostBox.width;
    if (!(larguraPx > 0)) throw new Error("largura inválida");
    for (var n = 0; n < itens.length; n++) {
      var alvo = clone.querySelector('[data-sm="' + n + '"]');
      if (!alvo) continue;
      var rc = alvo.getBoundingClientRect();
      var col = Math.floor((rc.left - hostBox.left) / larguraPx + 0.002);
      if (col >= 0 && col < 2000) itens[n].pagina = col + 1 + (cfg.paginasAntes || 0);
    }
  } catch (err) {
    if (window.console) console.error("Sumário: não foi possível medir as páginas", err);
  } finally {
    if (host && host.parentNode && !window.__manterHostMedicao) host.parentNode.removeChild(host);
  }

  // ---- 3b) números ----
  var algum = false;
  for (var u = 0; u < itens.length; u++) {
    if (itens[u].pagina) { linhas[u].textContent = String(itens[u].pagina); algum = true; }
    else linhas[u].textContent = "";
  }
  if (!algum) lista.className = "sm-sem-num";
  return { ok: algum, itens: itens.length };
}

(function () {
          var RUNTIME_SRC = document.currentScript ? document.currentScript.src : location.href;
          var PDFS = JSON.parse(document.getElementById("umb-pdfs").textContent || "[]");
          var jaImprimiu = false;
          function dispararImpressao() {
            if (jaImprimiu) return;
            jaImprimiu = true;
            window.print();
          }
          function b64ParaBytes(dataURL) {
            var b = atob(String(dataURL).split(",")[1] || "");
            var u = new Uint8Array(b.length);
            for (var i = 0; i < b.length; i++) u[i] = b.charCodeAt(i);
            return u;
          }
          // Plano B (sem internet / pdf.js indisponível): PDF dentro de um quadro, como antes.
          function quadroPdf(i) {
            var alvo = document.getElementById("anexoPdfAlvo" + i);
            if (!alvo) return;
            alvo.innerHTML = "";
            var f = document.createElement("iframe");
            f.className = "anexo-pdf-embed";
            f.title = PDFS[i].nome;
            f.src = URL.createObjectURL(new Blob([b64ParaBytes(PDFS[i].dataURL)], { type: "application/pdf" }));
            alvo.appendChild(f);
            var p = document.createElement("p");
            p.className = "anexo-pdf-fallback-link";
            p.textContent = "Se a página deste anexo sair em branco na impressão, abra o anexo pelo app (aba Anexos) e imprima por lá: " + PDFS[i].nome;
            alvo.appendChild(p);
          }
          async function desenharPdf(i) {
            var alvo = document.getElementById("anexoPdfAlvo" + i);
            var doc = await window.pdfjsLib.getDocument({ data: b64ParaBytes(PDFS[i].dataURL) }).promise;
            alvo.innerHTML = "";
            for (var n = 1; n <= doc.numPages; n++) {
              var page = await doc.getPage(n);
              var vp = page.getViewport({ scale: 1.6 });
              var c = document.createElement("canvas");
              c.width = vp.width; c.height = vp.height;
              c.className = "anexo-pdf-pg";
              await page.render({ canvasContext: c.getContext("2d"), viewport: vp }).promise;
              alvo.appendChild(c);
            }
          }
          async function principal() {
            var usouQuadro = false;
            if (PDFS.length) {
              if (window.pdfjsLib) {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("vendor/pdf.worker.min.js", RUNTIME_SRC).href;
                for (var i = 0; i < PDFS.length; i++) {
                  try {
                    await Promise.race([desenharPdf(i), new Promise(function (_, rej) { setTimeout(function () { rej(new Error("tempo esgotado ao desenhar o PDF anexo")); }, 30000); })]);
                  } catch (e) { console.error(e); usouQuadro = true; quadroPdf(i); }
                }
              } else {
                usouQuadro = true;
                for (var k = 0; k < PDFS.length; k++) quadroPdf(k);
              }
            }
            // Sumário com as páginas medidas (capa = página 1; a folha de rosto começa na 2).
            try { sumarioPafNaJanela(JSON.parse(document.getElementById("umb-cfg").textContent)); } catch (e) { console.error(e); }
            setTimeout(dispararImpressao, usouQuadro ? 1200 + PDFS.length * 700 : (PDFS.length ? 300 : 50));
          }
          // Rede de segurança: se algo travar, a janela de impressão abre mesmo assim.
          setTimeout(dispararImpressao, 90000);
          window.onload = function () {
            var esperar = (document.fonts && document.fonts.ready) ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
            esperar.then(principal, principal);
          };
        })();
