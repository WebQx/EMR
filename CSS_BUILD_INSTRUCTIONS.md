# WebQX Healthcare CSS Build Instructions

## For Production (GitHub Pages)

The WebQX healthcare platform now uses a local CSS file instead of the Tailwind CDN to avoid production warnings.

### Current Setup
- **CSS File**: `assets/webqx-styles.css` - Pre-built production-ready CSS
- **Source**: `src/styles.css` - Tailwind source file (requires build process)
- **Config**: `tailwind.config.js` - Tailwind configuration

### Using Pre-built CSS (Current)
The `assets/webqx-styles.css` file contains all necessary styles for the healthcare platform and is ready for production use on GitHub Pages.

### Building from Source (When Node.js is available)

1. **Install dependencies**:
   ```bash
   npm install -D tailwindcss @tailwindcss/forms @tailwindcss/typography autoprefixer postcss
   ```

2. **Build CSS**:
   ```bash
   # Development build
   npm run build:css
   
   # Production build (minified)
   npm run build:css:prod
   ```

3. **Deploy**:
   ```bash
   npm run deploy:pages
   ```

### Files Updated
- `patient-portal/index.html` - Updated to use local CSS instead of CDN
- `assets/webqx-styles.css` - Production-ready CSS file
- `package.json` - Added CSS build scripts
- `tailwind.config.js` - Tailwind configuration
- `postcss.config.js` - PostCSS configuration

### Benefits
- ✅ No production warnings
- ✅ Faster loading (no external CDN dependency)
- ✅ Custom healthcare-themed styles
- ✅ Glass morphism design system
- ✅ Responsive design utilities
- ✅ GitHub Pages compatible
