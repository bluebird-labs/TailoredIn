# TODOS
> List of features, improvements and bugs to look at in this project

## ~~Company classification~~ — Done (M9)

## ~~Job triaging~~ — Done (M8)

## ~~Apply button~~ — Done (M8)

## Default headline
There should be a default headline for when one is not defined for an archetype.

## ~~Experience titles~~ — Done (M8)

## ~~MikroORM metadata~~ — Done

## Experiences
There is a domain modeling issue. Experiences are currently tied to resume.companies but should be a first class aggregate.

## DOMAIN.md
We should maintain a mermaid diagram of the domain.

## API Conventions
The CONVENTIONS.md file should contain conventions for API design and we should fix the existing endpoints.

### Pagination
Most list endpoints need to be paginated. Right now we use page / per_page but we should use limit/offset instead.

### Sorting
The API should allow sorting on different fields in a single sort parameter:
```
?sort=foo,bar:desc,baz:asc
```

### Response format
All responses should follow the same format with te following top level. In order to allow for multiple entity types to be returned (for example when needing to deduplicate nested objects), the "data" section is an object.

```typescript
{
    success: boolean,
    error: boolean,
    errorCode: string | null,
    pagination: {
        limit: number,
        offset: number,
        hasNext: boolean,
    } | null
    data: {
        [entityName]: EntityType | EntityType[],
        [entityName]: EntityType | EntityType[]
    }
}
```