# TODOS
> List of features, improvements and bugs to look at in this project

## ~~Company classification~~ — Done (M9)

## ~~Job triaging~~ — Done (M8)

## ~~Apply button~~ — Done (M8)

## Default headline
There should be a default headline for when one is not defined for an archetype.

## ~~Experience titles~~ — Done (M8)

## MikroORM metadata
We should ensure we have a single temp/ folder:

```
await MikroORM.init({
  // defaults to `./temp`
  metadataCache: { options: { cacheDir: '...' } },
  // ...
});
```

## Experiences
There is a domain modeling issue. Experiences are currently tied to resume.companies but should be a first class aggregate.

## DOMAIN.md
We should maintain a mermaid diagram of the domain.