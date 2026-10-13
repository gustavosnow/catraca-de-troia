# Catraca de Troia — instruções do projeto

Leia `docs/PROJETO_CATRACA_DE_TROIA.md` e `docs/ALINHAMENTO_E_RASTREABILIDADE.md` antes de alterar regras de negócio.

- As fontes acadêmicas atuais são o TAP, a Atividade 01, o Dicionário da EAP e o Plano de Riscos, vinculados na documentação. A consolidação foi feita em 13/10/2026.
- Piloto em uma escola pública de ensino fundamental, com duas catracas, câmeras, servidor local e reconhecimento facial em Python/OpenCV. Expansão para outras escolas não faz parte do piloto.
- Painel escolar e portal responsivo dos responsáveis compartilham backend e dados. Android/iOS via Capacitor é uma evolução proposta do portal; não declarar aplicativo nativo ou publicação em lojas como entrega concluída.
- Meta de acurácia ≥ 95%; inferência ≤ 500 ms em ≥ 95% das tentativas; ≥ 95% das notificações processadas para envio em até 5s sob conectividade prevista; disponibilidade ≥ 99% no horário escolar; ausência de vulnerabilidades críticas/altas após correção e reteste. Não inventar metas de 99,4%, 99,9%, 1,5s ou 45 passagens/min.
- As metas são critérios de homologação, não resultados demonstrados. O cenário de até 30 passagens/min do plano de riscos é referência de teste, não garantia de capacidade aferida.
- 24 semanas, três pessoas, 2.880h de capacidade e 2.400h produtivas. Estimativas: mão de obra R$ 240.000; contingência R$ 24.000; hardware R$ 15.000; linha de base R$ 279.000; reserva gerencial R$ 12.000 fora da linha de base; global R$ 291.000. Financiamento não está assegurado.
- Durante falhas de internet, identificação e registro devem continuar localmente, com fila e sincronização posterior. Não confundir cache do portal/PWA com continuidade operacional do servidor escolar.
- Autorização real deve ser aplicada no backend, por perfil e vínculo validado pela escola. A seleção de dependente pelo próprio usuário e filtros React não validam vínculo.
- Dados biométricos exigem governança institucional: necessidade, proporcionalidade, minimização, retenção, direitos e resposta a incidentes. Preferência de notificação não autoriza automaticamente biometria nem condiciona frequência escolar.
- Entrada alternativa e liberação manual exigem aprovação institucional, segurança física e rastreabilidade. QR Code é contingência sujeita à aprovação; RFID e biometria digital não são entregas aprovadas do piloto.
- Preservar a paleta azul-marinho e laranja e os ativos visuais existentes.
- Manter explícitos os dados e fluxos simulados. Não declarar backend, criptografia, notificações externas, hardware, reconhecimento facial ou indicadores reais implementados sem evidência.
- Validar alterações com `npm run lint` e `npm run build`; testar fluxos modificados quando necessário. Atualizar matriz de rastreabilidade e registrar mudanças de escopo.
