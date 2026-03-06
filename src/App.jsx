import { useState, useRef, useCallback, useEffect } from 'react';
import TreeCanvas from './components/TreeCanvas';
import Header from './components/Header';
import PersonPanel from './components/PersonPanel';
import ClanStoryPanel from './components/ClanStoryPanel';
import AddSelfPanel from './components/AddSelfPanel';
import InvitePanel from './components/InvitePanel';
import AdminPanel from './components/AdminPanel';
import LoginPrompt from './components/LoginPrompt';
import ZoomControls from './components/ZoomControls';
import TimelineBar from './components/TimelineBar';
import Legend from './components/Legend';
import { useTreeZoom } from './hooks/useTreeZoom';
import { fetchPeople, buildTree } from './lib/db';

export default function App() {
  const svgRef = useRef(null);
  const { zoomLevel, zoomIn, zoomOut, resetView } = useTreeZoom(svgRef, 0.65);

  const [treeData, setTreeData]     = useState({ tree: null, seedlings: [], mothersMap: new Map() });
  const [allPeople, setAllPeople]   = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [activePanel, setActivePanel]       = useState(null);
  const [addContext, setAddContext]          = useState(null);
  const [showLogin, setShowLogin]           = useState(false);

  const loadTree = useCallback(async () => {
    const people = await fetchPeople();
    setAllPeople(people);
    setTreeData(buildTree(people));
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

  const handleSelectPerson = useCallback((person) => {
    setActivePanel(null);
    setSelectedPerson(person);
  }, []);

  const handleAddRelative = useCallback((anchor, relationship = 'child') => {
    setSelectedPerson(null);
    setAddContext({ anchor, relationship });
    setActivePanel('add');
  }, []);

  const handleAddChild = useCallback(
    (anchor) => handleAddRelative(anchor, 'child'),
    [handleAddRelative]
  );

  const handleOpenPanel = useCallback((panel) => {
    setSelectedPerson(null);
    setAddContext(null);
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const handleCloseAll = useCallback(() => {
    setSelectedPerson(null);
    setActivePanel(null);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--earth-darkest)',
      }}
    >
      {/* Subtle background texture */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(ellipse at 30% 20%, rgba(139,105,20,0.06) 0%, transparent 60%),
            radial-gradient(ellipse at 70% 80%, rgba(92,64,51,0.05) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(218,165,32,0.02) 0%, transparent 70%)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* SVG Canvas */}
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {/* D3 Tree Renderer */}
      <TreeCanvas
        svgRef={svgRef}
        clanTree={treeData.tree}
        seedlings={treeData.seedlings}
        mothersMap={treeData.mothersMap}
        onSelectPerson={handleSelectPerson}
        onAddPerson={handleAddChild}
        zoomLevel={zoomLevel}
      />

      {/* Header */}
      <Header onOpenPanel={handleOpenPanel} allPeople={allPeople} />

      {/* Zoom Controls */}
      <ZoomControls
        zoomLevel={zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetView}
      />

      {/* Timeline */}
      <TimelineBar zoomLevel={zoomLevel} />

      {/* Legend */}
      <Legend />

      {/* Panels */}
      {selectedPerson && (
        <PersonPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} onAddRelative={handleAddRelative} onLoginRequired={() => setShowLogin(true)} />
      )}
      {activePanel === 'story' && (
        <ClanStoryPanel onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'add' && (
        <AddSelfPanel onClose={() => { setActivePanel(null); setAddContext(null); }} anchor={addContext?.anchor} relationship={addContext?.relationship} onPersonAdded={loadTree} />
      )}
      {activePanel === 'invite' && (
        <InvitePanel onClose={() => setActivePanel(null)} />
      )}
      {activePanel === 'admin' && (
        <AdminPanel onClose={() => setActivePanel(null)} onRefreshTree={loadTree} />
      )}
      {showLogin && <LoginPrompt onClose={() => setShowLogin(false)} />}

      {/* Click backdrop to close panels */}
      {(selectedPerson || activePanel) && (
        <div
          onClick={handleCloseAll}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 25,
            background: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'auto',
          }}
        />
      )}

      {/* Re-render panels above backdrop */}
      <div style={{ position: 'relative', zIndex: 30 }}>
        {selectedPerson && (
          <PersonPanel person={selectedPerson} onClose={() => setSelectedPerson(null)} onAddRelative={handleAddRelative} onLoginRequired={() => setShowLogin(true)} />
        )}
        {activePanel === 'story' && (
          <ClanStoryPanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'add' && (
          <AddSelfPanel onClose={() => { setActivePanel(null); setAddContext(null); }} anchor={addContext?.anchor} relationship={addContext?.relationship} onPersonAdded={loadTree} />
        )}
        {activePanel === 'invite' && (
          <InvitePanel onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'admin' && (
          <AdminPanel onClose={() => setActivePanel(null)} onRefreshTree={loadTree} />
        )}
      </div>

      {/* Noise overlay */}
      <div className="noise-overlay" />
    </div>
  );
}
