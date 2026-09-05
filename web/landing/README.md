# Rivlet landing

Landing frontend using Next.js and coss ui, initialized with
`bunx --bun shadcn@latest init @coss/style`.
Only the button and its required loading spinner are included.
Run `bun dev:landing` from the repository root to serve it on port 3001.

## Adding components

To add components to your app, run the following command:

```bash
bunx --bun shadcn@latest add @coss/button
```

This will place the ui components in the `components` directory.

## Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button";
```
