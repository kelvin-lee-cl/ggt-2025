# 🚀 Local Development Guide

## Testing Your App Locally with Netlify Environment

### **Method 1: Netlify CLI (Recommended)**

This method provides the most accurate production-like environment:

```bash
# Start Netlify development server
netlify dev

# Or with live reload
netlify dev --live

# Or with specific port
netlify dev --port 8888
```

**Features:**
- ✅ Netlify Identity works locally
- ✅ Environment variables loaded
- ✅ Netlify Functions support
- ✅ Redirects and headers applied
- ✅ Live reload on file changes

### **Method 2: Python HTTP Server (Basic)**

For simple static file serving:

```bash
# Python 3
python3 -m http.server 8888

# Python 2
python -m SimpleHTTPServer 8888
```

**Features:**
- ✅ Basic file serving
- ❌ No Netlify Identity
- ❌ No environment variables
- ❌ No redirects/headers

### **Method 3: Node.js HTTP Server**

```bash
# Install http-server globally
npm install -g http-server

# Start server
http-server -p 8888 -c-1
```

## 🔧 **Environment Configuration**

### **Local Development Variables**

Create a `.env` file in your project root:

```env
# Netlify Identity
NETLIFY_IDENTITY_URL=https://ggt-ai-2025.netlify.app

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDd77LjKa3wuaumWHtYhN_3tsVpD99juK0
FIREBASE_AUTH_DOMAIN=ggt-2025.firebaseapp.com
FIREBASE_PROJECT_ID=ggt-2025
FIREBASE_STORAGE_BUCKET=ggt-2025.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=822726025795
FIREBASE_APP_ID=1:822726025795:web:4e059a32a26e5bc336eaf6
```

### **Testing Different Environments**

#### **1. Local Development (localhost)**
```bash
# URL: http://localhost:8888
# Features: Demo authentication, local Firebase
netlify dev
```

#### **2. Netlify Preview (Production-like)**
```bash
# URL: https://preview-xxx--ggt-ai-2025.netlify.app
# Features: Real Netlify Identity, production Firebase
netlify dev --live
```

#### **3. Production Testing**
```bash
# URL: https://ggt-ai-2025.netlify.app
# Features: Full production environment
# Deploy with: netlify deploy --prod
```

## 🧪 **Testing Checklist**

### **Authentication Testing**
- [ ] Login with Gmail/Outlook
- [ ] Logout functionality
- [ ] Admin access (if admin email)
- [ ] Button states (enabled/disabled)

### **Firebase Integration**
- [ ] Student progress tracking
- [ ] Lesson completion status
- [ ] Admin dashboard data
- [ ] CSV export functionality

### **UI/UX Testing**
- [ ] Dark mode toggle
- [ ] Language switching
- [ ] Responsive design
- [ ] Font Awesome icons
- [ ] Modal functionality

### **Content Testing**
- [ ] All 12 lessons load
- [ ] Dynamic lesson content
- [ ] Quiz system
- [ ] Exercise submission
- [ ] AI tools integration

## 🐛 **Common Issues & Solutions**

### **Issue 1: Netlify Identity Not Working**
```bash
# Solution: Use Netlify CLI
netlify dev --live
```

### **Issue 2: Font Awesome Icons Missing**
```bash
# Check CSP headers in _headers file
# Ensure CDN is allowed in Content-Security-Policy
```

### **Issue 3: Firebase Connection Issues**
```bash
# Check Firebase configuration
# Verify API keys in firebase-config.js
# Test with production URL
```

### **Issue 4: CORS Errors**
```bash
# Use Netlify CLI instead of simple HTTP server
# Check _headers file for proper CORS configuration
```

## 📱 **Mobile Testing**

### **Local Network Access**
```bash
# Get your local IP
ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from mobile device
http://YOUR_LOCAL_IP:8888
```

### **Netlify Live URL**
```bash
# Use Netlify dev with live URL
netlify dev --live
# Access the provided live URL from any device
```

## 🔄 **Development Workflow**

1. **Start Development Server**
   ```bash
   netlify dev --live
   ```

2. **Make Changes**
   - Edit files in your IDE
   - Changes auto-reload

3. **Test Features**
   - Authentication
   - Firebase integration
   - UI components

4. **Deploy to Production**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin master
   netlify deploy --prod
   ```

## 📊 **Performance Testing**

### **Local Performance**
```bash
# Test with Chrome DevTools
# Network tab: Check resource loading
# Performance tab: Check rendering
# Lighthouse: Run performance audit
```

### **Production Performance**
```bash
# Test on Netlify preview
# Use GTmetrix or PageSpeed Insights
# Monitor Firebase usage
```

## 🚀 **Quick Start Commands**

```bash
# 1. Start development server
netlify dev --live

# 2. Open in browser
open http://localhost:8888

# 3. Test authentication
# Click Login button

# 4. Test all features
# Navigate through lessons, admin, etc.

# 5. Deploy when ready
netlify deploy --prod
```

## 📝 **Notes**

- **Netlify CLI** provides the most accurate production environment
- **Live URLs** allow testing from any device
- **Environment variables** are automatically loaded
- **Hot reload** works for instant feedback
- **Production deployment** is seamless with `netlify deploy --prod`
