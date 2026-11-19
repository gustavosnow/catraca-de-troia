# Alinhamento e rastreabilidade — conferência de 4 de novembro de 2026

Referência: TAP, Atividade 01, Dicionário da EAP v1.3 e Plano de Riscos atualizados no Drive. A decisão MC-032 substitui a ampliação anterior para anexos e funcionalidades adicionais.

## Escopo vigente

Uma escola pública de ensino fundamental, duas catracas, identificação facial prevista, registro de entrada/saída, painel escolar, portal dos responsáveis, vínculos autorizados, avisos, notificações e justificativas textuais. A Coordenação/Direção analisa a justificativa enviada pelo responsável. O produto prevê APK Android; a apresentação usa o mesmo portal pelo navegador via link ou QR Code, sem instalação obrigatória.

Não integram o piloto atestados ou outros anexos, ficha de saúde, carteirinha digital, RFID, biometria digital, atendimento manual por WhatsApp ou gestão de acesso de terceiros. QR para abrir o portal não é crachá de autorização de estudante.

## Correspondência com a EAP

| Pacote | Requisito | Evidência atual | Limite |
|---|---|---|---|
| 1.1.1–1.1.4 | Planejamento e acompanhamento | Fontes acadêmicas, histórico Git e controle de mudanças | Encerramento e aceite institucionais pendentes |
| 1.2.1–1.2.3 | Requisitos, jornadas e protótipo | Consolidação, telas React e roteiro de apresentação | Homologação com usuários pendente |
| 1.3.1 | Backend e banco | API Express/SQLite local | Pilha demonstrativa; arquitetura Python/visão computacional prevista não está integrada |
| 1.3.2 | Reconhecimento facial | Protótipo de laboratório em `edge/` (YuNet + SFace/OpenCV, webcam ou celular) com confirmação em quadros consecutivos; API autentica a câmera, aplica limiar mínimo e registra `FACE_PROTOTYPE` ou negação (MC-036); cadastro facial e catracas iniciados/parados pela API local para botões do painel, com Coordenação/Direção, consentimento e auditoria no cadastro (MC-037); cartão **Protótipo de reconhecimento facial** em Ferramentas, com câmeras de entrada e de saída identificadas, e origem **Protótipo facial** distinta de **Assistida** na tabela, na ficha e no CSV (MC-038, MC-039); sequência obrigatória por estudante no dia (entrada → saída → entrada), sem gravar repetição (MC-039) | Poucos rostos adultos da equipe; sem prova de vida, sem acurácia/latência homologadas |
| 1.3.3 | Painel escolar | Eventos, alunos (ficha carregada do banco por `GET /students`), avisos, análise textual, contas, vínculos e auditoria; RBAC conferido rota a rota por teste (`server/test/rbac.test.ts`) | Carga inicial por `npm run db:seed`; sem edição de cadastro de estudantes pelo painel (MC-039) |
| 1.3.4 | Portal responsivo e Android | Consulta, histórico, avisos, notificações internas, justificativas textuais e área **Meus vínculos** (MC-043); PWA com instalação opcional pelo menu da conta, projeto Android e QR direto com descoberta da interface Wi-Fi | Apresentação sem APK; teste em celular real depende da rede e do ensaio |
| 1.3.5 | Integração de catracas | Duas unidades demonstrativas; passagem assistida de aluno com motivo e operador; cadastro de câmera por catraca/sentido com token opaco (`npm run device:register`) | Nenhum hardware acionado; liberação apenas indicada na tela do agente |
| 1.3.6 | Notificações | Caixa interna e fila PUSH_DEMO | Sem push/WhatsApp externo ou prova da meta temporal |
| 1.3.7 | Gestão biométrica | Cadastro/remoção local de vetores do protótipo, com confirmação de consentimento e sem fotos (`edge/enroll.py`) | Vetores sem criptografia institucional; governança LGPD e módulo de produção pendentes |
| 1.3.8 | Perfis e vínculos | Sessões opacas e independentes por aba no navegador (MC-042), aprovação/revogação de vínculo e autorização no backend | Sem identidade institucional ou homologação de segurança |
| 1.4.1–1.4.3 | Testes e qualidade | TypeScript, build, testes API e validação PWA | Não comprova carga, segurança ou metas da EAP |
| 1.5.1 | Continuidade e backup | Fila local, idempotência, sincronização e backup testados em ambiente local | Implantação escolar e destino remoto pendentes |
| 1.5.2 | Instalação física | Quantidade de catracas refletida no cenário | Comissionamento pendente |
| 1.5.3 | Capacitação | README, roteiro e instruções para QR | Treinamento institucional pendente |

## Conferência para a apresentação de 05/11/2026

Os quatro documentos do Drive foram relidos em 04/11/2026, preservando suas datas originais. A tela de documentação usa uma única data de conferência e identifica EAP v1.3. Metas SMART, marcos, riscos R01–R08, prazo e orçamento foram comparados; a apresentação distingue recursos locais implementados das entregas físicas e externas ainda previstas. Ver `VERIFICACAO_APRESENTACAO_2026-11-04.md`. Desde a revisão do redesign (MC-035), a tela **Sobre o projeto** não replica mais metas, prazo, orçamento ou riscos: mostra um resumo da demonstração e remete à [pasta oficial no Drive](https://drive.google.com/drive/folders/163EOyyzGW-VMIH2zs_PGTHZEVyHRfeJ9), que é a fonte vigente.

## Correções do escopo vigente

- Atestados e anexos removidos das telas; upload/download desativados e referências novas a anexos rejeitadas pela API. Bancos legados não são apagados.
- Carteirinha digital retirada; ficha sem dados de saúde e etiquetas RFID. A passagem assistida só aceita estudante cadastrado e registra o operador autenticado.
- Retiradas ações de contato manual por WhatsApp e campos de anexo em comunicados.
- Central de apresentação aceita endereço alcançável pelo celular, rejeita localhost/loopback, remove parâmetros de consulta e gera QR somente para a rota dos responsáveis.
- O modo de apresentação não requer instalação de APK/PWA. Não abre túnel ou publica a aplicação automaticamente.

Os registros MC-001 a MC-031 e as evidências datadas de ciclos anteriores são históricos. Não comprovam que recursos retirados continuam no escopo. Metas quantitativas permanecem planejadas, sem resultados de homologação.

