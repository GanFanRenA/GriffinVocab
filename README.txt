========================================
词卡教学网站 - 项目汇总
========================================

技术栈
----------------------------------------
前端：纯 HTML + 原生 JavaScript（ES module）
后端：Supabase（认证 + PostgreSQL + RLS）
部署：Netlify
CDN：https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm


========================================
一、文件结构
========================================

flashcard-site/
├── index.html          首页（词卡集列表、创建、搜索）
├── login.html          登录 / 注册
├── deck.html           词卡集详情（创建者管理页）
├── study.html          学习模式（翻卡）
├── profile.html        个人主页
├── settings.html       账号设置（改名）
├── my-learning.html    我的学习（学过 + 收藏）
├── script.js           公共逻辑（supabase 客户端、登录拦截、登出）
└── style.css           样式


========================================
二、数据库表结构
========================================

【1】profiles（用户资料）
----------------------------------------
字段          类型          说明
id            uuid          主键，关联 auth.users.id
username      text          唯一，显示名
created_at    timestamptz   创建时间

关联：
  profiles.id → auth.users.id（外键，on delete cascade）

RLS 策略：
  - 所有登录用户可读
  - 只能插入自己的 profile
  - 只能改自己的 profile


【2】subjects（学科）
----------------------------------------
字段          类型          说明
id            uuid          主键
name          text          唯一，学科名
description   text          描述
created_at    timestamptz   创建时间

RLS 策略：
  - 所有登录用户可读（select）
  - 无 insert / update / delete 策略
  - 增删改只在 Supabase Dashboard 后台操作

授权：
  grant select on public.subjects to authenticated;


【3】decks（词卡集）
----------------------------------------
字段          类型          说明
id            uuid          主键
user_id       uuid          创建者
title         text          标题
subject_id    uuid          所属学科（not null）
unit          text          单元（not null）
shuffle       boolean       学习时是否打乱
created_at    timestamptz   创建时间

关联：
  decks.user_id    → auth.users.id（外键，on delete cascade）
  decks.user_id    → profiles.id（外键，用于嵌套查询）
  decks.subject_id → subjects.id（外键，on delete restrict）

RLS 策略：
  - 所有登录用户可查看
  - 登录用户可创建（user_id 必须是自己）
  - 只有创建者可修改
  - 只有创建者可删除


【4】cards（单词卡）
----------------------------------------
字段          类型          说明
id            uuid          主键
deck_id       uuid          所属词卡集
front         text          正面
back          text          背面

关联：
  cards.deck_id → decks.id（外键，on delete cascade）

RLS 策略：
  - 所有登录用户可查看
  - 登录用户只能往自己的词卡集里加卡片
  - 只有词卡集创建者可修改
  - 只有词卡集创建者可删除


【5】learning_records（学习记录）
----------------------------------------
字段          类型          说明
id            uuid          主键
user_id       uuid          用户
deck_id       uuid          词卡集
status        text          状态：learning / favorite
updated_at    timestamptz   最近更新时间
unique (user_id, deck_id)

关联：
  learning_records.user_id → auth.users.id（外键，on delete cascade）
  learning_records.deck_id → decks.id（外键，on delete cascade）

RLS 策略：
  - 只能看自己的记录
  - 只能插自己的记录
  - 只能改自己的记录
  - 只能删自己的记录


========================================
三、表关联总览
========================================

auth.users（Supabase 内置）
    │
    ├── profiles.id（一对一）
    │
    ├── decks.user_id（一对多）
    │
    └── learning_records.user_id（一对多）

subjects（学科）
    │
    └── decks.subject_id（一对多，on delete restrict）

decks（词卡集）
    │
    ├── cards.deck_id（一对多，on delete cascade）
    │
    └── learning_records.deck_id（一对多，on delete cascade）

完整链条：
  subjects → decks → cards
  auth.users → profiles
  auth.users → decks
  auth.users → learning_records
  decks → learning_records


========================================
四、已完成功能
========================================

【认证与账号】
[✓] 邮箱注册
[✓] 邮箱登录
[✓] 登出
[✓] 登录拦截（未登录访问任何页面跳登录页）
[✓] 登录后跳回原页面（redirect 参数）
[✓] 修改显示名（唯一，不允许同名）
[✓] 自动创建 profile（注册触发器）


【词卡集】
[✓] 创建词卡集（必选学科、必填单元）
[✓] 编辑词卡集标题
[✓] 编辑词卡集单元
[✓] 切换随机打乱设置
[✓] 删除词卡集（级联删除单词卡）
[✓] 学科不可改（创建后固定）


【单词卡】
[✓] 添加单词卡（正面 / 背面）
[✓] 编辑单词卡
[✓] 删除单词卡
[✓] 列表按正面字母排序


【学习模式】
[✓] 翻卡学习（点击卡片翻面）
[✓] 标记「会 / 不会」
[✓] 完成统计（共 N 张，掌握 X 张，未掌握 Y 张）
[✓] 全部重学
[✓] 巩固知识（只重学不会的）
[✓] 返回首页
[✓] 随机打乱（由词卡集设置控制）


【学科与单元】
[✓] 学科由管理员在后台创建
[✓] 创建词卡集时必选学科、必填单元
[✓] 单元自由填写
[✓] 显示同科已有单元作为建议
[✓] 默认填入该学科第一个已有单元
[✓] 首页按「学科 → 单元 → 词卡集」三层分组
[✓] 单元字母排序
[✓] 学科删除受 restrict 保护


【个人主页】
[✓] 查看任意用户的主页
[✓] 显示用户名、注册日期
[✓] 显示词卡集总数、总卡片数
[✓] 按 user_id 精确定位（不因同名混淆）


【我的学习】
[✓] 显示学过的词卡集
[✓] 显示收藏的词卡集
[✓] tab 切换（全部 / 学过 / 收藏）
[✓] 按最近学习时间排序


【收藏】
[✓] 学习页收藏按钮
[✓] 收藏状态切换
[✓] 收藏不因学习行为被覆盖


【搜索】
[✓] 首页搜索框
[✓] 按标题搜索
[✓] 按作者名搜索
[✓] 前端实时过滤
[✓] 搜索结果保持分组结构


【权限与安全】
[✓] RLS 三层安全模型
[✓] anon 角色无任何表权限
[✓] authenticated 只有增删改查
[✓] 未登录用户绕过前端也无法读取数据
[✓] 用户只能改自己的内容
[✓] 管理员角色已移除，学科通过后台管理


【性能】
[✓] 学习页并行请求（Promise.all）
[✓] 记录学习不阻塞卡片显示
[✓] 外键索引（cards.deck_id, decks.user_id）


【部署】
[✓] Netlify 部署
[✓] 公网访问
[✓] Supabase Site URL 配置
[✓] HTTPS 自动


========================================
五、权限模型总览
========================================

未登录用户：
  - 被前端 requireLogin() 拦截
  - 数据库层面 anon 无任何权限
  - 访问任何页面 → 跳登录页

登录用户：
  - 读取所有学科
  - 读取所有词卡集和单词卡
  - 创建自己的词卡集
  - 学习、收藏任何词卡集
  - 修改 / 删除自己的内容
  - 查看自己的学习记录

学科管理：
  - 只有 Supabase Dashboard 后台能增删改
  - 前端无任何入口


========================================
六、关键配置
========================================

Supabase 项目：
  Project URL: https://hjlnubicstqnlappbrjc.supabase.co
  Publishable key: sb_publishable_oyxAGzlhR4oXmhH8rrs0rw_uHMbzsVx

Netlify 网址：
  https://griffinvocab.netlify.app

Supabase 认证设置：
  Site URL: https://griffinvocab.netlify.app
  Redirect URLs: https://griffinvocab.netlify.app/**


========================================
七、待办 / 可选优化
========================================

[ ] 学习进度记录（total_count, known_count）
[ ] 首页显示自己的学习进度
[ ] 词卡集内卡片搜索
[ ] 导出 / 导入词卡集
[ ] UI 美化
[ ] 单元自然排序（Chapter 1 vs Chapter 10）
[ ] 词卡集分页（数据量大时）
[ ] 邮箱验证流程优化


========================================
文档结束
========================================