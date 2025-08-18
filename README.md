# Qwen Image Tool

基于 Qwen AI 的图片生成工具

## 功能特点

- 🎨 使用 Qwen AI 生成高质量图片
- 💳 积分系统（10次免费机会，之后每次10积分）
- 🌐 中英文双语支持
- 📱 响应式设计
- 🎯 多种图片风格选择

## 技术栈

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Supabase
- Stripe 支付

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装

```bash
npm install
```

### 配置环境变量

复制 `.env.local.example` 到 `.env.local` 并填写必要的配置：

```env
NEXT_PUBLIC_SUPABASE_URL=你的Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的Supabase公钥
API_302_KEY=你的302.ai API密钥
```

### 数据库初始化

在 Supabase SQL 编辑器中执行以下文件：

1. `supabase/init_database.sql` - 创建数据库结构
2. `supabase/fix_user_usage_table.sql` - 创建必要的函数

### 运行项目

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 价格设置

- 积分包：$9.9/300积分，$19.9/700积分
- 月订阅：$16.9/680积分
- 年订阅：$118.8/8000积分

## License
