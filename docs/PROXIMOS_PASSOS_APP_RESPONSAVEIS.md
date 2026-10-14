# Lacunas para o aplicativo dos responsáveis

Diagnóstico técnico em 14/10/2026, após o corte de fila local e sincronização de eventos. “Aplicativo” significa a evolução do portal responsivo já existente por PWA e Capacitor; não significa que APK/IPA, assinatura, publicação ou homologação estejam concluídos.

## Ponto de partida já disponível

- interface React/TypeScript dedicada aos responsáveis e build que exclui o painel escolar;
- PWA instalável com cache apenas do shell, sem armazenar respostas pessoais da API;
- projetos-base Capacitor Android/iOS;
- login e sessão demonstrativos, autorização por papel e vínculo no backend;
- solicitação de vínculo por matrícula e aprovação/rejeição auditada pela Coordenação/Direção;
- eventos/histórico e justificativas consumidos da API comum;
- avisos, leitura por responsável e caixa de notificações internas persistidos na API comum;
- detecção de conectividade, última atualização, bloqueio de escritas offline e retomada automática das consultas;
- fila SQLite do servidor escolar, idempotência, retentativas, retomada após lease e isolamento de conflitos.

A fila resolve a preservação dos eventos no servidor da escola quando o destino remoto fica indisponível. Ela não torna o celular do responsável operacional sem internet e não substitui uma API remota acessível com segurança.

## Caminho crítico

| Prioridade | Entrega necessária | Critério mínimo para avançar |
|---|---|---|
| 1 | Topologia e ambientes | Definir API central, DNS/HTTPS, configuração separada de desenvolvimento/homologação/produção, identidade estável do servidor escolar e gestão de segredos. Implantar escola → destino e testar queda/retorno sem perda ou duplicação. |
| 2 | Identidade e sessão de produção | Integrar provedor institucional, política de credenciais/recuperação/MFA, limitação de tentativas, revogação e armazenamento seguro do token no aparelho. Remover dependência das contas fictícias. |
| 3 | Dados realmente compartilhados | Avisos, notificações internas, vínculos e conteúdo de anexos de justificativas já estão persistidos. Para anexos, faltam antivírus, criptografia e política institucional de retenção/descarte; anexos de avisos continuam nominais. |
| 4 | Notificações | Escolher canal aprovado, criar fila independente com tentativas e estados de processamento/envio/entrega/falha, integrar push nativo e tratar consentimento/preferências sem confundi-los com autorização biométrica. |
| 5 | Experiência móvel resiliente | Estado sem conexão, erro/última atualização e retomada já foram implementados sem persistir respostas pessoais. Resta decidir institucionalmente se haverá leitura ou escrita offline; se aprovada, exige armazenamento protegido, fila própria e resolução de conflito, sem reutilizar implicitamente a fila da portaria. |
| 6 | Produto nativo | Confirmar identificador institucional, ícones/splash finais, permissões, deep links e política de distribuição; gerar builds assinados nos ambientes oficiais e validar atualização. iOS requer macOS/Xcode. |
| 7 | Segurança, privacidade e operação | Modelagem de ameaças, LGPD/governança de dados de menores, logs sem dados excessivos, monitoração/alertas, backup/restauração, resposta a incidentes e testes sem vulnerabilidades críticas/altas após correção e reteste. |
| 8 | Homologação | Testes em aparelhos e redes definidos, acessibilidade, segregação de vínculos, carga/recuperação, aceite da escola e evidências dos critérios da EAP. |

## Próximo incremento recomendado

Os incrementos de infraestrutura compartilhada, conectividade, vínculos e armazenamento local de anexos de justificativas foram concluídos. O próximo incremento gratuito recomendado é endurecer a API local: limitação de tentativas no login e nas solicitações de vínculo, cabeçalhos de segurança, política de retenção/limpeza de anexos órfãos e rotina testável de backup/restauração. Antivírus homologado e criptografia em repouso dependem de ferramenta e decisão institucional; a validação atual de assinatura não deve ser descrita como varredura antimalware.

Não entram automaticamente nesse incremento: reconhecimento facial, integração física das catracas, QR Code de contingência, WhatsApp, publicação em lojas ou uso de dados reais. Cada item depende das aprovações e controles descritos na consolidação do projeto.
