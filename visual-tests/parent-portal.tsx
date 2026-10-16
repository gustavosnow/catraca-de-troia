import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ParentAppView } from '../src/components/ParentApp/ParentAppView';
import {
  INITIAL_ABSENCE_JUSTIFICATIONS,
  INITIAL_ACCESS_LOGS,
  INITIAL_PARENT_NOTIFICATIONS,
  INITIAL_SCHOOL_NOTICES,
  PARENT_ACCOUNTS,
  STUDENTS_DATABASE,
} from '../src/data/mockData';
import '../src/index.css';

const guardian = PARENT_ACCOUNTS.find((account) => account.id === 'guardian-2') ?? PARENT_ACCOUNTS[0];

const VisualParentPortal = () => {
  const [isOnline, setIsOnline] = useState(true);
  const dataState = isOnline ? 'persistent' : 'unavailable';

  return <>
    <button
      id="visual-toggle-connectivity"
      type="button"
      className="sr-only"
      onClick={() => setIsOnline((current) => !current)}
    >
      Alternar conectividade do aceite visual
    </button>
    <ParentAppView
      sharedNotices={INITIAL_SCHOOL_NOTICES}
      sharedNotifications={INITIAL_PARENT_NOTIFICATIONS}
      guardiansList={[guardian]}
      currentGuardianExternal={guardian}
      onSelectGuardianExternal={() => undefined}
      studentsList={STUDENTS_DATABASE}
      sharedAccessLogs={INITIAL_ACCESS_LOGS}
      sharedJustifications={INITIAL_ABSENCE_JUSTIFICATIONS}
      onSubmitJustification={async () => undefined}
      justificationsState={dataState}
      justificationsError={isOnline ? undefined : 'API local indisponível no cenário visual.'}
      accessEventsState={dataState}
      accessEventsError={isOnline ? undefined : 'API local indisponível no cenário visual.'}
      communicationsState={dataState}
      communicationsError={isOnline ? undefined : 'API local indisponível no cenário visual.'}
      isOnline={isOnline}
      dataUpdatedAt="2026-10-16T17:00:00.000Z"
      onRefreshData={() => undefined}
      linkRequests={[]}
      linkRequestsState={dataState}
      linkRequestsError={isOnline ? undefined : 'API local indisponível no cenário visual.'}
      onCreateLinkRequest={async () => undefined}
      onMarkNoticeRead={async () => undefined}
      onMarkAllNotificationsRead={async () => undefined}
      onLogout={() => undefined}
    />
  </>;
};

createRoot(document.getElementById('root')!).render(<VisualParentPortal />);
