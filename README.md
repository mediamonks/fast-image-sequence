# Fast Image Sequence Renderer

The fast-image-sequence is a powerful package that allows you to display a sequence of images at a high frame rate on your website. It can be used to create smooth animations or video-like sequences from a series of images.

The FastImageSequence supports various options for customizing the behaviour of the image sequence, such as preloading all images, using a worker to handle tar files, and more.

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
import { FastImageSequence } from '@mediamonks/fast-image-sequence';

const options = {
    frames: 100,

    // You can directly load images from an image URL
    imageURLCallback: (index) => `path/to/your/image/sequence/image${index}.jpg`,
    
    // Or you can load images from a tar file
    tarURL: 'path/to/your/tar/file.tar',
    tarImageURLCallback: (index) => `image${index}.jpg`,

    // Note that you can also simultaneously use direct image loading and image loading from a tar file. 
    // In that case, you will use the tar file to serve (super low res) preview images shown before the
    // direct image loading completes.

    wrap: true,
    size: 'cover',
};

const sequence = new FastImageSequence(containerElement, options);
sequence.play();
```

In the options object, you need to set either imageURLCallback or tarImageURLCallback. **Both are optional, but at least one must be set.** If you use tarImageURLCallback, you must also load a tar file.

The imageURLCallback and tarImageURLCallback are functions that take an index as a parameter and return a string representing the URL of the image at that index in the sequence. This allows you to dynamically generate the URLs of your images based on their index in the sequence.  

In the case of a large image sequence, the normal usage of this library involves having a tar file with low-resolution preview images. These will be used when you randomly seek or jump in the sequence or when the internet speed is low. However, you are free to fine-tune it as you please. For example, you can also use a tar file with high-resolution images and don't set an imageURLCallback. This way, all images will be served from the tar file, reducing the number of requests and speeding up the loading time.  

By setting callbacks for URLs and loading the tar file yourself, you can set different functions for different devices and/or different supported image file formats. This allows you to optimize the image sequence for your specific project needs.

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

- `fps` is an optional parameter determining the frame rate at which to play the sequence. If not provided, it defaults to `30`. Note that the fps can also be negative, which will play the sequence in reverse.

### stop()

This method stops playing the image sequence.

```typescript
sequence.stop();
```

### isPlaying

This getter method returns a boolean indicating whether the image sequence is playing.

```typescript
const playingStatus = sequence.isPlaying;
```

### isPaused

This getter method returns a boolean indicating whether the image sequence is paused.

```typescript
const pausedStatus = sequence.isPaused;
```

### progress

This is a getter-and-setter method that retrieves or sets the image sequence's current progress (0-1).

```typescript
// Get the progress
const currentProgress = sequence.progress;

// Set the progress
sequence.progress = value;
```

- `value` is a number that sets the current progress of the image sequence.

### getFrameImage(index: number): Promise<HTMLImageElement | ImageBitmap>

This method gets the image of a specific frame and returns a Promise that resolves with the image of the frame.

```typescript
sequence.getFrameImage(index);
```

- `index` is the index of the frame to get the image from.


## Creating a Tarball with Preview Images

A tarball is a collection of files and directories stored in a single file. In the context of `FastImageSequence`, you can use a tarball to store low-resolution preview images for your image sequence. This can be particularly useful when you want to seek or jump in the sequence quickly or when the internet speed is low.

To create a tarball with preview images, you can follow these steps:

1. Prepare your preview images: Make sure all your preview images are in a single directory. The images should be in a sequence and named consistently (for example, `image1.jpg`, `image2.jpg`, `image3.jpg`, etc.).

2. Create a tarball file. If you prefer a graphical interface, use an online tool like [Tar File Creator](https://reindernijhoff.net/tools/tar/). Drag and drop your selection of images onto the page, and a tarball will be generated that you can download.
 
3. Alternatively, use a tar tool to create the tarball: if you are comfortable with the command line, you can use the `tar` command in Unix-based systems like this:

    ```sh
    tar -cvf preview_images.tar -C /path/to/your/preview_images .
    ```

   This command will create a tarball named `preview_images.tar` from the directory `/path/to/your/preview_images`.

Once you have your tarball, you can use it with `FastImageSequence` by setting the `tarURL` option to the URL of your tarball and implementing the `tarImageURLCallback` to return the URL of an image in the tarball given its index.

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
