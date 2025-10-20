# Isabella Inventario (React + Firebase)

App ligera para controlar el inventario de barra del Bar Isabella (Plaza Ñuñoa). Tema **claro** con acentos **magenta**.

## Requisitos
- Node.js 18+
- Cuenta Firebase (Firestore habilitado)

## Ejecutar en local
```bash
npm install
npm run dev
```
Abre la URL que aparece (por defecto http://localhost:5173).

## Estructura
- `public/` → assets estáticos (incluye logo)
- `src/firebase.js` → configuración Firebase (ya incluida)
- `src/App.jsx` → aplicación principal
- `src/styles.css` → estilos base
- `vite.config.js` → build config

## Firestore
Colecciones utilizadas:
- `products`
- `movements`

Campos recomendados para `products`:
```
name (string), category (string), supplier (string),
unit (string), barcode (string), stock (number),
stockMin (number), stockIdeal (number), cost (number),
createdAt (timestamp), updatedAt (timestamp), isActive (bool)
```

## Deploy rápido (Vercel)
1. Sube este proyecto a GitHub.
2. Entra a https://vercel.com → New Project → Importa el repo.
3. Build Command: `npm run build`, Output: `dist/` (Vercel detecta Vite automáticamente).
