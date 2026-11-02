declare module 'react-piano' {
    import { ComponentType } from 'react';
    interface PianoProps {
        noteRange: { first: number; last: number };
        playNote: (midiNumber: number) => void;
        stopNote: (midiNumber: number) => void;
        width: number;
        keyboardShortcuts: any[];
        activeNotes?: number[];
        renderNoteLabel?: (props: { midiNumber: number; isActive: boolean }) => React.ReactNode;
    }
    const Piano: ComponentType<PianoProps>;
    export default Piano;
}