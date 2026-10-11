# Checkup de Segurança do Celular

Ferramenta web de autoavaliação que mostra a usuários de Android e iPhone quais proteções ativar, em que ordem e onde encontrar cada opção nos menus do aparelho.

Ela é o artefato do Trabalho de Conclusão de Curso **"Arquitetura de Segurança em Dispositivos Móveis: Análise Comparativa entre Android e iOS frente à Engenharia Social e a Adoção de Controles pelo Usuário Final"** (Análise e Desenvolvimento de Sistemas, UNISINOS, 2026). A ordem das recomendações e os percentuais exibidos vêm de um questionário respondido por 142 usuários brasileiros de smartphone.

**Acesse:** https://SEU-USUARIO.github.io/checkup-seguranca/

## Como funciona

1. O usuário escolhe a plataforma (Android ou iPhone) e responde a 8 perguntas.
2. Cada resposta classifica um controle como **Em dia**, **Ajustar** ou **Conferir**.
3. A ferramenta ordena os itens pendentes pela prioridade definida na pesquisa e mostra o passo a passo de cada um.
4. O usuário pode copiar o plano de ajustes em texto.

## Privacidade e segurança

- As respostas são processadas apenas no navegador. Não há servidor de aplicação, banco de dados, cadastro ou rastreamento.
- As respostas ficam salvas só no próprio aparelho (`localStorage`), e o botão **Limpar respostas** as apaga.
- As fontes tipográficas são hospedadas no próprio projeto, sem requisições a terceiros.
- Uma política de segurança de conteúdo (CSP) permite carregar scripts, estilos e dados apenas da própria origem.
- Os textos da base de regras nunca são interpretados como HTML. Os caminhos de menu usam a marcação `[[...]]`, convertida pela interface em texto destacado.

## Estrutura

```
index.html            página e estrutura da interface
css/estilo.css        aparência (tema claro e escuro, letra ampliada)
js/logica.js          regras de negócio (funções puras, testáveis)
js/app.js             interface: monta a página e reage às respostas
dados/regras.json     perguntas, opções, prioridades, evidências e passo a passo
fontes/               fontes Atkinson Hyperlegible e Bricolage Grotesque (SIL OFL)
testes/               testes automatizados (node --test)
```

Para atualizar um caminho de menu que mudou em uma nova versão do Android ou do iOS, basta editar `dados/regras.json`. O código não precisa ser alterado.

## Executar localmente

O navegador bloqueia a leitura de `dados/regras.json` quando a página é aberta direto do disco. Use um servidor local:

```
python3 -m http.server 8000
```

e acesse http://localhost:8000.

## Testes

Requer Node.js 20 ou superior.

```
npm test
```

Os testes verificam a integridade da base de regras (ids e prioridades únicos, passos para as duas plataformas, ausência de HTML) e o comportamento da lógica (ordenação, rebaixamento da regra da loja no iPhone, resumo e plano em texto).

## Licença

Código sob licença MIT. Fontes sob SIL Open Font License 1.1.
