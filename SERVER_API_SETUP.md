# Server-Side API Key Setup

This document explains how to set up secure server-side API key storage for the text generator.

## 🔐 **Security Benefits**

- ✅ **API key never exposed** to client-side code
- ✅ **All users can use** the text generator without individual API keys
- ✅ **Admin-only management** of the API key
- ✅ **Fallback system** to local storage if server is unavailable

## 🚀 **Setup Instructions**

### 1. **Netlify Environment Variables**

1. Go to your Netlify dashboard
2. Navigate to **Site settings** → **Environment variables**
3. Add a new environment variable:
   - **Key**: `DEEPSEEK_API_KEY`
   - **Value**: Your actual Deepseek API key
   - **Scopes**: Production, Deploy previews, Branch deploys

### 2. **Local Development**

For local development, create a `.env` file in your project root:

```bash
# .env
DEEPSEEK_API_KEY=your_actual_deepseek_api_key_here
```

### 3. **Admin Token Configuration**

The admin token is currently hardcoded in the functions. For production, you should:

1. **Generate a secure admin token**
2. **Update the token in `netlify/functions/set-api-key.js`**
3. **Store it securely** (not in code)

## 🔧 **How It Works**

### **For Regular Users:**
1. User visits text generator
2. System automatically fetches API key from server
3. User can generate text without any setup

### **For Admin Users:**
1. Admin sees API configuration section
2. Admin can update the server-side API key
3. Changes apply to all users immediately

## 📁 **File Structure**

```
netlify/
├── functions/
│   ├── get-api-key.js    # Retrieves API key from server
│   └── set-api-key.js    # Updates API key (admin only)
```

## 🛡️ **Security Features**

- **Environment variables**: API key stored securely on server
- **Admin authentication**: Only admins can modify API key
- **CORS protection**: Proper headers for cross-origin requests
- **Error handling**: Graceful fallbacks if server is unavailable
- **Input validation**: API key validation before storage

## 🔄 **Fallback System**

If the server-side API key is unavailable:
1. System tries to get API key from server
2. If server fails, falls back to local storage
3. If local storage fails, shows error message

## 🚨 **Important Notes**

- **Never commit** your actual API key to version control
- **Use environment variables** for all sensitive data
- **Rotate admin tokens** regularly in production
- **Monitor API usage** to prevent abuse

## 🧪 **Testing**

1. Set up environment variable
2. Deploy to Netlify
3. Test as regular user (should work automatically)
4. Test as admin (should be able to update API key)
5. Verify fallback works if server is down
