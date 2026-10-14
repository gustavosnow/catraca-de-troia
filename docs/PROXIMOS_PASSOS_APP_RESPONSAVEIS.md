# Lacunas para o aplicativo dos responsáveis

Diagnóstico técnico em 14/10/2026, após o corte de fila local e sincronização de eventos. “Aplicativo” significa a evolução do portal responsivo já existente por PWA e Capacitor; não significa que APK/IPA, assinatura, publicação ou homologação estejam concluídos.

## Ponto de partida já disponível

- interface React/TypeScript dedicada aos responsáveis e build que exclui o painel escolar;
- PWA instalável com cache apenas do shell, sem armazenar respostas pessoais da API;
- projetos-base Capacitor Android/iOS;
- login e sessão demonstrativos, autorização por papel e vínculo no backend;
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
| 3 | Dados realmente compartilhados | Avisos e notificações internas já estão persistidos; implementar conteúdo de anexos com autorização, antivírus, retenção e descarte; definir como responsáveis solicitam vínculos para aprovação escolar. |
| 4 | Notificações | Escolher canal aprovado, criar fila independente com tentativas e estados de processamento/envio/entrega/falha, integrar push nativo e tratar consentimento/preferências sem confundi-los com autorização biométrica. |
| 5 | Experiência móvel resiliente | Estado sem conexão, erro/última atualização e retomada já foram implementados sem persistir respostas pessoais. Resta decidir institucionalmente se haverá leitura ou escrita offline; se aprovada, exige armazenamento protegido, fila própria e resolução de conflito, sem reutilizar implicitamente a fila da portaria. |
| 6 | Produto nativo | Confirmar identificador institucional, ícones/splash finais, permissões, deep links e política de distribuição; gerar builds assinados nos ambientes oficiais e validar atualização. iOS requer macOS/Xcode. |
| 7 | Segurança, privacidade e operação | Modelagem de ameaças, LGPD/governança de dados de menores, logs sem dados excessivos, monitoração/alertas, backup/restauração, resposta a incidentes e testes sem vulnerabilidades críticas/altas após correção e reteste. |
| 8 | Homologação | Testes em aparelhos e redes definidos, acessibilidade, segregação de vínculos, carga/recuperação, aceite da escola e evidências dos critérios da EAP. |

## Próximo incremento recomendado

Os incrementos de infraestrutura compartilhada e tratamento básico de conectividade foram concluídos: o portal usa a API/SQLite para avisos e notificações internas, respeita perfil/vínculo, informa última atualização, mantém somente o estado em memória durante a queda e retoma as consultas ao reconectar. O próximo incremento recomendado é implementar a solicitação e aprovação escolar de vínculos, eliminando o cadastro demonstrativo que seleciona alunos. Em seguida, o conteúdo real de anexos depende de política de autorização, antivírus, retenção e descarte. Em paralelo institucional, ainda é necessário decidir provedor de identidade, hospedagem HTTPS e identificador/distribuição móvel.

Não entram automaticamente nesse incremento: reconhecimento facial, integração física das catracas, QR Code de contingência, WhatsApp, publicação em lojas ou uso de dados reais. Cada item depende das aprovações e controles descritos na consolidação do projeto.
