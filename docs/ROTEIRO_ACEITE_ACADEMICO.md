# Roteiro de aceite acadêmico vigente

Revisão de 29/10/2026. Use dados fictícios. Execute `npm ci`, `npm run lint`, `npm run build`, `npm run test:api` e `npm run test:pwa`. As etapas abaixo são verificação funcional do protótipo, sem equivaler à homologação de hardware, biometria ou desempenho.

1. Abra a apresentação pública e confirme os acessos separados para escola e responsáveis.
2. Entre como responsável vinculado e confirme somente seus dependentes, registros e notificações.
3. Entre como responsável sem vínculo, solicite pela matrícula e aprove como Coordenação/Direção. Confirme o acesso após aprovação.
4. Registre entrada/saída simulada no painel e confira atualização no portal, presença e histórico.
5. Envie justificativa textual pelo responsável. Confira sua consulta e análise como Coordenação/Direção; Portaria não pode analisar.
6. Confirme a ausência de campos e botões de atestado, upload, download, carteirinha, saúde, RFID e contato manual por WhatsApp nas telas do piloto.
7. Publique comunicado textual e confirme aviso e notificação interna no portal. Não há anexo.
8. Registre passagem assistida com estudante, catraca e motivo. Confirme o operador autenticado e a inexistência de simulação de acesso de terceiros.
9. Revogue vínculo e confira o bloqueio do acesso posterior. Verifique os metadados da auditoria como Coordenação/Direção.
10. Verifique fila local, estados de envio demonstrativo e indisponibilidade do destino. Não descreva PUSH_DEMO como entrega externa.
11. Pare a API: a interface deve informar indisponibilidade, não confirmar escritas e retomar consultas quando a API voltar.
12. No painel, abra Ferramentas → Apresentar portal por QR Code. Em localhost, deve pedir endereço alcançável e não gerar um QR inútil para outro aparelho.
13. Informe IP da mesma rede ou HTTPS da apresentação. Leia o QR em outro celular, abra no navegador sem instalar e entre com conta fictícia.
14. Repita passagem simulada e justificativa textual entre painel do computador e portal do celular. Esse ensaio físico continua necessário antes da apresentação.
15. Confira foco, Tab/Shift+Tab, Escape e mensagens de erro nos diálogos; verifique telas de 360, 440, 768 e 1440 px.

Instalação PWA é opcional. APK Android permanece objetivo do produto e não é requisito para participação na apresentação. Detalhes de rede e alternativa com duas janelas no computador estão em `APRESENTACAO_SEM_APK.md`.
