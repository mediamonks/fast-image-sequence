# Fast Image Sequence Renderer

The fast-image-sequence is a powerful package that allows you to display a sequence of images at a high frame rate on
your website. It can be used to create smooth animations, 360-degree product views or video-like sequences from a series of
images.
Zero dependencies.

The FastImageSequence supports various options for customizing the behaviour of the image sequence, such as preloading
all images, using a worker to handle tar files, and more.

## Demo

- [Stress test with multiple demos](https://mediamonks.github.io/fast-image-sequence/).

This is a build from the repository's example/ directory.

## Getting started

### Installing

Add `@mediamonks/fast-image-sequence` to your project:

```sh
npm i @mediamonks/fast-image-sequence
```

## Basic usage

Creating a FastImageSequence instance and playing an image sequence.

```ts
import {FastImageSequence} from '@mediamonks/fast-image-sequence';

const options = {
  frames: 100,
  src:    {
    imageURL: (index) => `path/to/your/image/sequence/image${index}.jpg`,
  },

  loop:      true,
  objectFit: 'cover',
};

const sequence = new FastImageSequence(containerElement, options);
sequence.play();
```

In the options object, you must set the numbers of `frames` and an `imageURL`. The `imageURL` is a function that
takes an index as a parameter and returns a string representing the URL of the image at that index in the sequence.

## React Usage

The package includes optional React components and hooks. React is tree-shakeable and only included when you import from `@mediamonks/fast-image-sequence/react`.

### Using the React Component

```tsx
import { useRef } from 'react';
import { FastImageSequenceComponent } from '@mediamonks/fast-image-sequence/react';

function App() {
  const sequenceRef = useRef(null);

  const handlePlay = () => {
    sequenceRef.current?.sequence?.play(30);
  };

  return (
    <>
      <FastImageSequenceComponent
        ref={sequenceRef}
        frames={100}
        src={{
          imageURL: (index) => `/images/frame-${index}.jpg`,
        }}
        loop
        style={{ width: '100%', height: '100vh' }}
      />
      <button onClick={handlePlay}>Play</button>
    </>
  );
}
```

### Using the React Hook

For more control, you can use the `useFastImageSequence` hook:

```tsx
import { useEffect } from 'react';
import { useFastImageSequence } from '@mediamonks/fast-image-sequence/react';

function App() {
  const { ref, sequence, isReady } = useFastImageSequence({
    frames: 100,
    src: {
      imageURL: (index) => `/images/frame-${index}.jpg`,
    },
    loop: true,
  });

  useEffect(() => {
    if (sequence && isReady) {
      sequence.play(30);
    }
  }, [sequence, isReady]);

  return <div ref={ref} style={{ width: '100%', height: '100vh' }} />;
}
```

### React Component Props

The `FastImageSequenceComponent` accepts all `FastImageSequenceOptions` plus:

- **className**: `string` - CSS class name for the container
- **style**: `React.CSSProperties` - Inline styles for the container
- **onReady**: `(sequence: FastImageSequence) => void` - Callback when sequence is ready
- **onLoadProgress**: `(progress: number) => void` - Callback for load progress updates

### React Hook Return Value

The `useFastImageSequence` hook returns:

- **ref**: `React.RefObject<HTMLDivElement>` - Ref to attach to your container element
- **sequence**: `FastImageSequence | null` - The FastImageSequence instance
- **isReady**: `boolean` - Whether the sequence is initialized and ready
- **loadProgress**: `number` - Current load progress (0-1)

### Loading images from a tar file

If you want, you can load images from a tar file. This can be useful when you want to preload all images at once with
minimal memory usage. You can use a tar file by setting the `tarURL` option. You also need to set the `imageURL`, which
in this case returns the image's URL in the tar file.

```ts
const options = {
  frames: 100,
  src:    {
    tarURL:   'path/to/your/tar/file.tar',
    imageURL: (index) => `image${index}.jpg`,
  },

  loop:      true,
  objectFit: 'cover',
};
```

### Advanced usage

You can also set multiple sources for the FastImageSequence class. This can be useful when you want to load images from
different sources, such as a tar file *and* an image URL. You can set an array of ImageSource in the src option.
Each ImageSource can have its imageURL and tarURL.

The FastImageSequence class will try to load images from the first source in the array. If an image is not available
yet, it will try to load it from the next source in the
array, etc. Finally, the best matching available image will be rendered.

```ts
import {FastImageSequence} from '@mediamonks/fast-image-sequence';

const options = {
  frames: 100,

  src: [
    {
      // First try to display a highres image from an image URL
      imageURL:        (index) => `path/to/your/image/sequence/highres_image${index}.jpg`,
      maxCachedImages: 16,
    },
    {
      // Fallback if highres image is not loaded yet: serve a low res image from the tar file
      tarURL:          'path/to/your/tar/file.tar',
      imageURL:        (index) => `lowres_image${index}.jpg`,
      maxCachedImages: 32,
    },
  ],

  loop:      false,
  objectFit: 'contain',
};

const sequence = new FastImageSequence(containerElement, options);
sequence.play();
```

The example above can be useful when you have a large image sequence with high-resolution images or if the user randomly jumps to any frame in the sequence and you want a fast response time.

Note that you can store a subset of the images (all even images, for example) in the tar file. The FastImageSequence
will automatically fall back to the best matching available image when rendering a frame.

### Available options for FastImageSequence

- **frames**: `number` - Number of frames in the sequence. Required.
- **src**: `ImageSourceOptions[] | ImageSourceOptions` The source of the images for the FastImageSequence class. It can
  either be an array of ImageSourceOptions or a single ImageSourceOptions instance.
- **loop**: `boolean` - Whether the sequence should loop. Default: `false`

- **objectFit**: `'contain' | 'cover'` - How the image should fit the canvas. Default: `'cover'`
- **horizontalAlign**: `number` - Horizontal image alignment. Default: `0.5`
- **verticalAlign**: `number` - Vertical image alignment. Default: `0.5`

- **poster**: `string | undefined` - URL of the poster image. Optional.
- **fillStyle**: `string` - Fill style of the canvas. Default: `'#00000000'`
- **clearCanvas**: `boolean` - Clear the canvas before drawing. Default: `false`
- **scale**: `number` - Scale of the image. Default: `1`
- **showDebugInfo**: `boolean` - Show debug info. Default: `false`
- **name**: `string` - Name of the FastImageSequence instance. Default: `'FastImageSequence'`

### Available options for an ImageSource

- **imageURL**: `(index: number) => string` - Callback returning the URL of an image given its index.
- **tarURL**: `string | undefined` - URL of the tar file containing images. Optional.
- **useWorker**: `boolean` - Use a worker to fetch images. Default: `!isMobile()`
- **maxConnectionLimit**: `number` - Maximum concurrent connections for fetching images. Default: `4`
- **maxCachedImages**: `number` - Number of images to cache. Default: `32`
- **available**: `((index: number) => boolean) | undefined` - Callback returning whether an image is available.
  Optional.
- **image**: `((index: number) => Promise<CanvasImageSource>) | undefined` - Callback returning the image given its
  index.
  Optional.
- **timeout**: `number` - Only start loading an image if the same frame is visible for this time (in
  milliseconds). Optional.

## Methods

The following methods are available for a FastImageSequence object:

### tick(func: (dt: number) => void)

This method registers a tick function to be called on every frame update.

```typescript
sequence.tick(func);
```

- `func` is a function that will be called on every frame update.

### play(fps: number = 30)

This method starts playing the image sequence at a specified frame rate.

```typescript
sequence.play(fps);
```

- `fps` is an optional parameter determining the frame rate at which to play the sequence. If not provided, it defaults
  to `30`. Note that the fps can also be negative, which will play the sequence in reverse.

### stop()

This method stops playing the image sequence.

```typescript
sequence.stop();
```

### playing

This getter method returns a boolean indicating whether the image sequence is playing.

```typescript
const playingStatus = sequence.playing;
```

### paused

This getter method returns a boolean indicating whether the image sequence is paused.

```typescript
const pausedStatus = sequence.paused;
```

### progress

This getter-and-setter method retrieves or sets the image sequence's current progress (0-1).

```typescript
// Get the progress
const currentProgress = sequence.progress;

// Set the progress
sequence.progress = value;
```

- `value` is a number that sets the current progress of the image sequence.

### scale

This getter-and-setter method retrieves or sets the scale of the image sequence. Default: 1.

```typescript
sequence.scale = 2; // zoom in
```

### frameCount

This getter-and-setter method retrieves or sets the number of frames in the image sequence. You can use it to, for example, increase the number of frames in the sequence dynamically.

```typescript
sequence.frameCount = sequence.frameCount + 100;
```

### loadProgress

This is a getter method that retrieves the current load progress of the image sequence.

```typescript
const currentLoadProgress = sequence.loadProgress;
```

The `loadProgress` property returns a number between 0 and 1, representing the current load progress of the image
sequence. Note that the value can decrease if the sequence is played and new frames are loaded.

### getFrameImage(index: number): Promise<CanvasImageSource>

This method gets the image of a specific frame and returns a Promise that resolves with the image of the frame.

```typescript
sequence.getFrameImage(index);
```

- `index` is the index of the frame.

### onLoadProgress(onProgress?: (progress: number) => void): Promise<void>

Register a callback function that is called with the progress of the loading. The function returns a promise that
resolves when progress reaches 1.

```typescript
sequence.onLoadProgress(onProgress);
```

## ImageSource Methods

### sources[index:number].setMaxCachedImages(maxCache: number, onProgress?: (progress: number) => void): Promise<void>

This method sets the number of images that should be preloaded and cached in memory for an input source and returns a
Promise that resolves when all these images are preloaded and cached.

```typescript
sequence.sources[0].setNumberOfCachedImages(maxCache, onProgress);
```

- `maxCache` is the number of images to cache. This should be a positive integer.
- `onProgress` is an optional callback function whenever the loading progress changes. It receives the current progress as a number between 0 and 1.

The returned Promise resolves when loadProgress reaches 1.

## Creating a Tarball with Images

A tarball is a collection of files and directories stored in a single file. In the context of `FastImageSequence`, you
can use a tarball to store (low-resolution preview) images for your image sequence. This can be particularly useful when
you want to seek or jump in the sequence quickly or when the internet speed is low.

To create a tarball with images, you can follow these steps:

1. Prepare your images: Make sure all your images are in a single directory. The images should be in a sequence and
   named consistently (for example, `image1.jpg`, `image2.jpg`, `image3.jpg`, etc.).

2. Create a tarball file. I have created an easy-to-use online tool for
   this: [Tar File Creator](https://reindernijhoff.net/tools/tar/) (no ads, login, etc). Drag and drop your selection of
   images onto the page, and a tarball will be generated that you can download.

3. Alternatively, use a tar tool to create the tarball: if you are comfortable with the command line, you can use
   the `tar` command in Unix-based systems like this:

    ```sh
    cd /path/to/your/images
    tar -cvf sequence.tar -C ./ .
    ```

Once you have your tarball, you can use it with `FastImageSequence` by setting the `tarURL` option to the URL of your
tarball and implement the `imageURL` to return the URL of an image in the tarball, given its index.

## Frequently Asked Questions

### How can I create a tar file (tarball) with images?

I created an easy-to-use online tool for this: [Tar File Creator](https://reindernijhoff.net/tools/tar/). Drag and drop your selection of images onto the page, and a tar file will be generated that you can download.
You can also use a tar tool to create the tar file yourself. 

### I want to download just 8 frames first and preload the rest of the images later. How can I do this?

You can set the `maxCachedImages` option to 8. The FastImageSequence will only preload and cache the first 8 images. You can then set the `maxCachedImages` option to a higher number to preload the rest of the images later.
See this [example](https://github.com/mediamonks/fast-image-sequence/blob/main/example/src/exampleStillImage.js) for more information.

### I have an image sequence of low-res images and want to download a high-res image when the user stops at a frame. How can I do this?

You can set multiple sources using the `src` option. The FastImageSequence will try to load images from the first source in the array. If an image is not available yet, it will try to load it from the next source in the array, etc. Finally, the best matching available image will be rendered.
By setting a `timeout` option, you can control when the FastImageSequence should start loading an image. For example:

```ts
const options = {
  frames: 100,

  src: [
    {
      // First try to display a highres image from an image URL
      imageURL:        (index) => `path/to/your/image/sequence/highres_image${index}.jpg`,
      maxCachedImages: 1,
      timeout:         16, // only start loading an image if the same frame is visible for 16ms
    },
    {
      // Default: serve a low res image from the sequence
      imageURL:        (index) => `path/to/your/image/sequence/lowres_image${index}.jpg`,
      maxCachedImages: 32,
    },
  ],

  loop:      false,
  objectFit: 'contain',
};

const sequence = new FastImageSequence(containerElement, options);

```

### Can I download a tar file myself and use it with FastImageSequence?

Yes, you can download the tar file yourself and create a data URL from it. You can then use this data URL as the `tarURL` option. 
See this [example](https://github.com/mediamonks/fast-image-sequence/blob/main/example/src/exampleLoadTar.js) for more information.


## Building

To build fast-image-sequence, ensure that you have [Git](http://git-scm.com/downloads)
and [Node.js](http://nodejs.org/) installed.

Clone a copy of the repo:

```sh
git clone https://github.com/mediamonks/fast-image-sequence-renderer.git
```

Change to the fast-image-sequence-renderer directory:

```sh
cd fast-image-sequence-renderer
```

Install dev dependencies:

```sh
npm i
```

Build package:

```sh
npm run build
```
