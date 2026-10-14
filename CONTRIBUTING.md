# Contribuição

## Commits

Use mensagens no formato [Conventional Commits](https://www.conventionalcommits.org/):

```text
<tipo>(<escopo opcional>): <descrição curta no imperativo>
```

Tipos usuais:

- `feat`: nova capacidade observável;
- `fix`: correção de comportamento;
- `docs`: documentação sem mudança funcional;
- `refactor`: reorganização sem alterar comportamento;
- `test`: inclusão ou correção de testes;
- `chore`: manutenção de ferramentas ou estrutura.

Mantenha cada commit coeso e pequeno o suficiente para revisão. Não misture refatorações sem relação, arquivos gerados ou correções automáticas de dependências com uma entrega funcional.

Antes do commit, execute:

```bash
npm run lint
npm run build
```

Quando houver mudança de escopo, regra de negócio ou estado de implementação, atualize também `docs/ALINHAMENTO_E_RASTREABILIDADE.md` e `docs/CONTROLE_DE_MUDANCAS.md`.

Não use dados reais de estudantes, responsáveis ou biometria em commits. Não declare integrações simuladas como concluídas.

## Branches e publicação

- `main` deve permanecer executável e validada.
- Prefira branches curtas para mudanças que precisem de revisão antes da integração.
- Não reescreva histórico compartilhado nem force push sem alinhamento explícito.
- Nunca versione segredos, credenciais, `.env` local, artefatos de build ou `node_modules`.
