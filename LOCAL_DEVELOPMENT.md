# Local Development with Netlify

## 🚀 Running the Project Locally

Your project is configured to run with Netlify's local development server. This ensures that all Netlify functions and features work exactly as they will in production.

### Prerequisites

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Verify Installation:**
   ```bash
   netlify --version
   ```

### Running the Development Server

#### Option 1: Using npm scripts
```bash
npm run dev
# or
npm start
```

#### Option 2: Direct Netlify CLI
```bash
netlify dev
```

### What This Does

- **Starts local server** at `http://localhost:8888`
- **Runs Netlify Functions** locally (API endpoints)
- **Simulates production environment** exactly
- **Enables all features** including Firebase authentication
- **Hot reloading** for development

### Available Endpoints

When running locally, your Netlify functions will be available at:
- `http://localhost:8888/.netlify/functions/get-api-key`
- `http://localhost:8888/.netlify/functions/set-api-key`
- `http://localhost:8888/.netlify/functions/get-recraft-api-key`
- `http://localhost:8888/.netlify/functions/set-recraft-api-key`
- `http://localhost:8888/.netlify/functions/recraft-image-generate`

### Testing Features

1. **Open:** `http://localhost:8888`
2. **Test Authentication:** Click "Get Started" → Google Sign-In
3. **Test AI Tools:** Use text generator, image generator
4. **Test Admin Features:** Access admin dashboard
5. **Test All Pages:** Lessons, quizzes, uploads

### Environment Variables

For local development, you can set environment variables in a `.env` file:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key
RECRAFT_API_KEY=your_recraft_api_key
```

### Troubleshooting

- **Port conflicts:** Netlify will automatically find an available port
- **Firebase issues:** Ensure your Firebase project is properly configured
- **Function errors:** Check the terminal for detailed error messages
- **CORS issues:** Netlify dev handles CORS automatically

### Production Deployment

When ready to deploy:
1. **Push to GitHub** (if using Git integration)
2. **Deploy to Netlify** via dashboard or CLI
3. **Set environment variables** in Netlify dashboard
4. **Test production site** thoroughly

---

**Your project is ready for local development with Netlify!** 🎉
