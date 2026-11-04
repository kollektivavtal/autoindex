# kollektivavtal-autoindex

Publishes the PDF and thumbnail assets used by the Swedish collective agreement archive for a single year. The presentation layer lives in [kollektivavtal-homepage](https://github.com/kollektivavtal/homepage).

The action copies PDFs with their original filenames and generates a `-320.webp` thumbnail from the first page of each PDF. It does not build or deploy a separate HTML index.

## Local usage

```sh
bash ./scripts/publish-assets.sh ../kollektivavtal-2023 ./public
```

## Dependencies

```sh
brew install graphicsmagick ghostscript webp
```

The GitHub Action installs GraphicsMagick; Ghostscript and `cwebp` must also be available on the runner.

## License

[CC-0](https://github.com/arbetsmiljo/autoindex/blob/main/license)
