# kollektivavtal-autoindex

Generates a HTML index of Swedish kollektivavtal documents for a single year.

All filesystem lookups in this repo assume a runtime context matching the structure defined in the README of [svenskamodellen/workspace](https://github.com/svenskamodellen/workspace).

## Commands

- Run `YEAR=2023 pnpm dev` and open http://localhost:3000/2023/ for the dev server
- Run `YEAR=2023 pnpm build` to run a production build
- Run `pnpm deploy` to deploy the latest build to production
- Run `YEAR=2023 pnpm ship` to run build + deploy in sequence

## Dependencies

```
brew install graphicsmagick ghostscript
```

## License

[CC-0](https://github.com/arbetsmiljo/autoindex/blob/main/license)
