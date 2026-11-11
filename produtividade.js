/* Umbrela · atalhos de teclado da lista (complementa os atalhos já existentes do app.js)
   ↑ ↓ (ou J K) = percorrer os registros · Enter = abrir · N = novo PAF · Esc na busca = limpar */
(function () {
  "use strict";
  var main = document.getElementById("mainArea");
  if (!main) return;

  function linhas() { return Array.prototype.slice.call(main.querySelectorAll(".record-row[data-open]")); }

  // Torna cada linha alcançável pelo teclado (a lista é redesenhada a cada busca/filtro).
  function dica() {
    var b = document.getElementById("searchInput");
    if (b && !b.dataset.dica) { b.dataset.dica = "1"; b.placeholder = (b.placeholder || "Buscar").replace(/…?$/, "") + "…  (atalho: /)"; }
  }
  function marcar() { dica(); linhas().forEach(function (r) { if (!r.hasAttribute("tabindex")) { r.setAttribute("tabindex", "0"); } }); }
  new MutationObserver(marcar).observe(main, { childList: true, subtree: true });
  marcar();

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (document.querySelector("#modalRoot .modal, #modalRoot [role=dialog]")) return;
    var alvo = e.target;
    var tag = alvo && alvo.tagName;
    var digitando = alvo && (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || alvo.isContentEditable);
    var naLista = document.body.dataset.view === "home";
    if (!naLista) return;

    if (e.key === "Escape" && alvo && alvo.id === "searchInput" && alvo.value) {
      alvo.value = "";
      alvo.dispatchEvent(new Event("input", { bubbles: true }));
      return;
    }
    if (e.key === "/" && !digitando) {
      var busca = document.getElementById("searchInput");
      if (busca) { e.preventDefault(); busca.focus(); busca.select(); }
      return;
    }
    if (digitando && !(alvo.id === "searchInput" && e.key === "ArrowDown")) return;

    var rs = linhas();
    var i = rs.indexOf(document.activeElement);
    if (e.key === "ArrowDown" || e.key === "j") {
      if (!rs.length) return;
      e.preventDefault(); (rs[i + 1] || rs[rs.length - 1]).focus();
    } else if (e.key === "ArrowUp" || e.key === "k") {
      if (!rs.length) return;
      e.preventDefault();
      if (i > 0) rs[i - 1].focus(); else { var b = document.getElementById("searchInput"); if (b) b.focus(); }
    } else if (e.key === "Enter" && i >= 0 && alvo === rs[i]) {
      e.preventDefault(); rs[i].click();
    } else if (e.key === "n") {
      var novo = document.getElementById("newPafBtn");
      if (novo) { e.preventDefault(); novo.click(); }
    }
  });
})();

// Ficha: Alt+↑ / Alt+↓ trocam de seção; Alt+← volta à lista (funcionam mesmo digitando).
document.addEventListener("keydown", function (e) {
  if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
  if (!document.querySelector(".tab-rail")) return;
  if (document.querySelector("#modalRoot .modal, #modalRoot [role=dialog]")) return;
  var itens = Array.prototype.slice.call(document.querySelectorAll(".tab-rail .tab-item[data-section]"));
  var i = itens.findIndex(function (x) { return x.classList.contains("active"); });
  if (e.key === "ArrowDown" && itens[i + 1]) { e.preventDefault(); itens[i + 1].click(); }
  else if (e.key === "ArrowUp" && i > 0) { e.preventDefault(); itens[i - 1].click(); }
  else if (e.key === "ArrowLeft") { var v = document.getElementById("backHomeBtn"); if (v) { e.preventDefault(); v.click(); } }
});
