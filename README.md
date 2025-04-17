 # UOR Learning App

 This React application provides an interactive learning experience for the Prime Framework & Universal Object Reference (UOR). 

 ## Project Structure
 - public/
   - index.html  ← root HTML template
 - src/
   - index.js    ← application entry point
   - App.js      ← routes & layout
   - index.css   ← global styles
   - App.css     ← layout & component styles
   - components/
     - Sidebar.js  ← navigation pane
   - templates/
     - SectionTemplate.js    ← wrapper for section pages
     - SubsectionTemplate.js ← wrapper for subsection pages
   - content/
     - sections/
       - metadata.js         ← section/subsection IDs & titles
       - index.js            ← sections registry for routing & nav
       - uor.js              ← UOR section stub
       - uor/overview.js     ← UOR Overview subsection stub
       - foundations.js      ← Prime Foundations section stub
       - foundations/
         - uniqueFactorization.js ← Unique Factorization subsection stub

 ## Getting Started
 1. Install dependencies:
    ```bash
    npm install
    ```
 2. Run in development mode:
    ```bash
    npm start
    ```
 3. Build for production:
    ```bash
    npm run build
    ```

 ## Adding New Sections
 1. In `src/content/sections/metadata.js`, add a new entry with `id`, `title`, and `description`.
 2. In `src/content/sections`, create a new `[id].js` file that exports a React component using `SectionTemplate`.
 3. (Optional) Create a subfolder and add subsections similarly, then update `src/content/sections/index.js` to import and register them.
 4. The Sidebar and routes will update automatically.