# Saffron & Silk

Editable React/Vite website with a Supabase-backed admin portal and Netlify deployment configuration.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Netlify

Build command: `npm run build`
Publish directory: `dist`
Node: `22.16.0`

The app expects these environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
