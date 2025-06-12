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

3. **配置 `firebase.json`**:
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

4. **部署**:
```bash
firebase deploy
```

**优点**: Google基础设施，出色的性能
**缺点**: 设置较复杂

## 🖥️ VPS/服务器部署

### nginx配置

创建 `/etc/nginx/sites-available/funnygames`:

```nginx
server {
    listen 80;
    server_name funnygames.com www.funnygames.com;
    root /var/www/funnygames;
    index index.html;

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # SPA路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Robots和sitemap
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

启用网站:
```bash
sudo ln -s /etc/nginx/sites-available/funnygames /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Apache配置

在根目录创建 `.htaccess`:

```apache
# 启用压缩
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

# 缓存静态文件
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

# 安全头
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
</IfModule>

# 回退路由
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

## 🔒 SSL证书设置

### 使用Let's Encrypt (Certbot)

```bash
# 安装certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d funnygames.com -d www.funnygames.com

# 自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 使用Cloudflare

1. **将您的域名添加** 到Cloudflare
2. **在域名注册商处更新域名服务器**
3. **启用SSL/TLS**: 完全(严格)模式
4. **配置DNS**: 添加指向您服务器的A记录
5. **启用安全功能**: 在安全选项卡下

## 📊 性能优化

### CDN设置

#### Cloudflare
1. 注册并添加您的域名
2. 配置DNS记录
3. 启用优化:
   - 自动压缩 (CSS, JS, HTML)
   - Brotli压缩
   - Rocket Loader
   - Polish (图片优化)

#### AWS CloudFront
1. 创建分发
2. 设置源为您的网站
3. 配置缓存规则
4. 更新DNS指向CloudFront

### 图片优化

```bash
# 安装工具
sudo apt install imagemagick webp

# 转换图片为WebP
for file in images/*.jpg; do
    cwebp -q 80 "$file" -o "${file%.*}.webp"
done
```

## 🔍 SEO配置

### Google Search Console

1. **验证域名所有权**
2. **提交站点地图**: https://funnygames.com/sitemap.xml
3. **监控性能** 并修复问题
4. **检查移动端可用性**

### Google Analytics

添加到HTML `<head>`:

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

### Schema标记验证

测试您的结构化数据:
- [Google富结果测试](https://search.google.com/test/rich-results)
- [Schema.org验证器](https://validator.schema.org/)

## 🔄 CI/CD流水线

### GitHub Actions

创建 `.github/workflows/deploy.yml`:

```yaml
name: 部署到生产环境

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: 设置Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: 生成游戏页面
      run: python3 generate-games.py
    
    - name: 生成站点地图
      run: python3 generate-sitemap.py
    
    - name: 部署到服务器
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        SOURCE: "."
        TARGET: "/var/www/funnygames"
```

## 📱 移动端优化

### PWA配置

创建 `manifest.json`:

```json
{
  "name": "FunnyGames",
  "short_name": "FunnyGames",
  "description": "免费在线游戏",
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

添加到HTML `<head>`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#007AFF">
```

## 🔧 故障排除

### 常见问题

1. **游戏页面404错误**
   - 检查文件权限
   - 验证nginx/Apache配置
   - 确保文件正确生成

2. **CSS/JS无法加载**
   - 检查文件路径是否正确
   - 验证CDN URL
   - 清除浏览器缓存

3. **加载速度慢**
   - 启用压缩 (gzip/brotli)
   - 优化图片
   - 使用CDN
   - 启用浏览器缓存

4. **SEO问题**
   - 验证HTML标记
   - 检查meta标签
   - 提交更新的站点地图
   - 修复无效链接

### 性能测试

```bash
# 测试网站速度
curl -o /dev/null -s -w "%{time_total}\n" https://funnygames.com

# 检查HTTP头
curl -I https://funnygames.com

# 从多个位置测试
# 使用GTmetrix、PageSpeed Insights、WebPageTest等工具
```

## 📞 支持

如果您在部署过程中遇到问题：

1. 查看上面的故障排除部分
2. 检查服务器日志中的错误
3. 先在本地测试
4. 验证所有配置文件
5. 检查DNS传播

---

**祝您部署顺利！ 🚀** 