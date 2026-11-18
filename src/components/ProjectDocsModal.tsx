import React from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { Modal } from './ui';

/** Pasta oficial no Drive (TAP, Atividade 01, Dicionário da EAP e Plano de Riscos), com acesso de Leitor pelo link. */
export const OFFICIAL_DOCS_URL = 'https://drive.google.com/drive/folders/163EOyyzGW-VMIH2zs_PGTHZEVyHRfeJ9';

interface ProjectDocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Resumo curto da demonstração. Orçamento, prazo, metas e riscos não são
 * copiados aqui: as fontes vivem no Drive e mudam por lá. Evidências datadas e
 * rastreabilidade ficam em docs/ no repositório.
 */
export const ProjectDocsModal: React.FC<ProjectDocsModalProps> = ({ isOpen, onClose }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    labelledById="project-docs-title"
    icon={BookOpen}
    title="Sobre o projeto"
    description="Protótipo acadêmico do controle de acesso escolar Catraca de Troia."
    footer={
      <>
        <button type="button" className="btn btn-secondary max-sm:order-2 max-sm:w-full" onClick={onClose}>Fechar</button>
        <a href={OFFICIAL_DOCS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary max-sm:w-full">
          Consultar documentação oficial
          <ExternalLink aria-hidden="true" />
          <span className="sr-only">(abre em nova aba)</span>
        </a>
      </>
    }
  >
    <div className="space-y-4 text-sm leading-relaxed text-ink-2">
      <p>
        O piloto prevê uma escola pública de ensino fundamental com duas catracas, câmeras e um servidor local.
        Esta demonstração reúne o <strong className="font-semibold text-ink">painel escolar</strong> e o{' '}
        <strong className="font-semibold text-ink">portal dos responsáveis</strong>, que compartilham a mesma API local.
      </p>
      <p>
        Entradas e saídas, avisos, notificações internas, justificativas textuais e vínculos usam dados fictícios.
        Hardware, reconhecimento facial e notificações externas são simulados; metas e entregas do piloto seguem
        como critérios de homologação, não como resultados medidos.
      </p>
      <p className="rounded-[10px] border border-line bg-surface px-4 py-3 text-[13px] text-muted">
        Termo de abertura, Atividade 01, Dicionário da EAP e Plano de Riscos estão na pasta oficial do Drive,
        que é a fonte vigente. Evidências datadas e rastreabilidade ficam na pasta <code className="text-ink">docs/</code> do repositório.
      </p>
    </div>
  </Modal>
);
