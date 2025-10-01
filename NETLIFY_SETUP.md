# Netlify Identity Setup Guide

## 🚀 **Current Status: Demo Mode Active**

Your Educational Hub is currently running in **demo mode** with simulated Gmail/Outlook authentication. This allows you to test all features locally without requiring a Netlify deployment.

## 🎯 **Demo Authentication Features**

### **Available Demo Accounts:**
1. **Gmail Demo** - `student@gmail.com` (John Student)
2. **Outlook Demo** - `student@outlook.com` (Jane Student)  
3. **Admin Demo** - `admin@educationalhub.com` (Admin User)

### **How to Test:**
1. Click the **"Login"** button in the navbar
2. Choose from Gmail, Outlook, or Admin demo accounts
3. Test all features with the logged-in user
4. Access admin dashboard with admin account
5. Logout and switch between accounts

## 🌐 **For Production: Real Netlify Identity Setup**

### **Step 1: Deploy to Netlify**

#### Option A: Manual Deployment
1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your project folder
4. Note your site URL (e.g., `https://your-site-name.netlify.app`)

#### Option B: Git Integration
1. Push your code to GitHub
2. Connect GitHub repository to Netlify
3. Enable automatic deployments

### **Step 2: Enable Netlify Identity**

1. **Go to Site Settings:**
   - In your Netlify dashboard, go to your site
   - Click "Site settings" → "Identity"

2. **Enable Identity:**
   - Click "Enable Identity"
   - Wait for the service to initialize

3. **Configure External Providers:**
   - Click "Settings and usage"
   - Scroll to "External providers"
   - Enable "Google" (for Gmail)
   - Enable "Microsoft" (for Outlook)

### **Step 3: Configure Google OAuth**

1. **Google Cloud Console:**
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to "Credentials" → "Create credentials" → "OAuth 2.0 Client ID"

2. **OAuth Configuration:**
   - Application type: "Web application"
   - Authorized redirect URIs: `https://your-site-name.netlify.app/.netlify/identity`
   - Copy the Client ID and Client Secret

3. **Netlify Configuration:**
   - In Netlify Identity settings
   - Paste Google Client ID and Secret
   - Save configuration

### **Step 4: Configure Microsoft OAuth**

1. **Azure Portal:**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Navigate to "Azure Active Directory"
   - Go to "App registrations" → "New registration"

2. **App Registration:**
   - Name: "Educational Hub"
   - Redirect URI: `https://your-site-name.netlify.app/.netlify/identity`
   - Copy Application (client) ID and create a client secret

3. **Netlify Configuration:**
   - In Netlify Identity settings
   - Paste Microsoft Client ID and Secret
   - Save configuration

### **Step 5: Update Site URL**

1. **Update netlify.toml:**
   ```toml
   [context.production.environment]
     NETLIFY_IDENTITY_URL = "https://your-site-name.netlify.app"
   ```

2. **Update HTML:**
   - Replace `https://identity.netlify.com/v1/netlify-identity-widget.js` with your site URL
   - Update the script source in your HTML files

### **Step 6: Test Authentication**

1. **Deploy your changes**
2. **Visit your live site**
3. **Click "Login"** - you should see real Gmail/Outlook options
4. **Test the authentication flow**

## 🔧 **Current Demo Features Working**

✅ **User Authentication** - Login/logout functionality  
✅ **Admin Access** - Admin dashboard access  
✅ **Student Progress** - Progress tracking per user  
✅ **Language Switching** - English/Chinese support  
✅ **All Pages** - Lessons, uploads, quizzes, AI tools  
✅ **Responsive Design** - Mobile-friendly interface  

## 📱 **Testing the Demo**

1. **Open your local site:** `http://localhost:8888`
2. **Click "Login"** in the navbar
3. **Choose a demo account:**
   - Gmail: `student@gmail.com`
   - Outlook: `student@outlook.com`  
   - Admin: `admin@educationalhub.com`
4. **Test features:**
   - Navigate to different pages
   - Try the admin dashboard (with admin account)
   - Test language switching
   - Upload assignments
   - Take quizzes
   - Use AI tools

## 🚀 **Next Steps**

1. **Test the demo thoroughly** to ensure all features work
2. **Deploy to Netlify** when ready for production
3. **Configure real OAuth** for Gmail/Outlook authentication
4. **Update admin email list** in `script.js` for your real admin accounts

## 📞 **Support**

If you encounter any issues:
- Check browser console for errors
- Verify all files are properly loaded
- Test in incognito mode
- Check Netlify deployment logs

---

**Your Educational Hub is ready to use with demo authentication!** 🎉
