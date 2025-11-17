# Session Management Test Plan

## 测试目标
验证Session管理的用户隔离功能，确保多用户环境下session数据不会混淆，登出时缓存被正确清除。

## 修复内容总结

### 1. 问题A：Admin Dashboard无法查看对话内容
**修复文件**: `frontend/src/components/AdminDashboard.tsx`

**实现内容**:
- 添加`SessionDetailsModal`组件显示完整对话内容
- 在`SessionsTab`中添加点击事件处理
- 使用`getSessionDetails` API获取完整消息列表
- 支持查看用户消息、助手回复和系统消息

**相关API**: `/api/admin/sessions/:sessionId`

---

### 2. 问题B：Session列表缓存导致用户隔离失败

#### 根本原因
localStorage缓存键没有区分用户，导致：
1. 缓存键固定为`apology_sessions_cache`（所有用户共用）
2. 登出时没有清除session缓存
3. 用户切换时可能短暂显示其他用户的缓存数据

#### 修复内容

**A. storage.ts - 用户隔离的缓存键**
修复文件: `frontend/src/utils/storage.ts`

修改内容:
- 缓存键改为用户特定: `apology_sessions_cache_user_${userId}`
- Active session键: `apology_active_session_user_${userId}`
- 所有storage函数增加`userId`参数
- 添加`clearUserSessionData(userId)`函数清除特定用户缓存
- 添加`clearAllSessionData()`函数清除所有用户缓存

**B. AuthContext.tsx - 登出时清除缓存**
修复文件: `frontend/src/contexts/AuthContext.tsx`

修改内容:
- 导入`clearAllSessionData`函数
- 在`logout()`中调用清除所有session缓存
- 确保用户切换时完全清除状态

**C. ChatInterface.tsx - 传递userId参数**
修复文件: `frontend/src/components/ChatInterface.tsx`

修改内容:
- 导入`useAuth`钩子获取`user.id`
- 所有storage函数调用传递`userId`参数
- 添加用户认证检查

---

## 测试场景

### 场景1: 多用户隔离测试

**步骤**:
1. 使用用户A登录 (user_id = 1)
2. 创建会话S1，发送消息M1
3. 验证localStorage中的缓存键为`apology_sessions_cache_user_1`
4. 验证可以看到S1会话
5. 登出用户A
6. 验证localStorage中用户A的缓存已被清除
7. 使用用户B登录 (user_id = 2)
8. 创建会话S2，发送消息M2
9. 验证localStorage中的缓存键为`apology_sessions_cache_user_2`
10. 验证**只能**看到S2会话，**不能**看到S1会话
11. 登出用户B
12. 重新使用用户A登录
13. 验证只能看到S1会话，不能看到S2会话

**预期结果**:
- ✅ 每个用户的缓存键完全独立
- ✅ 登出时所有session缓存被清除
- ✅ 用户A无法看到用户B的会话
- ✅ 用户B无法看到用户A的会话
- ✅ 后端数据隔离正确（通过user_id过滤）

---

### 场景2: Admin查看对话详情测试

**步骤**:
1. 使用普通用户登录，创建会话并发送几条消息
2. 登出
3. 使用Admin用户登录
4. 打开Admin Dashboard
5. 切换到Sessions标签
6. 点击任意会话卡片
7. 验证显示SessionDetailsModal
8. 验证可以看到完整的对话内容（用户消息 + 助手回复）
9. 验证消息角色正确显示（User/Assistant/System）
10. 关闭模态框

**预期结果**:
- ✅ Admin可以看到所有用户的会话列表
- ✅ 点击会话显示详情模态框
- ✅ 模态框显示完整对话内容
- ✅ 消息角色正确显示和样式区分
- ✅ 关闭模态框返回列表

---

### 场景3: 缓存刷新测试

**步骤**:
1. 用户A登录
2. 创建会话S1
3. 验证会话列表中显示S1
4. 在浏览器Developer Tools中查看localStorage
5. 验证缓存键为`apology_sessions_cache_user_${userId}`
6. 删除S1会话
7. 验证会话列表更新（S1消失）
8. 验证localStorage缓存被invalidate
9. 登出
10. 验证localStorage中所有session相关键被清除

**预期结果**:
- ✅ 缓存键包含userId
- ✅ 会话操作后缓存正确更新
- ✅ 登出时缓存完全清除

---

## 手动测试步骤

### 准备工作

1. **启动后端服务**:
```bash
cd /home/user/apologize-is-all-you-need/backend
npm install
npm run dev
```

2. **启动前端服务**:
```bash
cd /home/user/apologize-is-all-you-need/frontend
npm install
npm run dev
```

3. **创建测试用户**:
- 用户A: `testuser1` / `password123`
- 用户B: `testuser2` / `password123`
- Admin: 使用环境变量配置的admin账号

### 测试执行

#### Test 1: 用户隔离验证

```bash
# 手动测试步骤
1. 打开浏览器: http://localhost:5173
2. 打开Developer Tools -> Application -> Local Storage
3. 注册/登录用户A (testuser1)
4. 创建新会话，发送消息: "这是用户A的测试消息"
5. 观察localStorage，应该看到:
   - apology_sessions_cache_user_1 (或对应的userId)
   - apology_active_session_user_1
6. 记录session ID
7. 点击登出
8. 观察localStorage，确认session相关键已被清除
9. 注册/登录用户B (testuser2)
10. 观察会话列表，应该是空的（不显示用户A的会话）
11. 创建新会话，发送消息: "这是用户B的测试消息"
12. 观察localStorage，应该看到:
    - apology_sessions_cache_user_2 (不同的userId)
13. 确认只能看到用户B的会话
14. 登出
15. 重新登录用户A
16. 确认只能看到用户A的会话，不能看到用户B的
```

**验证点**:
- [ ] 用户A的缓存键包含user_id
- [ ] 用户B的缓存键包含不同的user_id
- [ ] 登出时所有session缓存被清除
- [ ] 用户A看不到用户B的会话
- [ ] 用户B看不到用户A的会话

#### Test 2: Admin查看对话详情

```bash
# 手动测试步骤
1. 使用用户A登录，创建一个会话，发送3-5条消息
2. 登出
3. 使用Admin账号登录
4. 点击右上角的头像 -> "管理员控制台"
5. 切换到"会话管理"标签
6. 找到刚才创建的会话卡片
7. 点击会话卡片
8. 验证显示模态框，标题为"会话详情"
9. 验证显示完整对话内容
10. 验证消息样式区分（用户消息蓝色，助手消息紫色）
11. 点击"关闭"按钮
12. 验证返回会话列表
```

**验证点**:
- [ ] Admin可以打开会话详情
- [ ] 显示完整消息列表
- [ ] 消息角色正确标识（User/Assistant/System）
- [ ] 消息样式正确区分
- [ ] 显示会话元数据（ID、创建时间、用户ID）
- [ ] 关闭模态框功能正常

#### Test 3: 缓存一致性

```bash
# 手动测试步骤
1. 登录用户A
2. 打开Developer Tools -> Application -> Local Storage
3. 创建3个会话
4. 观察缓存中的会话列表
5. 删除第2个会话
6. 验证localStorage缓存被invalidate（可以看到键被删除）
7. 验证会话列表自动更新（第2个会话消失）
8. 发送新消息到第1个会话
9. 验证缓存更新
10. 刷新页面
11. 验证会话列表正确显示（从后端加载）
12. 登出
13. 验证所有session相关localStorage键被清除
```

**验证点**:
- [ ] 创建会话后缓存更新
- [ ] 删除会话后缓存invalidate
- [ ] 发送消息后缓存invalidate
- [ ] 页面刷新后数据一致
- [ ] 登出后缓存完全清除

---

## 自动化测试（可选）

如果需要自动化测试，可以使用以下工具:

### 单元测试 (Vitest)

创建测试文件: `frontend/src/utils/storage.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSessions,
  getActiveSessionId,
  setActiveSessionId,
  clearUserSessionData,
  clearAllSessionData,
} from './storage';

describe('Storage - User Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should use user-specific cache keys', () => {
    const userId1 = 1;
    const userId2 = 2;
    const sessionId1 = 'session-user1';
    const sessionId2 = 'session-user2';

    setActiveSessionId(sessionId1, userId1);
    setActiveSessionId(sessionId2, userId2);

    expect(getActiveSessionId(userId1)).toBe(sessionId1);
    expect(getActiveSessionId(userId2)).toBe(sessionId2);
  });

  it('should clear user-specific data on logout', () => {
    const userId = 1;
    const sessionId = 'session-1';

    setActiveSessionId(sessionId, userId);
    expect(getActiveSessionId(userId)).toBe(sessionId);

    clearUserSessionData(userId);
    expect(getActiveSessionId(userId)).toBeNull();
  });

  it('should clear all session data', () => {
    setActiveSessionId('session-1', 1);
    setActiveSessionId('session-2', 2);

    clearAllSessionData();

    expect(getActiveSessionId(1)).toBeNull();
    expect(getActiveSessionId(2)).toBeNull();
  });
});
```

### 集成测试 (Playwright/Cypress)

可选：创建E2E测试来模拟完整的用户流程。

---

## 测试结果记录

### 测试环境
- 日期: ___________
- 测试人员: ___________
- 前端版本: ___________
- 后端版本: ___________

### 测试结果

| 测试场景 | 状态 | 备注 |
|---------|------|------|
| 场景1: 多用户隔离 | ⬜ PASS / ⬜ FAIL | |
| 场景2: Admin查看对话 | ⬜ PASS / ⬜ FAIL | |
| 场景3: 缓存刷新 | ⬜ PASS / ⬜ FAIL | |

### 发现的问题
[记录测试中发现的任何问题]

---

## 回归测试检查清单

在部署到生产环境前，确认以下功能正常:

- [ ] 用户注册和登录
- [ ] 创建新会话
- [ ] 发送和接收消息
- [ ] 会话列表显示
- [ ] 删除会话
- [ ] 用户登出
- [ ] Admin Dashboard访问
- [ ] Admin查看所有会话
- [ ] Admin查看会话详情
- [ ] 多用户同时使用（不同浏览器/无痕模式）
- [ ] 页面刷新后状态保持
- [ ] 跨设备session同步（基于后端）

---

## 性能测试建议

1. **缓存性能**:
   - 测试1000+会话时的缓存性能
   - 验证5分钟缓存过期机制
   - 测试后端API响应时间

2. **并发测试**:
   - 10个并发用户同时操作
   - 验证数据库查询性能（user_id索引）

3. **内存占用**:
   - 监控localStorage大小
   - 验证缓存数据不会无限增长

---

## 安全测试

1. **数据隔离**:
   - 尝试通过API直接访问其他用户的session
   - 验证后端的userId验证
   - 确认Admin权限检查正确

2. **缓存安全**:
   - localStorage数据敏感度检查
   - 考虑是否需要加密敏感信息

---

## 已知限制

1. **缓存失效时间**: 5分钟缓存可能导致短暂的数据不一致
2. **localStorage限制**: 单个域名约5-10MB限制
3. **多标签页**: 同一用户在多个标签页时localStorage可能冲突（可接受）

---

## 文档更新

- [x] 更新README.md说明session管理机制
- [ ] 更新API文档
- [ ] 更新部署文档
