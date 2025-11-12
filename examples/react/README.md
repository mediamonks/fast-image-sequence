# FastImageSequence React Example

This example demonstrates how to use the FastImageSequence library in a React application.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

## Features

### Component Example
- Uses `FastImageSequenceComponent` wrapper
- Play/pause control
- Auto-initialization
- Event callbacks for ready state and load progress

### Hook Example
- Uses `useFastImageSequence` hook for more control
- Manual progress control with slider
- Real-time progress tracking
- Custom container styling

## Key Concepts

1. **Tree-shaking**: Import from `@mediamonks/fast-image-sequence/react` to only include React-specific code
2. **Optional dependency**: React is not required for the core library
3. **TypeScript support**: Full type definitions included
4. **Two approaches**: Component wrapper or hook-based for different use cases
