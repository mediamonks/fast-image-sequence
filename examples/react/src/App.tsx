import React, {useEffect, useRef, useState} from 'react';
import {FastImageSequenceComponent, type FastImageSequenceComponentRef, useFastImageSequence} from '../../../src/react';

function ComponentExample() {
    const sequenceRef = useRef<FastImageSequenceComponentRef>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleTogglePlay = () => {
        const sequence = sequenceRef.current?.sequence;
        if (!sequence) return;

        if (isPlaying) {
            sequence.stop();
        } else {
            sequence.play(30);
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div style={{position: 'relative'}}>
            <h2>Component Example</h2>
            <FastImageSequenceComponent
                ref={sequenceRef}
                frames={89}
                src={{
                    imageURL: (index) => `${('' + (index + 1)).padStart(4, '0')}.webp`,
                }}
                loop
                style={{width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden'}}
                onReady={(sequence) => {
                    console.log('Sequence ready!', sequence);
                }}
                onLoadProgress={(progress) => {
                    console.log(`Loading: ${(progress * 100).toFixed(1)}%`);
                }}
            />
            <button
                onClick={handleTogglePlay}
                style={{
                    marginTop: '10px',
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                }}
            >
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
}

function HookExample() {
    const {ref, sequence, isReady, loadProgress} = useFastImageSequence({
        frames: 120,
        src: {
            imageURL: (index) => `${('' + (index + 1)).padStart(3, '0')}.jpg`,
        },
        loop: true,
    });

    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!sequence) return;

        sequence.tick(() => {
            setProgress(sequence.progress);
        });
    }, [sequence]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (sequence) {
            sequence.progress = parseFloat(e.target.value);
        }
    };

    return (
        <div style={{marginTop: '40px'}}>
            <h2>Hook Example (Manual Control)</h2>
            <div ref={ref} style={{width: '100%', height: '400px', borderRadius: '16px', overflow: 'hidden'}}/>
            <div style={{marginTop: '10px'}}>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.001"
                    value={progress}
                    onChange={handleSliderChange}
                    style={{width: '100%'}}
                    disabled={!isReady}
                />
                <p>
                    Progress: {(progress * 100).toFixed(1)}% |
                    Load Progress: {(loadProgress * 100).toFixed(1)}% |
                    Status: {isReady ? 'Ready' : 'Loading...'}
                </p>
            </div>
        </div>
    );
}

export default function App() {
    return (
        <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
            <h1>FastImageSequence React Examples</h1>
            <p>
                This example demonstrates both the Component and Hook approaches for using
                FastImageSequence in React.
            </p>
            <ComponentExample/>
            <HookExample/>
        </div>
    );
}
