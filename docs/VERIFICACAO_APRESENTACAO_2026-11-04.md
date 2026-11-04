# Conferência para a apresentação de 05/11/2026

Conferência realizada em **04/11/2026**, com leitura atual dos quatro documentos acadêmicos e comparação com o protótipo. A data da tela registra a conferência das fontes; não é atualizada automaticamente pelo relógio e não substitui as datas de aprovação ou revisão dos documentos.

## Fontes relidas

- [Termo de Abertura do Projeto](https://docs.google.com/document/d/123CtOo0_VU80zlFWrm8pKOE5eh1VWj38N-YrP_6kH2U/edit).
- [Atividade 01 — Ciclo de Vida](https://docs.google.com/document/d/1eYtvWycQ0RY8AZVUsdvft_6PcsAiU6WM-Qp0A1GZnhA/edit).
- [Dicionário da EAP v1.3](https://docs.google.com/document/d/1oiOUK3fTjjsJNeXXXpx0q8YL7LK9P8CJ/edit), com atualização declarada em 29/10/2026.
- [Mapeamento e Plano de Resposta a Riscos em TI](https://docs.google.com/document/d/1btSlX5aFU_2gdUn7JFvTXXJ90HBENuXh_d514wiCOHE/edit).

Os quatro documentos já incorporam justificativas textuais, evolução Android e apresentação pelo navegador/QR. Não foi necessária nova alteração no Drive nesta conferência.

## Resultado da comparação

| Item | Referência conferida e tratamento no protótipo |
|---|---|
| Piloto | Uma escola pública de ensino fundamental, duas catracas, câmeras e servidor local. Hardware e reconhecimento facial permanecem simulados. |
| Responsáveis | Portal com consulta restrita a vínculo aprovado; análise e revogação pela escola. O backend demonstrativo já aplica as autorizações das rotas implementadas. |
| Ausências | Justificativa textual enviada pelo responsável e analisada pela Coordenação/Direção. Upload/download e novas referências a anexos são bloqueados. Mensagem antiga sobre armazenamento de novos anexos foi removida. |
| Apresentação móvel | URL/QR abre `/#/responsaveis` no navegador, sem instalar APK/PWA. Android continua como objetivo. O QR não transporta sessão ou senha nem funciona como crachá de aluno. |
| Prazo e equipe | 24 semanas, aproximadamente seis meses; três pessoas, 2.880h de capacidade e 2.400h produtivas. Iniciação e planejamento compartilham as 300h previstas. |
| Custos | R$ 240.000 de mão de obra + R$ 24.000 de contingência + R$ 15.000 de hardware = R$ 279.000 de linha de base. R$ 12.000 de reserva gerencial fora da linha de base; global de R$ 291.000. Valores estimados, sem financiamento assegurado. |
| Metas | Acurácia ≥95%; inferência ≤500ms em ≥95% das tentativas; ≥95% das notificações processadas para envio em até 5s; disponibilidade ≥99% no horário escolar; ausência de vulnerabilidades críticas/altas após correção e reteste. |
| Critérios complementares da EAP | Resposta média da API <200ms; liberação física <1s após identificação e autorização; segregação com 100% dos testes aprovados; erro <1% sob pico; cobertura crítica >80%; sucesso de usabilidade >90%. São critérios futuros de homologação, não resultados destes testes. |
| Riscos | Oito riscos R01–R08, com pontuações e classes iguais às do plano: 10/Médio, 10/Médio, 16/Alto, 6/Baixo, 12/Médio, 16/Alto, 16/Alto e 12/Médio. |
| Continuidade | Fila, auditoria e backup têm implementação demonstrativa local. Não equivalem à continuidade física da portaria, proteção biométrica ou homologação institucional. |
| Recursos excluídos | Sem atestados/anexos, ficha de saúde, carteirinha digital, RFID ou gestão de acesso de terceiros no fluxo do piloto. Campos legados não justificam reativar essas funcionalidades. |

A tela de documentação passou a usar uma data centralizada de conferência, identifica a EAP v1.3, reúne as metas em Mensurável e apresenta marcos e riscos oficiais. Datas históricas de decisões, testes e documentos foram preservadas. O registro duplicado de regressão visual foi identificado como MC-032-QA, preservando MC-032 para a decisão de escopo.

## Verificações executadas

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `npm run test:pwa`: aprovado; shell estático, sem cache de navegação para `/api`.
- `node --import tsx --test server/test/*.test.ts`: **29 aprovados, zero falhas e zero ignorados**. Inclui autenticação, papéis e vínculos, revogação, justificativas sem anexos, eventos, comunicações, auditoria, fila, backup/restauração e validação dos endereços do QR.
- Renderização estática dos componentes: data de 04/11/2026, referência EAP v1.3, custos e aviso de justificativas textuais conferidos. Configuração contém 11 metas e oito riscos.
- `git diff --check`: aprovado.

O comando `npm run test:api` encontrou restrição ao pipe IPC do lançador `tsx` neste ambiente; a mesma suíte foi executada integralmente pelo carregador `node --import tsx`, sem alterar os testes ou as regras da aplicação.

Não houve nova validação visual em navegador: a infraestrutura de preview esperou a porta 4173, mas o script existente serviu a porta 3000 e o preview encerrou por timeout. Não foram alterados os comandos funcionais da apresentação para contornar essa limitação do ambiente. A renderização estática não comprova layout ou interação no navegador.

## Ensaio necessário no local

1. Atualizar a cópia local com esta revisão e executar `npm run presentation:start`.
2. No painel escolar, conferir a documentação com data **04/11/2026**. Se a PWA conservar uma versão anterior, fechar e reabrir a página após a atualização.
3. Abrir **Ferramentas → Apresentar portal por QR Code** e conferir o endereço da rede. Ler com um celular conectado à mesma rede, sem instalar nada.
4. Entrar com conta demonstrativa vinculada, registrar uma passagem no painel e conferir a atualização no portal.
5. Enviar justificativa textual e analisá-la como Coordenação/Direção; demonstrar que Portaria não possui essa permissão.
6. Se a rede isolar os aparelhos, usar duas janelas no computador como alternativa. O procedimento opcional de túnel está em `APRESENTACAO_SEM_APK.md`; não foi iniciado nesta revisão.

O ensaio físico depende do computador, do celular e da rede usados no dia. Esta conferência não comprova desempenho biométrico, integração de hardware, entrega externa de notificações, disponibilidade escolar, segurança institucional ou aceite formal.
