# Jiaxin Zhang · Data Engineering Portfolio

张佳欣的大数据开发、数据仓库和数据工程双语作品集。网站为纯静态页面，通过 GitHub Actions 将 `public/` 部署到 GitHub Pages。

## 语言结构

- 英文为默认版本：`/` 与 `/projects/...`
- 中文版本：`/zh/` 与 `/zh/projects/...`
- 每个页面都提供对应语言切换，并配置独立 canonical、`hreflang` 和 sitemap 条目
- 不根据 IP 或浏览器语言自动跳转，访问者始终可以手动选择

## 公开范围

- 首页
- 电商离线与实时双版本湖仓数仓
- Mini-C4 风格网页预训练语料流水线
- Governed Novel Data Pipeline
- 页面实际引用的图片、证书原图与网站基础文件

SQL 归档页、历史备份、内部方案、协作规则和踩坑日志不在本仓库中。

## 部署

推送到 `main` 后，工作流会把 `public/` 作为唯一发布目录部署到 GitHub Pages。目标仓库名为 `JiaxinZhang-space.github.io`，正式地址为：

<https://jiaxinzhang-space.github.io/>

## 本地检查

```bash
node scripts/check-i18n.mjs
node scripts/serve.mjs
```

预览地址为 <http://127.0.0.1:4173/>。

页面内部资源和语言切换均使用相对路径，因此也可以直接双击 `public/index.html` 进行离线预览。
