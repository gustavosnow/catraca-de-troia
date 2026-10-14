# Lacunas para o aplicativo dos responsáveis

Diagnóstico técnico em 14/10/2026, após o corte de fila local e sincronização de eventos. “Aplicativo” significa a evolução do portal responsivo já existente por PWA e Capacitor; não significa que APK/IPA, assinatura, publicação ou homologação estejam concluídos.

## Ponto de partida já disponível

- interface React/TypeScript dedicada aos responsáveis e build que exclui o painel escolar;
- PWA instalável com cache apenas do shell, sem armazenar respostas pessoais da API;
- projetos-base Capacitor Android/iOS;
- login e sessão demonstrativos, autorização por papel e vínculo no backend;
- eventos/histórico e justificativas consumidos da API comum;
- fila SQLite do servidor escolar, idempotência, retentativas, retomada após lease e isolamento de conflitos.

A fila resolve a preservação dos eventos no servidor da escola quando o destino remoto fica indisponível. Ela não torna o celular do responsável operacional sem internet e não substitui uma API remota acessível com segurança.

## Caminho crítico

| Prioridade | Entrega necessária | Critério mínimo para avançar |
|---|---|---|
| 1 | Topologia e ambientes | Definir API central, DNS/HTTPS, configuração separada de desenvolvimento/homologação/produção, identidade estável do servidor escolar e gestão de segredos. Implantar escola → destino e testar queda/retorno sem perda ou duplicação. |
| 2 | Identidade e sessão de produção | Integrar provedor institucional, política de credenciais/recuperação/MFA, limitação de tentativas, revogação e armazenamento seguro do token no aparelho. Remover dependência das contas fictícias. |
| 3 | Dados realmente compartilhados | Persistir avisos e notificações hoje mantidos em memória; implementar conteúdo de anexos com autorização, antivírus, retenção e descarte; definir como responsáveis solicitam vínculos para aprovação escolar. |
| 4 | Notificações | Escolher canal aprovado, criar fila independente com tentativas e estados de processamento/envio/entrega/falha, integrar push nativo e tratar consentimento/preferências sem confundi-los com autorização biométrica. |
| 5 | Experiência móvel resiliente | Definir estado sem conexão, telas de erro/última atualização e política de cache local minimizado e protegido. Escritas offline do responsável, se aprovadas, precisam de fila própria e resolução de conflito; não devem reutilizar implicitamente a fila da portaria. |
| 6 | Produto nativo | Confirmar identificador institucional, ícones/splash finais, permissões, deep links e política de distribuição; gerar builds assinados nos ambientes oficiais e validar atualização. iOS requer macOS/Xcode. |
| 7 | Segurança, privacidade e operação | Modelagem de ameaças, LGPD/governança de dados de menores, logs sem dados excessivos, monitoração/alertas, backup/restauração, resposta a incidentes e testes sem vulnerabilidades críticas/altas após correção e reteste. |
| 8 | Homologação | Testes em aparelhos e redes definidos, acessibilidade, segregação de vínculos, carga/recuperação, aceite da escola e evidências dos critérios da EAP. |

## Próximo incremento recomendado

O próximo incremento de código deve ser a infraestrutura compartilhada do portal: persistir avisos e notificações na API, definir o contrato de entrega e expor no app estados reais de carregamento, atraso e última atualização. Em paralelo institucional, é necessário decidir provedor de identidade, hospedagem HTTPS e identificador/distribuição móvel; sem essas decisões, avançar em assinatura ou publicação criaria retrabalho.

Não entram automaticamente nesse incremento: reconhecimento facial, integração física das catracas, QR Code de contingência, WhatsApp, publicação em lojas ou uso de dados reais. Cada item depende das aprovações e controles descritos na consolidação do projeto.
