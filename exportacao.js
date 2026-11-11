/* =====================================================================
   exportacao.js — geração de arquivos do PAF (sem bibliotecas externas)

   • criarZip(arquivos)            → Blob .zip (com compressão quando o navegador permite)
   • htmlParaDocx(html, opcoes)    → Blob .docx de verdade (Office Open XML), a partir do HTML
                                      que o app já monta para o Word. Abre sem aviso no Word,
                                      LibreOffice, Google Docs, WPS e no celular.
   • htmlParaTexto(html)           → texto simples (.txt) legível
   • dataURLParaBytes / baixarBlob / nomeSeguro — utilitários

   Tudo roda no próprio aparelho (nenhum dado sai dele) e respeita o CSP do index.html
   (só scripts 'self').
   ===================================================================== */
(function (global) {
  "use strict";

  /* ------------------------------ utilitários ------------------------------ */

  const ENC = new TextEncoder();

  function nomeSeguro(nome, reserva) {
    const n = String(nome || "").replace(/[\\/:*?"<>|\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().replace(/^\.+/, "");
    return (n || reserva || "arquivo").slice(0, 150);
  }

  function dataURLParaBytes(dataURL) {
    const m = /^data:([^;,]*)(;base64)?,(.*)$/s.exec(String(dataURL || ""));
    if (!m) return null;
    let bytes;
    if (m[2]) {
      const bin = atob(m[3]);
      bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    } else {
      bytes = ENC.encode(decodeURIComponent(m[3]));
    }
    return { tipo: m[1] || "application/octet-stream", bytes };
  }

  function baixarBlob(nomeArquivo, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revogar na hora cancela o download em alguns navegadores (Safari/Firefox): espera um pouco.
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  const xe = (s) => String(s)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ------------------------------ ZIP ------------------------------ */

  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();

  function crc32(u8) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < u8.length; i++) c = CRC_TABLE[(c ^ u8[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  async function deflateRaw(u8) {
    if (typeof CompressionStream === "undefined") return null;
    try {
      const stream = new Blob([u8]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) { return null; }
  }

  const JA_COMPRIMIDO = /\.(jpe?g|png|gif|webp|pdf|zip|docx|xlsx|odt)$/i;

  /* arquivos: [{ nome: "pasta/arquivo.ext", dados: Uint8Array | string }] */
  async function criarZip(arquivos) {
    const partes = [];
    const central = [];
    let offset = 0;
    const agora = new Date();
    const dosTime = (agora.getHours() << 11) | (agora.getMinutes() << 5) | (agora.getSeconds() >> 1);
    const dosDate = ((Math.max(agora.getFullYear(), 1980) - 1980) << 9) | ((agora.getMonth() + 1) << 5) | agora.getDate();

    for (const arq of arquivos) {
      const nome = ENC.encode(String(arq.nome).replace(/\\/g, "/").replace(/^\/+/, ""));
      const dados = typeof arq.dados === "string" ? ENC.encode(arq.dados) : arq.dados;
      const crc = crc32(dados);
      let metodo = 0, corpo = dados;
      if (dados.length > 128 && !JA_COMPRIMIDO.test(arq.nome)) {
        const d = await deflateRaw(dados);
        if (d && d.length < dados.length) { metodo = 8; corpo = d; }
      }
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true);
      loc.setUint16(4, 20, true);
      loc.setUint16(6, 0x0800, true);            // nomes em UTF-8
      loc.setUint16(8, metodo, true);
      loc.setUint16(10, dosTime, true);
      loc.setUint16(12, dosDate, true);
      loc.setUint32(14, crc, true);
      loc.setUint32(18, corpo.length, true);
      loc.setUint32(22, dados.length, true);
      loc.setUint16(26, nome.length, true);
      loc.setUint16(28, 0, true);
      partes.push(new Uint8Array(loc.buffer), nome, corpo);

      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true);
      cen.setUint16(4, 20, true);
      cen.setUint16(6, 20, true);
      cen.setUint16(8, 0x0800, true);
      cen.setUint16(10, metodo, true);
      cen.setUint16(12, dosTime, true);
      cen.setUint16(14, dosDate, true);
      cen.setUint32(16, crc, true);
      cen.setUint32(20, corpo.length, true);
      cen.setUint32(24, dados.length, true);
      cen.setUint16(28, nome.length, true);
      cen.setUint32(42, offset, true);
      central.push(new Uint8Array(cen.buffer), nome);

      offset += 30 + nome.length + corpo.length;
    }
    const tamCentral = central.reduce((s, p) => s + p.length, 0);
    const fim = new DataView(new ArrayBuffer(22));
    fim.setUint32(0, 0x06054b50, true);
    fim.setUint16(8, arquivos.length, true);
    fim.setUint16(10, arquivos.length, true);
    fim.setUint32(12, tamCentral, true);
    fim.setUint32(16, offset, true);
    return new Blob([...partes, ...central, new Uint8Array(fim.buffer)], { type: "application/zip" });
  }

  /* ------------------------------ HTML → DOCX ------------------------------ */

  const LARGURA_TEXTO = 9071;   // A4 (11906) − margem esq. 3 cm (1701) − dir. 2 cm (1134), em twips
  const NS = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
    'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
    'xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ' +
    'xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"';

  const CACHE_ESTILO = new WeakMap();
  function estilo(el) {
    if (!el || !el.getAttribute) return {};
    if (CACHE_ESTILO.has(el)) return CACHE_ESTILO.get(el);
    const o = {};
    const s = el.getAttribute("style");
    if (s) s.split(";").forEach((p) => {
      const i = p.indexOf(":");
      if (i > 0) o[p.slice(0, i).trim().toLowerCase()] = p.slice(i + 1).trim().toLowerCase();
    });
    CACHE_ESTILO.set(el, o);
    return o;
  }

  function paraPt(v) {               // "10pt" | "4px" | "0" → pontos
    const m = /^(-?[\d.]+)\s*(pt|px|cm|mm|in)?$/.exec(String(v || "").trim());
    if (!m) return 0;
    const n = parseFloat(m[1]);
    switch (m[2]) { case "px": return n * 0.75; case "cm": return n * 28.35; case "mm": return n * 2.835; case "in": return n * 72; default: return n; }
  }

  function margensVerticais(sty) {   // → [antes, depois] em twips
    let t = 0, b = 0;
    if (sty.margin) {
      const v = sty.margin.split(/\s+/).map(paraPt);
      if (v.length === 1) { t = b = v[0]; } else if (v.length === 2) { t = b = v[0]; } else { t = v[0]; b = v[2]; }
    }
    if (sty["margin-top"]) t = paraPt(sty["margin-top"]);
    if (sty["margin-bottom"]) b = paraPt(sty["margin-bottom"]);
    return [Math.max(0, Math.round(t * 20)), Math.max(0, Math.round(b * 20))];
  }

  function lerBorda(v) {             // "1pt solid #000" → {sz, val, cor} | "nil" | null
    if (!v) return null;
    if (/^(none|0|hidden)/.test(v)) return "nil";
    const m = /([\d.]+)(pt|px)?\s+(solid|dashed|dotted|double)?\s*(#[0-9a-f]{3,6})?/.exec(v);
    if (!m) return null;
    let pt = parseFloat(m[1]) * (m[2] === "px" ? 0.75 : 1);
    let cor = (m[4] || "#000000").slice(1);
    if (cor.length === 3) cor = cor.split("").map((c) => c + c).join("");
    return { sz: Math.min(96, Math.max(2, Math.round(pt * 8))), val: m[3] === "dashed" ? "dashed" : m[3] === "dotted" ? "dotted" : m[3] === "double" ? "double" : "single", cor };
  }

  function bordasDe(sty) {
    const b = { top: null, left: null, bottom: null, right: null };
    const todas = lerBorda(sty.border);
    if (todas) b.top = b.left = b.bottom = b.right = todas;
    for (const lado of ["top", "left", "bottom", "right"]) {
      const v = lerBorda(sty["border-" + lado]);
      if (v) b[lado] = v;
    }
    return b;
  }

  function bordaXml(tag, b) {
    if (!b) return "";
    if (b === "nil") return `<w:${tag} w:val="nil"/>`;
    return `<w:${tag} w:val="${b.val}" w:sz="${b.sz}" w:space="0" w:color="${b.cor}"/>`;
  }

  function aplicaEstilo(el, ctx) {
    const c = { ...ctx };
    const tag = el.tagName.toLowerCase();
    const sty = estilo(el);
    if (tag === "b" || tag === "strong" || tag === "th") c.bold = true;
    if (tag === "i" || tag === "em") c.italic = true;
    if (tag === "u") c.u = true;
    if (/^h[1-6]$/.test(tag)) { c.bold = true; }
    if (sty["font-weight"]) c.bold = /bold|[6-9]00/.test(sty["font-weight"]);
    if (sty["font-style"]) c.italic = sty["font-style"] === "italic";
    if ((sty["text-decoration"] || "").includes("underline")) c.u = true;
    if (sty["font-size"]) { const pt = paraPt(sty["font-size"]); if (pt > 0) c.sz = Math.round(pt * 2); }
    if (sty["text-align"]) c.align = sty["text-align"];
    else if (el.getAttribute && el.getAttribute("align")) c.align = el.getAttribute("align").toLowerCase();
    if (sty["line-height"]) {
      const m = /([\d.]+)%/.exec(sty["line-height"]);
      if (m) c.line = Math.round(parseFloat(m[1]) * 2.4);
    }
    return c;
  }

  function runXml(texto, c) {
    const rpr = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>' +
      (c.bold ? "<w:b/><w:bCs/>" : "") + (c.italic ? "<w:i/><w:iCs/>" : "") +
      `<w:sz w:val="${c.sz}"/><w:szCs w:val="${c.sz}"/>` + (c.u ? '<w:u w:val="single"/>' : "");
    return `<w:r><w:rPr>${rpr}</w:rPr><w:t xml:space="preserve">${xe(texto)}</w:t></w:r>`;
  }

  function paragrafoXml(itens, pctx, props) {
    props = props || {};
    // apara o espaço sobrando no fim da linha
    for (let i = itens.length - 1; i >= 0; i--) {
      if (itens[i].t != null) { itens[i].t = itens[i].t.replace(/ +$/, ""); if (itens[i].t === "") { itens.splice(i, 1); continue; } break; }
      break;
    }
    const jc = { left: "left", start: "left", right: "right", end: "right", center: "center", justify: "both" }[pctx.align] || "both";
    let ppr = "";
    if (props.keepNext) ppr += "<w:keepNext/>";
    if (props.borda) {
      const bd = '<w:{L} w:val="single" w:sz="8" w:space="4" w:color="000000"/>';
      ppr += "<w:pBdr>" + ["top", "left", "bottom", "right"].map((l) => bd.replace("{L}", l)).join("") + "</w:pBdr>";
    }
    ppr += `<w:spacing w:before="${props.antes || 0}" w:after="${props.depois || 0}" w:line="${props.linhaExata || pctx.line}" w:lineRule="${props.linhaExata ? "exact" : "auto"}"/>`;
    if (props.borda) ppr += '<w:ind w:left="113" w:right="113"/>';
    ppr += `<w:jc w:val="${jc}"/>`;
    const corpo = itens.map((it) => it.t != null ? runXml(it.t, it.c) : it.br ? "<w:r><w:br/></w:r>" : it.raw || "").join("");
    return `<w:p><w:pPr>${ppr}</w:pPr>${corpo}</w:p>`;
  }

  /* ---- imagens ---- */

  function carregarImagem(url) {
    return new Promise((ok, erro) => {
      const img = new Image();
      img.onload = () => ok(img);
      img.onerror = () => erro(new Error("imagem inválida"));
      img.src = url;
    });
  }

  async function prepararImagem(src) {
    const d = dataURLParaBytes(src);
    if (!d || !/^image\//.test(d.tipo)) return null;
    const url = URL.createObjectURL(new Blob([d.bytes], { type: d.tipo }));
    try {
      const img = await carregarImagem(url);
      const w = img.naturalWidth || 1, h = img.naturalHeight || 1;
      let ext = d.tipo === "image/jpeg" || d.tipo === "image/jpg" ? "jpeg" : d.tipo === "image/png" ? "png" : d.tipo === "image/gif" ? "gif" : null;
      let bytes = d.bytes;
      if (!ext) {        // webp, avif, svg… → PNG, que o Word entende em qualquer versão
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const cx = cv.getContext("2d");
        cx.fillStyle = "#fff"; cx.fillRect(0, 0, w, h); cx.drawImage(img, 0, 0);
        const blob = await new Promise((r) => cv.toBlob(r, "image/png"));
        if (!blob) return null;
        bytes = new Uint8Array(await blob.arrayBuffer());
        ext = "png";
      }
      return { w, h, ext, bytes };
    } catch (e) {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function imagemRun(img, st, larguraTw) {
    const src = img.getAttribute("src") || "";
    const p = await prepararImagem(src);
    if (!p) return { t: "[imagem não incorporada]", c: st.ctxBase };
    const maxPx = Math.max(60, Math.floor(larguraTw / 15));
    let wpx = parseInt(img.getAttribute("width"), 10) || paraPt(estilo(img).width) / 0.75 || p.w;
    wpx = Math.min(wpx, maxPx);
    let hpx = wpx * p.h / p.w;
    if (hpx > 840) { wpx = wpx * 840 / hpx; hpx = 840; }
    const cx = Math.round(wpx * 9525), cy = Math.round(hpx * 9525);
    const n = ++st.nImg;
    const rid = "rIdImg" + n;
    const arquivo = `media/imagem${n}.${p.ext}`;
    st.midias.push({ nome: "word/" + arquivo, bytes: p.bytes });
    st.rels.push(`<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${arquivo}"/>`);
    st.exts.add(p.ext);
    const alt = xe(img.getAttribute("alt") || `Imagem ${n}`);
    return {
      raw: `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/>` +
        `<wp:docPr id="${n}" name="Imagem ${n}" descr="${alt}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>` +
        `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic>` +
        `<pic:nvPicPr><pic:cNvPr id="${n}" name="imagem${n}.${p.ext}" descr="${alt}"/><pic:cNvPicPr/></pic:nvPicPr>` +
        `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
        `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
        `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`
    };
  }

  /* ---- tabelas ---- */

  function filhosTabela(t) {
    const linhas = [];
    for (const f of t.children) {
      const tag = f.tagName.toLowerCase();
      if (tag === "tr") linhas.push(f);
      else if (tag === "tbody" || tag === "thead" || tag === "tfoot") for (const r of f.children) if (r.tagName.toLowerCase() === "tr") linhas.push(r);
    }
    return linhas;
  }
  const celulasDe = (tr) => [...tr.children].filter((c) => /^(td|th)$/i.test(c.tagName));
  const spanDe = (c) => Math.max(1, parseInt(c.getAttribute("colspan"), 10) || 1);

  function larguraColunas(linhas, n, total) {
    const pct = new Array(n).fill(null);
    const soma = new Array(n).fill(0), qtd = new Array(n).fill(0), pal = new Array(n).fill(0);
    linhas.forEach((tr, ri) => {
      let col = 0;
      celulasDe(tr).forEach((c) => {
        const sp = spanDe(c);
        if (sp === 1 && col < n) {
          const txt = (c.textContent || "").replace(/\s+/g, " ").trim();
          soma[col] += Math.min(txt.length, 90); qtd[col]++;
          pal[col] = Math.max(pal[col], Math.min(Math.max(0, ...txt.split(" ").map((w) => w.length)), 16));
          const m = /([\d.]+)%/.exec(estilo(c).width || "");
          if (m && ri === 0) pct[col] = parseFloat(m[1]);
        }
        col += sp;
      });
    });
    const fixoTotal = pct.reduce((s, v) => s + (v || 0), 0);
    const livres = pct.map((v, i) => v == null ? i : -1).filter((i) => i >= 0);
    const resto = Math.max(100 - fixoTotal, livres.length * 8);
    const pesos = livres.map((i) => Math.max(qtd[i] ? soma[i] / qtd[i] : 6, pal[i] * 1.15, 5));
    const somaPesos = pesos.reduce((s, v) => s + v, 0) || 1;
    let partes = pct.map((v) => v);
    livres.forEach((i, k) => { partes[i] = resto * pesos[k] / somaPesos; });
    const min = 100 / n * 0.5 > 7 ? 7 : 100 / n * 0.5;           // nenhuma coluna abaixo de ~7%
    partes = partes.map((v) => Math.max(v, min));
    const s = partes.reduce((a, b) => a + b, 0);
    const tw = partes.map((v) => Math.floor(total * v / s));
    tw[tw.length - 1] += total - tw.reduce((a, b) => a + b, 0);
    // nenhuma coluna pode ficar mais estreita que a sua maior palavra (evita "Encaminhamento|s")
    const minTw = pal.map((p) => Math.min(p * 118 + 240, Math.floor(total / 3)));
    for (let k = 0; k < 6; k++) {
      let falta = 0;
      tw.forEach((w, i) => { if (w < minTw[i]) { falta += minTw[i] - w; tw[i] = minTw[i]; } });
      if (!falta) break;
      const folgas = tw.map((w, i) => Math.max(0, w - minTw[i]));
      const totalFolga = folgas.reduce((a, b) => a + b, 0) || 1;
      tw.forEach((w, i) => { tw[i] = w - Math.round(falta * folgas[i] / totalFolga); });
      tw[tw.length - 1] += total - tw.reduce((a, b) => a + b, 0);
    }
    return tw;
  }

  async function tabelaXml(t, c, st, larguraTw) {
    const sty = estilo(t);
    const dados = t.classList.contains("dados");
    const linhas = filhosTabela(t);
    if (!linhas.length) return "";
    const n = Math.max(1, ...linhas.map((tr) => celulasDe(tr).reduce((s, x) => s + spanDe(x), 0)));
    const cols = larguraColunas(linhas, n, larguraTw);
    const cellpad = t.getAttribute("cellpadding") != null ? Math.round(parseFloat(t.getAttribute("cellpadding")) * 15) : null;
    const bt = bordasDe(sty);

    let xml = `<w:tbl><w:tblPr><w:tblW w:w="${larguraTw}" w:type="dxa"/>`;
    if (bt.top || bt.left || bt.bottom || bt.right) {
      xml += "<w:tblBorders>" + bordaXml("top", bt.top) + bordaXml("left", bt.left) + bordaXml("bottom", bt.bottom) + bordaXml("right", bt.right) + "</w:tblBorders>";
    }
    xml += '<w:tblLayout w:type="fixed"/><w:tblLook w:val="0000"/></w:tblPr><w:tblGrid>' + cols.map((w) => `<w:gridCol w:w="${w}"/>`).join("") + "</w:tblGrid>";

    for (let ri = 0; ri < linhas.length; ri++) {
      const tr = linhas[ri];
      const cels = celulasDe(tr);
      const ehCab = ri === 0 && cels.length && cels.every((x) => x.tagName.toLowerCase() === "th");
      xml += "<w:tr>" + (ehCab ? "<w:trPr><w:tblHeader/></w:trPr>" : "");
      let col = 0;
      for (const td of cels) {
        const sp = Math.min(spanDe(td), Math.max(1, n - col));
        const w = cols.slice(col, col + sp).reduce((a, b) => a + b, 0);
        col += sp;
        const ts = estilo(td);
        let cc = aplicaEstilo(td, { ...c, line: 276, align: "left", sz: dados ? 20 : c.sz, bold: false, italic: false });
        if (td.tagName.toLowerCase() === "th" && dados && !ts["text-align"]) cc.align = "center";
        if (td.classList.contains("anotacao")) { cc.sz = dados ? 20 : 24; cc.line = dados ? 276 : 360; cc.align = dados ? "left" : "justify"; }

        // bordas: tabelas "dados" têm grade preta; nas demais vale o que a célula declara
        const bc = bordasDe(ts);
        const padrao = dados ? { sz: 8, val: "single", cor: "000000" } : null;
        const b = {
          top: bc.top || padrao, left: bc.left || padrao, bottom: bc.bottom || padrao, right: bc.right || padrao
        };
        let pad = [40, 100, 40, 100];     // cima, esquerda, baixo, direita
        if (dados) pad = [60, 100, 60, 100];
        else if (cellpad != null) pad = [cellpad, cellpad, cellpad, cellpad];
        if (ts.padding) {
          const v = ts.padding.split(/\s+/).map((x) => Math.round(paraPt(x) * 20));
          pad = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : [v[0], v[1], v[2], v[3]];
        }
        const interna = Math.max(600, w - pad[1] - pad[3]);
        const blocos = await converterFilhos(td, cc, st, { emCelula: true, largura: interna });
        xml += `<w:tc><w:tcPr><w:tcW w:w="${w}" w:type="dxa"/>${sp > 1 ? `<w:gridSpan w:val="${sp}"/>` : ""}` +
          `<w:tcBorders>${bordaXml("top", b.top)}${bordaXml("left", b.left)}${bordaXml("bottom", b.bottom)}${bordaXml("right", b.right)}</w:tcBorders>` +
          `<w:tcMar><w:top w:w="${pad[0]}" w:type="dxa"/><w:left w:w="${pad[1]}" w:type="dxa"/><w:bottom w:w="${pad[2]}" w:type="dxa"/><w:right w:w="${pad[3]}" w:type="dxa"/></w:tcMar>` +
          `<w:vAlign w:val="top"/></w:tcPr>${blocos.join("")}</w:tc>`;
      }
      xml += "</w:tr>";
    }
    return xml + "</w:tbl>";
  }

  /* ---- percurso do DOM ---- */

  const IGNORAR = new Set(["script", "style", "head", "title", "meta", "link", "noscript"]);
  const BLOCOS = new Set(["p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "section", "article", "header", "footer", "pre", "hr"]);

  /* Converte os filhos de um elemento em uma lista de blocos XML (<w:p> e <w:tbl>). */
  async function converterFilhos(pai, ctx, st, opc) {
    opc = opc || {};
    const larguraTw = opc.largura || LARGURA_TEXTO;
    const blocos = [];
    let itens = [];
    const propsBase = opc.props || {};
    st.ctxBase = ctx;

    const espacador = (alturaTw) => `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.max(40, alturaTw)}" w:lineRule="exact"/></w:pPr></w:p>`;

    const flush = (forcar) => {
      if (itens.length || forcar) {
        blocos.push(paragrafoXml(itens, ctx, propsBase));
      }
      itens = [];
    };

    async function visita(n, c) {
      if (n.nodeType === 3) {
        let txt = n.nodeValue.replace(/[ \t\r\n\f]+/g, " ");
        const ult = itens[itens.length - 1];
        if (!ult || ult.br || (ult.t != null && /\s$/.test(ult.t) && txt.startsWith(" "))) txt = txt.replace(/^ /, "");
        if (txt) itens.push({ t: txt, c });
        return;
      }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (IGNORAR.has(tag)) return;
      if (tag === "br") { itens.push({ br: true }); return; }
      if (tag === "img") { itens.push(await imagemRun(n, st, larguraTw)); return; }

      const c2 = aplicaEstilo(n, c);
      const sty = estilo(n);

      if (tag === "table") {
        flush();
        if (blocos.length && /^<w:tbl>/.test(blocos[blocos.length - 1])) blocos.push(espacador(60));   // duas tabelas coladas virariam uma só no Word
        blocos.push(await tabelaXml(n, c, st, larguraTw));
        const [, depois] = margensVerticais(sty);
        if (!opc.emCelula) blocos.push(espacador(Math.max(depois, 80)));
        return;
      }

      const bloco = BLOCOS.has(tag) || (tag === "span" && sty.display === "block");
      if (bloco) {
        flush();
        if (tag === "hr") { blocos.push(`<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="000000"/></w:pBdr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>`); return; }
        const props = {};
        if (tag === "p" || /^h[1-6]$/.test(tag)) {
          const [antes, depois] = margensVerticais(sty);
          props.antes = antes; props.depois = depois;
        }
        if (n.classList && n.classList.contains("titulo-secao")) props.keepNext = true;
        if ((sty["page-break-after"] || "") === "avoid") props.keepNext = true;
        const bd = bordasDe(sty);
        if ((bd.top && bd.top !== "nil") || (n.classList && n.classList.contains("anotacao") && !opc.emCelula)) props.borda = true;
        if (n.classList && n.classList.contains("anotacao") && !opc.emCelula) { c2.sz = 24; c2.line = 360; c2.align = "justify"; }
        if (n.classList && n.classList.contains("MsoHeader")) return;

        const sub = await converterFilhos(n, c2, st, {
          emCelula: opc.emCelula, largura: larguraTw, props, marcador: tag === "li" ? (n.parentElement && n.parentElement.tagName.toLowerCase() === "ol" ? (Array.prototype.indexOf.call(n.parentElement.children, n) + 1) + ". " : "• ") : null
        });
        // <p> vazio ainda ocupa uma linha
        if (!sub.length && (tag === "p")) blocos.push(paragrafoXml([], c2, props));
        blocos.push(...sub);
        return;
      }

      // inline (span, b, i, a, small, sup…)
      for (const f of n.childNodes) await visita(f, c2);
      // "etiquetas" (spans com preenchimento) seguidas viram lista separada por ponto e vírgula
      const prox = n.nextElementSibling;
      if (tag === "span" && sty.padding && prox && prox.tagName.toLowerCase() === "span" && estilo(prox).padding) itens.push({ t: ";", c: c2 });
    }

    if (opc.marcador) itens.push({ t: opc.marcador, c: ctx });
    for (const f of pai.childNodes) await visita(f, ctx);
    flush();
    // toda célula precisa terminar em parágrafo
    if (opc.emCelula && (!blocos.length || /^<w:tbl>/.test(blocos[blocos.length - 1]))) blocos.push(espacador(40));
    return blocos;
  }

  function estilosXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles ${NS}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:eastAsia="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="pt-BR" w:eastAsia="pt-BR" w:bidi="ar-SA"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="character" w:default="1" w:styleId="DefaultParagraphFont"><w:name w:val="Default Paragraph Font"/><w:uiPriority w:val="1"/><w:semiHidden/></w:style>
<w:style w:type="table" w:default="1" w:styleId="TableNormal"><w:name w:val="Normal Table"/><w:uiPriority w:val="99"/><w:semiHidden/><w:tblPr><w:tblInd w:w="0" w:type="dxa"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="108" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="108" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
<w:style w:type="numbering" w:default="1" w:styleId="NoList"><w:name w:val="No List"/><w:uiPriority w:val="99"/><w:semiHidden/></w:style>
</w:styles>`;
  }

  /* html: string com o HTML montado pelo app (o mesmo do Word). opcoes: { titulo, autor } */
  async function htmlParaDocx(html, opcoes) {
    opcoes = opcoes || {};
    const dom = new DOMParser().parseFromString(String(html), "text/html");
    const raiz = dom.querySelector("div.Section1") || dom.body;
    const st = { nImg: 0, midias: [], rels: [], exts: new Set(), ctxBase: null };
    const ctx0 = { sz: 24, line: 360, align: "justify", bold: false, italic: false, u: false };
    const blocos = await converterFilhos(raiz, ctx0, st, {});
    if (!blocos.length) blocos.push(paragrafoXml([], ctx0, {}));

    const sect = `<w:sectPr><w:headerReference w:type="default" r:id="rIdHdr1"/><w:pgSz w:w="11906" w:h="16838"/>` +
      `<w:pgMar w:top="1701" w:right="1134" w:bottom="1134" w:left="1701" w:header="1134" w:footer="567" w:gutter="0"/></w:sectPr>`;
    const documento = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${NS}><w:body>${blocos.join("")}${sect}</w:body></w:document>`;

    const cabecalho = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:hdr ${NS}><w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="276" w:lineRule="auto"/><w:jc w:val="right"/></w:pPr>` +
      `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
      `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>` +
      `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r>` +
      `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>1</w:t></w:r>` +
      `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:hdr>`;

    const tipos = { png: "image/png", jpeg: "image/jpeg", gif: "image/gif" };
    const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
      `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>` +
      [...st.exts].map((e) => `<Default Extension="${e}" ContentType="${tipos[e]}"/>`).join("") +
      `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
      `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
      `<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>` +
      `<Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>` +
      `<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>` +
      `<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`;

    const relsRaiz = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
      `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>` +
      `<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`;

    const relsDoc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
      `<Relationship Id="rIdSty" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
      `<Relationship Id="rIdSet" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>` +
      `<Relationship Id="rIdHdr1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/>` +
      st.rels.join("") + `</Relationships>`;

    const settings = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:settings ${NS}><w:defaultTabStop w:val="709"/><w:compat><w:doNotExpandShiftReturn/><w:compatSetting w:name="compatibilityMode" w:uri="http://schemas.microsoft.com/office/word" w:val="15"/></w:compat></w:settings>`;

    const agora = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">` +
      `<dc:title>${xe(opcoes.titulo || "Plano de Acompanhamento Familiar")}</dc:title><dc:creator>${xe(opcoes.autor || "Umbrela PAIF")}</dc:creator><dc:language>pt-BR</dc:language>` +
      `<dcterms:created xsi:type="dcterms:W3CDTF">${agora}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${agora}</dcterms:modified></cp:coreProperties>`;
    const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>Umbrela PAIF</Application></Properties>`;

    const zip = await criarZip([
      { nome: "[Content_Types].xml", dados: contentTypes },
      { nome: "_rels/.rels", dados: relsRaiz },
      { nome: "word/document.xml", dados: documento },
      { nome: "word/_rels/document.xml.rels", dados: relsDoc },
      { nome: "word/styles.xml", dados: estilosXml() },
      { nome: "word/settings.xml", dados: settings },
      { nome: "word/header1.xml", dados: cabecalho },
      { nome: "docProps/core.xml", dados: core },
      { nome: "docProps/app.xml", dados: app },
      ...st.midias.map((m) => ({ nome: m.nome, dados: m.bytes }))
    ]);
    return new Blob([zip], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  /* ------------------------------ HTML → TXT ------------------------------ */

  function htmlParaTexto(html) {
    const dom = new DOMParser().parseFromString(String(html), "text/html");
    const raiz = dom.querySelector("div.Section1") || dom.body;
    const linhas = [];
    coletar(raiz, linhas);
    // no máximo uma linha em branco seguida
    const limpo = [];
    linhas.forEach((l) => { if (l === "" && (limpo[limpo.length - 1] === "" || !limpo.length)) return; limpo.push(l); });
    while (limpo.length && limpo[limpo.length - 1] === "") limpo.pop();
    return limpo.join("\r\n") + "\r\n";
  }

  function coletar(no, out) {
    let cur = "";
    const fecha = () => {
      const t = cur.replace(/[ \t\r\n\f]+/g, " ").replace(/ /g, " ").trim();
      if (t) out.push(t);
      cur = "";
    };
    const visita = (n) => {
      if (n.nodeType === 3) { cur += n.nodeValue; return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toLowerCase();
      if (IGNORAR.has(tag) || (n.classList && n.classList.contains("MsoHeader"))) return;
      if (tag === "br") { fecha(); return; }
      if (tag === "img") { fecha(); out.push("[imagem: " + (n.getAttribute("alt") || "anexo") + "]"); return; }
      if (tag === "table") { fecha(); tabelaTexto(n, out); out.push(""); return; }
      const bloco = BLOCOS.has(tag) || (tag === "span" && estilo(n).display === "block");
      if (bloco) {
        fecha();
        const titulo = n.classList && n.classList.contains("titulo-secao");
        if (titulo) out.push("");
        if (tag === "li") cur = "• ";
        for (const f of n.childNodes) visita(f);
        fecha();
        return;
      }
      for (const f of n.childNodes) visita(f);
    };
    for (const f of no.childNodes) visita(f);
    fecha();
  }

  function tabelaTexto(t, out) {
    const linhas = filhosTabela(t);
    const dados = t.classList.contains("dados");
    const aninhada = !!t.querySelector("table");
    linhas.forEach((tr, ri) => {
      const celulas = celulasDe(tr);
      const cels = celulas.map((c) => { const l = []; coletar(c, l); return l; });
      if (dados && !aninhada) {
        out.push(cels.map((l) => l.join(" ")).join(" | "));
        if (ri === 0 && celulasDe(tr).every((c) => c.tagName.toLowerCase() === "th")) out.push("-".repeat(40));
      } else {
        cels.forEach((l, i) => {
          if (!l.length) return;
          const primeiro = celulas[i].firstElementChild;
          const rotulado = l.length === 2 && primeiro && estilo(primeiro).display === "block" && paraPt(estilo(primeiro)["font-size"]) <= 10.5 && !celulas[i].querySelector("table");
          if (rotulado) out.push(`${l[0]}: ${l[1]}`); else l.forEach((x) => out.push(x));
        });
      }
    });
  }

  global.Exportacao = { criarZip, htmlParaDocx, htmlParaTexto, dataURLParaBytes, baixarBlob, nomeSeguro, crc32 };
})(typeof window !== "undefined" ? window : globalThis);
