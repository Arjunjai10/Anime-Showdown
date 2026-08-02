import React from 'react';
import { useWorkspaceStore } from '../stores/workspaceStore';
import { FighterLogo } from './FighterLogo';

export const WorkspaceTabs: React.FC = () => {
  const { activeTabId, openBattleTabs, setActiveTab, closeBattleTab } = useWorkspaceStore();
  const battleTabIds = Object.keys(openBattleTabs);

  return (
    <div className="workspace-tabs-bar">
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', padding: '6px 16px' }}>
        
        {/* Lobby Tab */}
        <button
          id="tab-lobby"
          className={`workspace-tab ${activeTabId === 'lobby' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('lobby')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FighterLogo id="swords" size={16} color={activeTabId === 'lobby' ? '#38BDF8' : 'currentColor'} />
          <span>Lobby & Roster</span>
        </button>

        {/* Teambuilder Tab */}
        <button
          id="tab-teambuilder"
          className={`workspace-tab ${activeTabId === 'teambuilder' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('teambuilder')}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <FighterLogo id="shield" size={16} color={activeTabId === 'teambuilder' ? '#34D399' : 'currentColor'} />
          <span>Teambuilder</span>
        </button>

        {/* Open Battle Rooms */}
        {battleTabIds.map((bid) => {
          const tab = openBattleTabs[bid];
          const isActive = activeTabId === bid;
          return (
            <div
              key={bid}
              className={`workspace-tab battle-room-tab ${isActive ? 'active-tab' : ''}`}
              onClick={() => setActiveTab(bid)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
            >
              <FighterLogo id="fire" size={16} color={isActive ? '#F97316' : '#DC2626'} />
              <span>{tab.title || 'Battle Room'}</span>
              {tab.hasUnread && <span className="unread-dot" title="New messages!" />}
              <button
                className="tab-close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  closeBattleTab(bid);
                }}
                title="Leave battle tab"
              >
                ×
              </button>
            </div>
          );
        })}

      </div>
    </div>
  );
};
