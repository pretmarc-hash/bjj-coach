# Cómo usar BJJ Coach en el móvil (gratis)

La app es una página web. Para instalarla en el móvil hay que publicarla una vez en internet (gratis). Los datos NUNCA salen de tu móvil.

## Opción A: GitHub Pages (se puede hacer solo con el móvil)
1. Descomprime el .zip en el móvil (app Archivos). Entra en la carpeta `bjj-coach`: verás ~20 archivos sueltos, sin subcarpetas.
2. Crea cuenta en github.com (gratis) desde el navegador.
3. Pulsa "+" > "New repository". Nombre: `bjj-coach`. Marca "Public". Crea.
4. En el repositorio: "uploading an existing file" (o Add file > Upload files). Selecciona TODOS los archivos de la carpeta y súbelos. Pulsa "Commit changes".
5. Settings > Pages > Source: "Deploy from a branch", Branch `main` / carpeta `/ (root)` > Save.
6. A los 1-2 minutos tu app estará en `https://TU-USUARIO.github.io/bjj-coach/`.
7. Ábrela en el móvil y: Android (Chrome) menú ⋮ > "Instalar aplicación"; iPhone (Safari) Compartir > "Añadir a pantalla de inicio".

## Opción B: Netlify Drop (necesita ordenador)
Entra en app.netlify.com/drop y arrastra la carpeta `bjj-coach`. Te da un enlace.

## Notas
- Tus datos se guardan en el navegador de ese móvil. Haz copias desde Ajustes > Exportar.
- Si actualizas la app, sube los archivos nuevos al mismo repositorio.
- El repositorio público solo contiene el código, no tus datos.
