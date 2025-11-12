import { useEffect, useRef, useState } from 'react';
import { FastImageSequence, type FastImageSequenceOptions } from '../lib/FastImageSequence.js';

export interface UseFastImageSequenceOptions extends FastImageSequenceOptions {
  autoInit?: boolean;
}

export interface UseFastImageSequenceReturn {
  ref: React.RefObject<HTMLDivElement>;
  sequence: FastImageSequence | null;
  isReady: boolean;
  loadProgress: number;
}

export function useFastImageSequence(
  options: UseFastImageSequenceOptions
): UseFastImageSequenceReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<FastImageSequence | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);

  const { autoInit = true, ...sequenceOptions } = options;

  useEffect(() => {
    if (!containerRef.current || !autoInit) {
      return;
    }

    const sequence = new FastImageSequence(containerRef.current, sequenceOptions);
    sequenceRef.current = sequence;

    sequence.ready().then(() => {
      setIsReady(true);
    });

    const progressInterval = setInterval(() => {
      setLoadProgress(sequence.loadProgress);
      if (sequence.loadProgress >= 1) {
        clearInterval(progressInterval);
      }
    }, 100);

    return () => {
      clearInterval(progressInterval);
      sequence.destruct();
      sequenceRef.current = null;
      setIsReady(false);
      setLoadProgress(0);
    };
  }, [autoInit]);

  return {
    ref: containerRef,
    sequence: sequenceRef.current,
    isReady,
    loadProgress,
  };
}
