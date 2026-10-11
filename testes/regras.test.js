// Testes automatizados. Rodar com: npm test  (ou node --test)
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STATUS_VALIDOS, statusDaRegra, ordenar, resumo, partesDoTexto, planoEmTexto, prioridadeEfetiva } from "../js/logica.js";

const base = JSON.parse(readFileSync(new URL("../dados/regras.json", import.meta.url), "utf8"));
const regras = base.regras;

test("a base tem as 8 regras previstas, com ids e prioridades únicos", () => {
  assert.equal(regras.length, 8);
  assert.equal(new Set(regras.map((r) => r.id)).size, regras.length);
  assert.equal(new Set(regras.map((r) => r.prioridade)).size, regras.length);
});

test("toda regra tem pergunta, evidência, nota e passos para as duas plataformas", () => {
  for (const r of regras) {
    for (const campo of ["titulo", "pergunta", "evidencia", "nota"]) assert.ok(r[campo]?.trim(), `${r.id}: falta ${campo}`);
    for (const p of ["android", "ios"]) assert.ok(r.passos[p]?.length >= 1, `${r.id}: sem passos para ${p}`);
  }
});

test("toda opção usa um status válido e toda regra tem ao menos uma opção 'ok'", () => {
  for (const r of regras) {
    for (const o of r.opcoes) assert.ok(STATUS_VALIDOS.includes(o.status), `${r.id}/${o.valor}: status inválido`);
    assert.ok(r.opcoes.some((o) => o.status === "ok"), `${r.id}: nenhuma opção 'ok'`);
  }
});

test("nenhum texto da base contém marcação HTML (proteção contra injeção de código)", () => {
  const textos = JSON.stringify(base);
  assert.doesNotMatch(textos, /<[a-z/!]/i);
});

test("sem respostas, a lista segue a prioridade definida pela pesquisa", () => {
  const ids = ordenar(regras, {}, "android").map((x) => x.regra.id);
  assert.deepEqual(ids, ["whats", "conta", "metodo", "atual", "loja", "bloq", "filtro", "roubo"]);
});

test("no iPhone, a regra da loja oficial desce na lista", () => {
  const loja = regras.find((r) => r.id === "loja");
  assert.ok(prioridadeEfetiva(loja, "ios") > prioridadeEfetiva(loja, "android"));
  const ids = ordenar(regras, {}, "ios").map((x) => x.regra.id);
  assert.ok(ids.indexOf("loja") > ids.indexOf("bloq"));
});

test("itens a ajustar aparecem antes dos itens em dia", () => {
  const respostas = { whats: "sim", roubo: "nao" };
  const lista = ordenar(regras, respostas, "android");
  assert.equal(lista[0].regra.id, "roubo");
  assert.equal(lista.at(-1).regra.id, "whats");
});

test("o resumo conta corretamente cada situação", () => {
  const respostas = { whats: "sim", conta: "naosei", metodo: "sms", bloq: "forte" };
  assert.deepEqual(resumo(regras, respostas), { ok: 2, ajustar: 1, verificar: 1, respondidas: 4, total: 8 });
  assert.equal(statusDaRegra(regras[0], { whats: "valor-inexistente" }), "");
});

test("caminhos de menu entre [[ ]] são separados do texto comum", () => {
  assert.deepEqual(partesDoTexto("Abra [[Ajustes › Geral]] agora"), [
    { tipo: "texto", valor: "Abra " },
    { tipo: "caminho", valor: "Ajustes › Geral" },
    { tipo: "texto", valor: " agora" }
  ]);
});

test("o plano em texto lista só o que está pendente, sem marcações", () => {
  const plano = planoEmTexto(regras, { whats: "nao", conta: "sim" }, "android");
  assert.match(plano, /WhatsApp/);
  assert.doesNotMatch(plano, /Duas etapas na conta principal/);
  assert.doesNotMatch(plano, /\[\[|\]\]/);
});
