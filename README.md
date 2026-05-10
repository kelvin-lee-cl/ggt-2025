# Educational Hub - Static Website

A comprehensive educational platform built as a static website with authentication, AI tools integration, and student progress tracking.

## Features

### 🔐 Authentication
- **Netlify Identity** integration for Gmail/Outlook login
- Secure user management
- Admin access control

### 📚 Learning Management
- **Multiple lesson pages** with interactive content
- **Progress tracking** for each student
- **Quiz system** with Q&A assessments
- **Assignment submission** with file uploads

### 🤖 AI-Powered Tools
- **Image Generator** using Recraft API
- **Text Generator** using Deepseek API
- Custom prompts and style options
- Generated content history

### 👨‍💼 Admin Dashboard
- **Student progress overview**
- **Assignment tracking**
- **Quiz results analysis**
- **CSV export** for scoring and reports
- **Real-time statistics**

### 🎨 Professional Design
- **Bootstrap 5** for responsive design
- **Modern UI/UX** with smooth animations
- **Mobile-friendly** interface
- **Accessible** components

## Project Structure

```
/
├── index.html              # Landing page
├── lesson1.html            # Lesson 1: Introduction
├── lesson2.html            # Lesson 2: Advanced Topics
├── lesson3.html            # Lesson 3: Practical Applications
├── upload.html             # Assignment submission
├── quiz.html               # Q&A assessments
├── image-generator.html    # AI image generation
├── text-generator.html     # AI text generation
├── admin.html              # Admin dashboard
├── styles.css              # Custom styles
├── script.js               # Main JavaScript
├── upload.js               # Upload functionality
├── quiz.js                 # Quiz system
├── image-generator.js      # Image generation
├── text-generator.js       # Text generation
├── admin.js                # Admin functionality
├── netlify.toml            # Netlify configuration
├── _headers                # Security headers
├── _redirects              # URL redirects
└── README.md               # This file
```

## Setup Instructions

### 1. Netlify Deployment

1. **Connect to Netlify:**
   - Push your code to GitHub/GitLab
   - Connect your repository to Netlify
   - Deploy automatically

2. **Enable Netlify Identity:**
   - Go to Site Settings → Identity
   - Enable Identity service
   - Configure external providers (Gmail, Outlook)
   - Set up admin users

3. **Configure Environment Variables:**
   - Add your Recraft API key
   - Add your Deepseek API key
   - Set up any other required variables

### 2. API Configuration

#### Recraft API (Image Generation)
1. Get your API key from [Recraft.ai](https://recraft.ai)
2. Configure in the image generator page
3. Test image generation functionality

#### Deepseek API (Text Generation)
1. Get your API key from [Deepseek.com](https://deepseek.com)
2. Configure in the text generator page
3. Test text generation functionality

### 3. Admin Setup

1. **Set Admin Users:**
   - Update the `isAdminUser()` function in `script.js`
   - Add your email addresses to the admin list
   - Test admin access to the dashboard

2. **Configure Student Tracking:**
   - Student progress is stored in localStorage
   - Data persists across sessions
   - Export functionality for CSV reports

## Usage

### For Students
1. **Login** with Gmail/Outlook
2. **Browse lessons** and complete content
3. **Take quizzes** to test knowledge
4. **Submit assignments** with file uploads
5. **Use AI tools** for creative projects
6. **Track progress** in your profile

### For Administrators
1. **Access admin dashboard** with admin credentials
2. **View student progress** and statistics
3. **Export data** to CSV for analysis
4. **Monitor activity** and engagement
5. **Manage content** and assignments

## Customization

### Adding New Lessons
1. Create new HTML files (e.g., `lesson4.html`)
2. Update navigation links
3. Add lesson data to the system
4. Configure progress tracking

### Modifying AI Tools
1. Update API endpoints in respective JS files
2. Modify request/response handling
3. Add new features or parameters
4. Test with your API keys

### Styling Changes
1. Edit `styles.css` for custom styles
2. Modify Bootstrap classes in HTML
3. Add new animations or effects
4. Ensure mobile responsiveness

## Security Features

- **Content Security Policy** headers
- **XSS Protection** enabled
- **Frame Options** configured
- **Secure authentication** with Netlify Identity
- **Input validation** on all forms
- **File type restrictions** for uploads

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance

- **Static hosting** for fast loading
- **CDN delivery** through Netlify
- **Optimized assets** with caching
- **Lazy loading** for images
- **Minified CSS/JS** in production

## Troubleshooting

### Common Issues

1. **Authentication not working:**
   - Check Netlify Identity configuration
   - Verify external provider settings
   - Test with different browsers

2. **API calls failing:**
   - Verify API keys are correct
   - Check network connectivity
   - Review browser console for errors

3. **Admin access denied:**
   - Update admin email list in `script.js`
   - Clear browser cache and cookies
   - Re-login with admin account

### Support

For technical support or questions:
- Check browser console for errors
- Verify all files are properly uploaded
- Test in incognito/private browsing mode
- Review Netlify deployment logs

## License

This project is for educational purposes. Feel free to modify and use for your own educational projects.

---

**Built with ❤️ for education**
