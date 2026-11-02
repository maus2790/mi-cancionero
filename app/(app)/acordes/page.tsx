'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GuitarChordDiagram } from '@/components/GuitarChordDiagram';
import { PianoChordDiagram } from '@/components/PianoChordDiagram';
import { useTitle } from '@/lib/TitleContext';
import { getAllChords, deleteChord } from '@/app/actions/chords';
import { Plus, X } from 'lucide-react';
import ChordModal from '@/components/ChordModal';
import { getCurrentUser } from '@/app/actions/auth';
import { canCreateContent, canManageContent, type ContentUser } from '@/lib/permissions';
import { ChordFormModal } from '@/components/ChordFormModal';
import { getChordDisplayName, NOTE_OPTIONS, normalizeNote } from '@/lib/constants';
import { useNetworkStatus } from '@/lib/hooks/useNetworkStatus';
import { useOfflineMode } from '@/lib/hooks/useOfflineMode';
import { getOfflineChords } from '@/lib/offline-db';

export default function ChordsPage() {
  const { setTitle, setShowBack } = useTitle();
  const router = useRouter();
  useEffect(() => {
      setTitle('Banco de Acordes');
      setShowBack(false);
  }, [setTitle, setShowBack]);

  const [view, setView] = useState<'guitar' | 'piano'>('guitar');
  const [selectedRoot, setSelectedRoot] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [chordsList, setChordsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChord, setSelectedChord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<ContentUser | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingChord, setEditingChord] = useState<any>(null);


  const { isOnline } = useNetworkStatus();
  const { isSectionOffline } = useOfflineMode();

  const loadChords = async () => {
    setLoading(true);
    try {
      if (!isOnline) {
        const offlineData = await getOfflineChords();
        setChordsList(offlineData);
      } else {
        const data = await getAllChords();
        setChordsList(data);
      }
    } catch (error) {
      console.error('Error loading chords:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChords();
    if (isOnline) {
      getCurrentUser().then(setCurrentUser).catch(() => {});
    } else {
      setCurrentUser({ id: 0, email: '', name: 'Modo Offline', role: 'user', provider: 'guest' } as any);
    }
  }, [isOnline]);

  const canCreate = canCreateContent(currentUser);

  const { roots, types } = (() => {
    const rootSet = new Set<string>();
    const typeSet = new Set<string>();
    chordsList.forEach(chord => {
      const root = normalizeNote(chord.root || chord.name.charAt(0));
      const type = chord.type || 'major';
      rootSet.add(root);
      typeSet.add(type);
    });
    return { roots: NOTE_OPTIONS.filter((option) => rootSet.has(option.value)), types: Array.from(typeSet).sort() };
  })();

  const hasFilters = selectedRoot || selectedType;
  const activeFilters = [];
  if (selectedRoot) activeFilters.push({ label: `Nota: ${NOTE_OPTIONS.find((option) => option.value === selectedRoot)?.label || selectedRoot}`, key: 'root', value: selectedRoot });
  if (selectedType && selectedType !== 'major') activeFilters.push({ label: `Tipo: ${selectedType}`, key: 'type', value: selectedType });

  const filteredChords = chordsList.filter(chord => {
    const root = normalizeNote(chord.root || chord.name.charAt(0));
    const type = chord.type || 'major';
    const matchesRoot = selectedRoot ? root === selectedRoot : true;
    const matchesType = selectedType ? type === selectedType : true;

    let hasGuitar = false;
    let hasPiano = false;
    try {
      const value = chord.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
      hasGuitar = !!value && (value.barre !== null || (Array.isArray(value.fingers) && value.fingers.some((finger: number) => finger >= 0)));
    } catch { }
    try {
      const value = chord.pianoPositions ? JSON.parse(chord.pianoPositions) : null;
      hasPiano = Array.isArray(value) ? value.length > 0 : Array.isArray(value?.notes) && value.notes.length > 0;
    } catch { }

    let matchesView = true;
    if (view === 'guitar') matchesView = !!hasGuitar;
    if (view === 'piano') matchesView = !!hasPiano;

    return matchesRoot && matchesType && matchesView;
  });

  const handleChordClick = (chord: any) => {
    setSelectedChord(chord);
    setIsModalOpen(true);
  };

  const handleDeleteChord = async () => {
    await loadChords();
  };

  const clearFilter = (key: 'root' | 'type') => {
    if (key === 'root') setSelectedRoot('');
    else setSelectedType('');
  };

  const clearAllFilters = () => {
    setSelectedRoot('');
    setSelectedType('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 pb-24 sm:pb-6">

      {/* Filtros */}
      <div className="flex flex-row justify-between items-center gap-3 mb-4 overflow-x-auto">
        {/* Toggle Guitarra / Teclado */}
        <div className="flex gap-1 bg-[var(--color-border)] p-1 rounded-lg flex-shrink-0">
          <button
            onClick={() => setView('guitar')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'guitar'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-app hover:text-[var(--color-primary)]'
              }`}
          >
            Guitarra
          </button>
          <button
            onClick={() => setView('piano')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'piano'
              ? 'bg-[var(--color-primary)] text-white shadow-sm'
              : 'text-app hover:text-[var(--color-primary)]'
              }`}
          >
            Teclado
          </button>
        </div>

        {/* Selects */}
        <div className="flex flex-nowrap gap-2 flex-shrink-0">
          <select
            value={selectedRoot}
            onChange={e => setSelectedRoot(e.target.value)}
            className="app-input px-2 py-1.5 rounded-lg text-xs min-w-0 max-w-[100px]"
          >
            <option value="">Notas</option>
            {roots.map(root => (
              <option key={root.value} value={root.value}>{root.label}</option>
            ))}
          </select>
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="app-input px-2 py-1.5 rounded-lg text-xs min-w-0 max-w-[100px]"
          >
            <option value="">Tipos</option>
            {types.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chips de filtros activos */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mb-4 items-center">
          {activeFilters.map(filter => (
            <span
              key={filter.key}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm"
            >
              {filter.label}
              <button
                onClick={() => clearFilter(filter.key as 'root' | 'type')}
                className="hover:bg-[var(--color-primary)]/20 rounded-full p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-app-muted hover:text-app hover:underline"
            >
              Limpiar todos
            </button>
          )}
        </div>
      )}

      {/* Grid de acordes */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]"></div>
        </div>
      ) : filteredChords.length === 0 ? (
        <div className="text-center py-12 text-app-muted">
          No se encontraron acordes.
          {canCreate && <button
            onClick={() => { setEditingChord(null); setIsFormOpen(true); }}
            className="block mx-auto mt-4 text-[var(--color-primary)] hover:underline"
          >
            Crear el primer acorde
          </button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredChords.map(chord => {
            let positions = null;
            try {
              positions = chord.guitarPositions ? JSON.parse(chord.guitarPositions) : null;
            } catch { }
            let pianoData: { startingNote: string, notes: string[] } = { startingNote: 'C', notes: [] };
            try {
              if (chord.pianoPositions) {
                const parsed = JSON.parse(chord.pianoPositions);
                if (Array.isArray(parsed)) {
                  pianoData = { startingNote: 'C', notes: parsed };
                } else if (parsed && typeof parsed === 'object') {
                  pianoData = parsed;
                }
              }
            } catch { }

            return (
              <div
                key={chord.id}
                className="app-card rounded-lg p-2 flex flex-col items-center cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition"
                onClick={() => handleChordClick(chord)}
              >
                <span className="text-lg font-bold text-app mb-2">
                  {getChordDisplayName(chord.root, chord.type, chord.name)}
                </span>
                <div className="w-full flex justify-center pointer-events-none">
                  {view === 'guitar' ? (
                    <GuitarChordDiagram
                      chordName={chord.name}
                      width={120}
                      positions={positions}
                    />
                  ) : (
                    <PianoChordDiagram
                      chordName={chord.name}
                      width={180}
                      notes={pianoData.notes}
                      startingNote={pianoData.startingNote}
                    />
                  )}
                </div>
                {chord.isPredefined && (
                  <span className="absolute top-1 left-1 text-[8px] text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1 rounded">
                    importado
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Botón flotante nuevo acorde */}
      {canCreate && <button
        onClick={() => { setEditingChord(null); setIsFormOpen(true); }}
        className="fixed bottom-20 right-4 sm:bottom-8 sm:right-8 app-button p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-40"
        aria-label="Nuevo acorde"
      >
        <Plus className="w-6 h-6" />
      </button>}

      <ChordModal
        chord={selectedChord}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDelete={handleDeleteChord}
        initialView={view}
        canCreate={canCreate}
        canManage={canManageContent(currentUser, selectedChord?.userId ?? null)}
        onEdit={() => { setEditingChord(selectedChord); setIsModalOpen(false); setIsFormOpen(true); }}
      />
      <ChordFormModal
        isOpen={isFormOpen}
        chord={editingChord}
        initialInstrument={view}
        onClose={() => setIsFormOpen(false)}
        onSaved={(saved) => setChordsList((items) => {
          const exists = items.some((item) => item.id === saved.id);
          return exists ? items.map((item) => item.id === saved.id ? saved : item) : [...items, saved];
        })}
      />
    </div>
  );
}
