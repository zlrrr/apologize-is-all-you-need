# 🔧 GitHub Actions 缓存错误修复说明

## 问题描述

**错误信息**：
```
Run actions/setup-node@v4
Found in cache @ /opt/hostedtoolcache/node/20.19.5/x64
Environment details
/opt/hostedtoolcache/node/20.19.5/x64/bin/npm config get cache
/home/runner/.npm
Error: Some specified paths were not resolved, unable to cache dependencies.
```

**触发场景**：
- 合并代码到 main 分支后
- GitHub Actions 部署工作流运行时
- 在 `check` job 的 `Setup Node.js` 步骤失败

---

## 根本原因

**问题根源**：`actions/setup-node@v4` 的内置缓存功能

在工作流配置中使用了：
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: backend/package-lock.json  # ← 这里有问题
```

**为什么会失败**：
1. `setup-node@v4` 的 `cache` 参数在某些情况下无法正确解析路径
2. 特别是当 `cache-dependency-path` 指向子目录中的文件时
3. 不同的运行环境（main 分支 vs 功能分支）可能有不同的行为

---

## 修复方案

**采用显式缓存配置**：

替换内置缓存为独立的 `actions/cache@v3`：

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    # ❌ 移除内置缓存配置

- name: Cache npm dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('backend/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

**优势**：
1. ✅ 更好的控制和可预测性
2. ✅ 使用 `hashFiles()` 生成稳定的缓存键
3. ✅ 支持 fallback 缓存（restore-keys）
4. ✅ 明确指定缓存路径（`~/.npm`）
5. ✅ 与所有分支兼容

---

## 已完成的修复

✅ **修改文件**：`.github/workflows/deploy-render.yml`

✅ **修改内容**：
- 从 `Setup Node.js` 步骤中移除 `cache` 和 `cache-dependency-path`
- 添加独立的 `Cache npm dependencies` 步骤
- 使用 `actions/cache@v3` 显式管理缓存

✅ **提交信息**：
```
Fix GitHub Actions npm cache error

- Replace setup-node cache with explicit actions/cache
- Use hashFiles for cache key generation
- This fixes 'Some specified paths were not resolved' error
```

✅ **已推送到分支**：`claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL`

---

## 如何应用修复

### 方式 1：合并功能分支到 main（推荐）

```bash
# 切换到 main 分支
git checkout main

# 拉取最新代码
git pull origin main

# 合并功能分支
git merge claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL

# 推送到远程
git push origin main
```

### 方式 2：创建 Pull Request

1. 访问 GitHub 仓库
2. 点击 "Pull requests" 标签
3. 点击 "New pull request"
4. Base: `main` ← Compare: `claude/add-plan-features-01KZ8uzJP67EWunQhRsC7EFL`
5. 创建 PR 并合并

### 方式 3：Cherry-pick 单个提交

如果只想应用缓存修复，不合并其他更改：

```bash
git checkout main
git cherry-pick b067cd1  # 缓存修复的 commit
git push origin main
```

---

## 验证修复成功

合并到 main 后，GitHub Actions 应该：

1. ✅ `Setup Node.js` 步骤正常完成
2. ✅ `Cache npm dependencies` 步骤显示：
   ```
   Cache not found for input keys: Linux-node-[hash]
   # 或
   Cache restored from key: Linux-node-[hash]
   ```
3. ✅ `Install backend dependencies` 正常运行
4. ✅ 整个 `check` job 成功完成

---

## 技术细节

### 缓存机制对比

**setup-node 内置缓存**：
```yaml
cache: 'npm'
cache-dependency-path: backend/package-lock.json
```
- 优点：配置简单
- 缺点：路径解析不稳定，某些场景下失败

**actions/cache 显式缓存**：
```yaml
uses: actions/cache@v3
with:
  path: ~/.npm
  key: ${{ runner.os }}-node-${{ hashFiles('backend/package-lock.json') }}
  restore-keys: |
    ${{ runner.os }}-node-
```
- 优点：完全控制，稳定可靠
- 缺点：配置稍复杂

### 缓存键说明

**主键**：`Linux-node-[package-lock.json hash]`
- 完全匹配时使用
- 当 package-lock.json 改变时，hash 改变，触发重新安装

**Fallback 键**：`Linux-node-`
- 主键未找到时使用
- 恢复最近的 npm 缓存，加速安装

---

## 相关资源

- [actions/setup-node 文档](https://github.com/actions/setup-node)
- [actions/cache 文档](https://github.com/actions/cache)
- [GitHub Actions 缓存最佳实践](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)

---

## 总结

**问题**：GitHub Actions 缓存错误导致部署失败
**原因**：`setup-node@v4` 内置缓存路径解析问题
**解决**：使用 `actions/cache@v3` 显式管理缓存
**状态**：✅ 已修复并推送到功能分支
**下一步**：合并到 main 分支并验证

---

**修复已完成，准备好合并到 main 分支！** 🚀
