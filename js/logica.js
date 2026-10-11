// Regras de negócio da ferramenta. Funções puras: não acessam a página nem o armazenamento,
// o que permite testá-las com o Node (pasta testes/).

export const STATUS_VALIDOS = ["ok", "ajustar", "verificar"];
export const ROTULO_STATUS = { ok: "Em dia", ajustar: "Ajustar", verificar: "Conferir", "": "Sem resposta" };

// Ordem de exibição: o que precisa de ajuste vem antes do que precisa ser conferido,
// depois o que não foi respondido e, por último, o que já está em dia.
const ORDEM_STATUS = { ajustar: 0, verificar: 1, "": 2, ok: 3 };

// Quantas posições uma regra desce quando a plataforma já impõe a prática
// (por exemplo, a instalação fora da loja oficial no iPhone).
const REBAIXAMENTO = 3;

export function statusDaRegra(regra, respostas) {
  const valor = respostas[regra.id];
  const opcao = regra.opcoes.find((o) => o.valor === valor);
  return opcao ? opcao.status : "";
}

export function prioridadeEfetiva(regra, plataforma) {
  const rebaixar = Array.isArray(regra.rebaixar_em) && regra.rebaixar_em.includes(plataforma);
  return regra.prioridade + (rebaixar ? REBAIXAMENTO : 0);
}

export function ordenar(regras, respostas, plataforma) {
  return regras
    .map((regra) => ({ regra, status: statusDaRegra(regra, respostas) }))
    .sort(
      (a, b) =>
        ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status] ||
        prioridadeEfetiva(a.regra, plataforma) - prioridadeEfetiva(b.regra, plataforma)
    );
}

export function resumo(regras, respostas) {
  const contagem = { ok: 0, ajustar: 0, verificar: 0, respondidas: 0, total: regras.length };
  for (const regra of regras) {
    const s = statusDaRegra(regra, respostas);
    if (s) {
      contagem[s] += 1;
      contagem.respondidas += 1;
    }
  }
  return contagem;
}

export function mensagemResumo(c) {
  const pendentes = c.ajustar + c.verificar;
  if (c.respondidas === 0) return "Responda às perguntas para ver o diagnóstico. A lista abaixo já está na ordem de prioridade.";
  if (c.respondidas < c.total) {
    const parte = pendentes === 0 ? "Nada a ajustar até agora." : `${pendentes} ${pendentes === 1 ? "item pede" : "itens pedem"} atenção até agora.`;
    return `${c.respondidas} de ${c.total} perguntas respondidas. ${parte}`;
  }
  if (pendentes === 0) return "Tudo em dia. Refaça o checkup ao trocar de aparelho ou depois de uma grande atualização.";
  return "Comece pelo item 1 da lista: os itens estão em ordem do que mais protege contra golpes.";
}

// Divide um texto da base de regras em partes simples e partes de caminho de menu ([[...]]).
// A interface monta os elementos a partir dessas partes, sem nunca interpretar HTML vindo dos dados.
export function partesDoTexto(texto) {
  const partes = [];
  const re = /\[\[(.+?)\]\]/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(texto)) !== null) {
    if (m.index > ultimo) partes.push({ tipo: "texto", valor: texto.slice(ultimo, m.index) });
    partes.push({ tipo: "caminho", valor: m[1] });
    ultimo = re.lastIndex;
  }
  if (ultimo < texto.length) partes.push({ tipo: "texto", valor: texto.slice(ultimo) });
  return partes;
}

export function planoEmTexto(regras, respostas, plataforma) {
  const nome = plataforma === "ios" ? "iPhone" : "Android";
  const pendentes = ordenar(regras, respostas, plataforma).filter((x) => x.status === "ajustar" || x.status === "verificar");
  const limpar = (t) => t.replace(/\[\[(.+?)\]\]/g, "$1");
  if (pendentes.length === 0) return `Checkup de Segurança do Celular (${nome}): nenhuma proteção pendente.`;
  const linhas = [`Checkup de Segurança do Celular (${nome}) — o que falta fazer:`, ""];
  pendentes.forEach(({ regra }, i) => {
    linhas.push(`${i + 1}. ${regra.titulo}`);
    regra.passos[plataforma].forEach((p) => linhas.push(`   - ${limpar(p)}`));
    linhas.push("");
  });
  return linhas.join("\n").trim();
}
