// Camada de interface: monta a página a partir de dados/regras.json e reage às respostas.
import { ROTULO_STATUS, statusDaRegra, ordenar, resumo, mensagemResumo, partesDoTexto, planoEmTexto } from "./logica.js";

const CHAVE = "checkup-seguranca-v1";
const estado = { plataforma: "android", respostas: {}, letra: "normal" };
let REGRAS = [];

const $ = (id) => document.getElementById(id);

function el(tag, attrs = {}, ...filhos) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else n.setAttribute(k, v === true ? "" : v);
  }
  for (const f of filhos.flat()) if (f != null) n.append(f);
  return n;
}

// Texto da base de regras -> nós da página. Caminhos de menu viram <strong>; nada é tratado como HTML.
function textoRico(texto) {
  return partesDoTexto(texto).map((p) => (p.tipo === "caminho" ? el("strong", { class: "path", text: p.valor }) : document.createTextNode(p.valor)));
}

function carregarEstado() {
  try {
    const s = JSON.parse(localStorage.getItem(CHAVE) || "{}");
    if (s.plataforma === "android" || s.plataforma === "ios") estado.plataforma = s.plataforma;
    if (s.respostas && typeof s.respostas === "object") estado.respostas = s.respostas;
    if (s.letra === "grande") estado.letra = "grande";
  } catch (e) { /* armazenamento indisponível: segue sem lembrar */ }
}
function salvarEstado() {
  try { localStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (e) { /* idem */ }
}

function montarPerguntas() {
  const form = $("form");
  form.replaceChildren(
    ...REGRAS.map((r, i) =>
      el("fieldset", { class: "q" },
        el("legend", {}, el("span", { class: "num", text: `${i + 1}.` }), r.pergunta),
        el("div", { class: "opts" },
          r.opcoes.map((o) =>
            el("label", { class: "opt" },
              el("input", { type: "radio", id: `${r.id}-${o.valor}`, name: r.id, value: o.valor, checked: estado.respostas[r.id] === o.valor }),
              el("span", { text: o.rotulo })
            )
          )
        )
      )
    )
  );
}

function montarResultado() {
  const c = resumo(REGRAS, estado.respostas);
  $("big").replaceChildren(String(c.ok), " ", el("small", { text: `de ${c.total} proteções em dia` }));
  $("meter").replaceChildren(...REGRAS.map((r) => el("i", { class: statusDaRegra(r, estado.respostas) })));
  $("resumo").textContent = mensagemResumo(c);
  $("copiar").hidden = c.ajustar + c.verificar === 0;

  let abertos = 0;
  $("cards").replaceChildren(
    ...ordenar(REGRAS, estado.respostas, estado.plataforma).map(({ regra, status }, i) => {
      const abrir = (status === "ajustar" || status === "verificar") && abertos++ < 2;
      return el("details", { class: `card ${status === "ok" ? "done" : ""}`, open: abrir },
        el("summary", {},
          el("span", { class: "rank", text: String(i + 1) }),
          el("h3", { text: regra.titulo }),
          el("span", { class: `chip ${status}`, text: ROTULO_STATUS[status] })
        ),
        el("div", { class: "body" },
          el("p", { class: "evid" }, el("span", { class: "evid-rot", text: "Na pesquisa: " }), regra.evidencia),
          el("ol", {}, regra.passos[estado.plataforma].map((p) => el("li", {}, textoRico(p)))),
          el("p", { class: "note", text: regra.nota })
        )
      );
    })
  );
}

function definirPlataforma(p) {
  estado.plataforma = p;
  document.querySelectorAll(".plat button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.p === p)));
  salvarEstado();
  montarResultado();
}

function definirLetra(l) {
  estado.letra = l;
  document.documentElement.dataset.letra = l;
  $("letra").setAttribute("aria-pressed", String(l === "grande"));
  $("letra").textContent = l === "grande" ? "A− Letra normal" : "A+ Letra maior";
  salvarEstado();
}

async function copiarPlano() {
  const texto = planoEmTexto(REGRAS, estado.respostas, estado.plataforma);
  const aviso = $("copiado");
  try {
    await navigator.clipboard.writeText(texto);
    aviso.textContent = "Plano copiado. Cole no bloco de notas ou envie para você mesmo.";
    $("plano-texto").hidden = true;
  } catch (e) {
    const area = $("plano-texto");
    area.value = texto;
    area.hidden = false;
    area.select();
    aviso.textContent = "Não foi possível copiar automaticamente. O texto está selecionado abaixo: use Copiar do seu aparelho.";
  }
}

async function iniciar() {
  carregarEstado();
  try {
    const resp = await fetch("dados/regras.json", { cache: "no-cache" });
    if (!resp.ok) throw new Error(resp.status);
    const base = await resp.json();
    REGRAS = base.regras;
    $("versao").textContent = `Versão ${base.versao} · instruções revisadas em ${base.revisado_em.split("-").reverse().join("/")}`;
  } catch (e) {
    $("erro").hidden = false;
    return;
  }
  montarPerguntas();
  definirLetra(estado.letra);
  definirPlataforma(estado.plataforma);

  document.querySelectorAll(".plat button").forEach((b) => b.addEventListener("click", () => definirPlataforma(b.dataset.p)));
  $("form").addEventListener("change", (e) => {
    if (e.target.name) { estado.respostas[e.target.name] = e.target.value; salvarEstado(); montarResultado(); }
  });
  $("form").addEventListener("submit", (e) => e.preventDefault());
  $("limpar").addEventListener("click", () => { estado.respostas = {}; salvarEstado(); montarPerguntas(); montarResultado(); $("copiado").textContent = ""; });
  $("letra").addEventListener("click", () => definirLetra(estado.letra === "grande" ? "normal" : "grande"));
  $("copiar").addEventListener("click", copiarPlano);
}

iniciar();
