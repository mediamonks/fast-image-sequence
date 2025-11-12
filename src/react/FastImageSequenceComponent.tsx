import React, { useEffect, useImperativeHandle, forwardRef } from 'react';
import { useFastImageSequence, type UseFastImageSequenceOptions } from './useFastImageSequence.js';
import type { FastImageSequence } from '../lib/FastImageSequence.js';

export interface FastImageSequenceComponentProps extends UseFastImageSequenceOptions {
  className?: string;
  style?: React.CSSProperties;
  onReady?: (sequence: FastImageSequence) => void;
  onLoadProgress?: (progress: number) => void;
}

export interface FastImageSequenceComponentRef {
  sequence: FastImageSequence | null;
  container: HTMLDivElement | null;
}

export const FastImageSequenceComponent = forwardRef<
  FastImageSequenceComponentRef,
  FastImageSequenceComponentProps
>(function FastImageSequenceComponent(props, ref) {
  const { className, style, onReady, onLoadProgress, ...sequenceOptions } = props;

  const { ref: containerRef, sequence, isReady, loadProgress } = useFastImageSequence(sequenceOptions);

  useImperativeHandle(ref, () => ({
    sequence,
    container: containerRef.current,
  }), [sequence]);

  useEffect(() => {
    if (isReady && sequence && onReady) {
      onReady(sequence);
    }
  }, [isReady, sequence, onReady]);

  useEffect(() => {
    if (onLoadProgress) {
      onLoadProgress(loadProgress);
    }
  }, [loadProgress, onLoadProgress]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  );
});
