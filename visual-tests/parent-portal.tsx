import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ParentAppView } from '../src/components/ParentApp/ParentAppView';
import {
  VISUAL_SCHOOL_NAME,
  visualGuardian,
  visualJustifications,
  visualLogs,
  visualNotices,
  visualNotifications,
  visualStudents,
} from './fixtures';
import '../src/index.css';

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
      guardian={visualGuardian}
      schoolName={VISUAL_SCHOOL_NAME}
      students={visualStudents}
      notices={visualNotices}
      notifications={visualNotifications}
      sharedAccessLogs={visualLogs}
      sharedJustifications={visualJustifications}
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
