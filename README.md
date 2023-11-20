# Fast Image Sequence Renderer

The fast-image-sequence-renderer is a powerful package that allows you to display a sequence of images at a high frame rate on your website. It can be used to create smooth animations or video-like sequences from a series of images.

The FastImageSequence supports a variety of options for customizing the behavior of the image sequence, such as preloading all images, using a worker for handling tar files, and more.

## Getting started

### Installing

Add `@mediamonks/fast-image-sequence-renderer` to your project:

```sh
npm i @mediamonks/fast-image-sequence-renderer
```
## Basic usage

Creating a FastImageSequence instance and playing an image sequence.
```ts
import { FastImageSequence } from '@mediamonks/fast-image-sequence-renderer';

const options = {
    frames: 100,
    wrap: true,
    size: 'cover',
    imageURLCallback: (index) => `path/to/your/image/sequence/image${index}.jpg`,
    
    tarURL: 'path/to/your/tar/file.tar',
    tarImageURLCallback: (index) => `path/to/your/tar/image/sequence/image${index}.jpg`,
};

const sequence = new FastImageSequence(containerElement, options);
sequence.play();
```

In the options object, you need to set either imageURLCallback or tarImageURLCallback. Both are optional, but at least one must be set. If you use tarImageURLCallback, you also have to load a tar file.

The imageURLCallback and tarImageURLCallback are functions that take an index as a parameter and return a string representing the URL of the image at that index in the sequence. This allows you to dynamically generate the URLs of your images based on their index in the sequence.  

The normal usage of this library involves having a tar file with low-resolution preview images. These will be used when you randomly seek or jump in the sequence, or when the internet speed is low. However, you are free to fine-tune as you will. For example, you can choose to only use the tar with high-resolution images.  

By setting callbacks for URLs and loading the tar file yourself, you can set different functions for different devices and/or different supported image file formats. This gives you the flexibility to optimize the image sequence for your specific project needs.

This library allows you to control the playback of the image sequence, stop it, get the current progress, and more.
```ts
sequence.stop();
console.log(sequence.progress);
```

## Creating a Tarball with Preview Images

A tarball is a collection of files and directories stored in a single file. In the context of `FastImageSequence`, you can use a tarball to store low-resolution preview images for your image sequence. This can be particularly useful when you want to quickly seek or jump in the sequence, or when the internet speed is low.

To create a tarball with preview images, you can follow these steps:

1. Prepare your preview images: Make sure all your preview images are in a single directory. The images should be in a sequence and named in a consistent manner (for example, `image1.jpg`, `image2.jpg`, `image3.jpg`, etc.).

2. Use a tar tool to create the tarball: There are many tools available to create tarballs. If you are comfortable with command line, you can use the `tar` command in Unix-based systems like this:

    ```sh
    tar -cvf preview_images.tar /path/to/your/preview_images
    ```

   This command will create a tarball named `preview_images.tar` from the directory `/path/to/your/preview_images`.

3. Alternatively, if you prefer a graphical interface, you can use an online tool like [Tar File Creator](https://reindernijhoff.net/tools/tar/). Simply drag and drop your directory of images onto the page, and it will generate a tarball that you can download.

Once you have your tarball, you can use it with `FastImageSequence` by setting the `tarURL` option to the URL of your tarball, and implementing the `tarImageURLCallback` to return the URL of an image in the tarball given its index.

## Building

In order to build seng-event, ensure that you have [Git](http://git-scm.com/downloads)
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
