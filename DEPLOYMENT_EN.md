# 🚀 FunnyGames 部署指南

本指南说明如何将您的FunnyGames网站部署到各种托管平台。

## 📋 部署前检查清单

部署前，请确保您已经：

- ✅ 使用 `python3 generate-games.py` 生成了所有游戏页面
- ✅ 使用 `python3 generate-sitemap.py` 创建了sitemap.xml
- ✅ 更新了配置文件中的基础URL
- ✅ 在本地测试了网站
- ✅ 优化了图片和资源文件
- ✅ 验证了HTML并检查了无效链接

## 🌐 静态托管平台

### GitHub Pages

1. **在GitHub上创建新仓库**
2. **上传您的文件** 到仓库
3. **在仓库设置中启用GitHub Pages**
4. **选择源**: 从main分支部署
5. **自定义域名** (可选): 添加包含您域名的CNAME文件

```bash
# 克隆并推送到GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/funnygames.git
git push -u origin main
```

**优点**: 免费，自动SSL，易于使用
**缺点**: 仅限于静态网站

### Netlify

1. **将您的仓库连接** 到Netlify
2. **设置构建配置**:
   - 构建命令: (静态网站留空)
   - 发布目录: `/` (根目录)
3. **在git推送时自动部署**
4. **自定义域名**: 在网站设置中添加

**环境变量** (如需要):
```
NODE_ENV=production
BASE_URL=https://yoursite.netlify.app
```

**优点**: 出色的性能，CDN，表单支持
**缺点**: 免费计划有带宽限制

### Vercel

1. **从GitHub导入您的项目**
2. **配置设置**:
   - 框架: 其他
   - 构建命令: (无)
   - 输出目录: (无)
3. **部署** 并获得即时预览URL

**优点**: 出色的性能，边缘函数，易于部署
**缺点**: 免费计划构建时间有限

### Firebase Hosting

1. **安装Firebase CLI**:
```bash
npm install -g firebase-tools
```

2. **初始化Firebase**:
```bash
firebase init hosting
```

3. **Configure `firebase.json`**:
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "*.py",
      "*.md"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

4. **Deploy**:
```bash
firebase deploy
```

**Pros**: Google infrastructure, excellent performance
**Cons**: More complex setup

## 🖥️ VPS/Server Deployment

### nginx Configuration

Create `/etc/nginx/sites-available/funnygames`:

```nginx
server {
    listen 80;
    server_name funnygames.com www.funnygames.com;
    root /var/www/funnygames;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Fallback for SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Robots and sitemap
    location = /robots.txt {
        allow all;
        log_not_found off;
        access_log off;
    }

    location = /sitemap.xml {
        allow all;
        log_not_found off;
        access_log off;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/funnygames /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache Configuration

Create `.htaccess` in your root directory:

```apache
# Enable compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache static files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# Fallback routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## 🔒 SSL Certificate Setup

### Using Let's Encrypt (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d funnygames.com -d www.funnygames.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Cloudflare

1. **Add your domain** to Cloudflare
2. **Update nameservers** at your domain registrar
3. **Enable SSL/TLS**: Full (strict) mode
4. **Configure DNS**: Add A records pointing to your server
5. **Enable security features**: Under Security tab

## 📊 Performance Optimization

### CDN Setup

#### Cloudflare
1. Sign up and add your domain
2. Configure DNS records
3. Enable optimizations:
   - Auto Minify (CSS, JS, HTML)
   - Brotli compression
   - Rocket Loader
   - Polish (image optimization)

#### AWS CloudFront
1. Create distribution
2. Set origin to your website
3. Configure caching rules
4. Update DNS to point to CloudFront

### Image Optimization

```bash
# Install tools
sudo apt install imagemagick webp

# Convert images to WebP
for file in images/*.jpg; do
    cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

## 🔍 SEO Configuration

### Google Search Console

1. **Verify ownership** of your domain
2. **Submit sitemap**: https://funnygames.com/sitemap.xml
3. **Monitor performance** and fix issues
4. **Check mobile usability**

### Google Analytics

Add to your HTML `<head>`:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Schema Markup Validation

Test your structured data:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Generate game pages
      run: python3 generate-games.py
    
    - name: Generate sitemap
      run: python3 generate-sitemap.py
    
    - name: Deploy to server
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        SOURCE: "."
        TARGET: "/var/www/funnygames"
```

## 📱 Mobile Optimization

### PWA Configuration

Create `manifest.json`:

```json
{
  "name": "FunnyGames",
  "short_name": "FunnyGames",
  "description": "Play free online games",
  "theme_color": "#007AFF",
  "background_color": "#F2F2F7",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    {
      "src": "images/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Add to HTML `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#007AFF">
```

## 🔧 Troubleshooting

### Common Issues

1. **404 errors on game pages**
   - Check file permissions
   - Verify nginx/Apache configuration
   - Ensure files are generated correctly

2. **CSS/JS not loading**
   - Check file paths are correct
   - Verify CDN URLs
   - Clear browser cache

3. **Slow loading times**
   - Enable compression (gzip/brotli)
   - Optimize images
   - Use CDN
   - Enable browser caching

4. **SEO issues**
   - Validate HTML markup
   - Check meta tags
   - Submit updated sitemap
   - Fix broken links

### Performance Testing

```bash
# Test website speed
curl -o /dev/null -s -w "%{time_total}\n" https://funnygames.com

# Check HTTP headers
curl -I https://funnygames.com

# Test from multiple locations
# Use tools like GTmetrix, PageSpeed Insights, WebPageTest
```

## 📞 Support

If you encounter issues during deployment:

1. Check the troubleshooting section above
2. Review server logs for errors
3. Test locally first
4. Verify all configuration files
5. Check DNS propagation

---

**Happy deploying! 🚀** 