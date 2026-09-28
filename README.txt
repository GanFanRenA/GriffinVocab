========================================
GriffinVocab 项目总结
生成日期：2026-09-28
========================================

技术栈
----------------------------------------
前端：纯 HTML + 原生 JavaScript（ES module）
后端：Supabase（认证 + PostgreSQL + RLS）
部署：Netlify
CDN：https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm
UI 语言：英文


========================================
一、文件结构
========================================

GriffinVocab/
├── index.html          首页（创建词卡集、搜索、按学科折叠展示）
├── login.html          登录 / 注册
├── deck.html           词卡集详情（创建者管理页，支持拖拽排序）
├── study.html          学习模式（翻卡、练习模式、评论）
├── profile.html        个人主页
├── settings.html       账号设置（修改显示名）
├── my-learning.html    我的学习（全部 / 学过 / 收藏）
├── script.js           公共逻辑（Supabase 客户端、登录拦截、登出）
└── style.css           全站样式


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

RLS：
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

授权：
  grant select on public.subjects to authenticated;

RLS：
  - 所有登录用户可读（select）
  - 无 insert / update / delete 策略
  - 增删改只在 Supabase Dashboard 后台操作


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
  decks.user_id    → profiles.id（外键，on delete cascade）
  decks.subject_id → subjects.id（外键，on delete restrict）

RLS：
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
position      integer       排序位置，默认 0（not null）

说明：
  - 没有 created_at 字段
  - 新增卡片时 position = 当前最大 position + 1，默认加到最后
  - 列表按 position 升序展示

关联：
  cards.deck_id → decks.id（外键，on delete cascade）

RLS：
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

RLS：
  - 只能看自己的记录
  - 只能插自己的记录
  - 只能改自己的记录
  - 只能删自己的记录


【6】comments（评论）
----------------------------------------
字段          类型          说明
id            uuid          主键
deck_id       uuid          所属词卡集（not null）
user_id       uuid          评论者（not null）
content       text          内容，长度 1~1000
created_at    timestamptz   创建时间，默认 now()

关联：
  comments.deck_id → decks.id（外键，on delete cascade）
  comments.user_id → profiles.id（外键，on delete cascade）

授权：
  grant select, insert, update, delete on public.comments to authenticated;

RLS：
  - 所有登录用户可读
  - 只能以自己的身份发评论（auth.uid() = user_id）
  - 只能改自己的评论
  - 只能删自己的评论


========================================
三、表关联总览
========================================

auth.users（Supabase 内置）
    │
    ├── profiles.id（一对一，on delete cascade）
    │
    ├── decks.user_id（一对多，on delete cascade）
    │
    └── learning_records.user_id（一对多，on delete cascade）

subjects（学科）
    │
    └── decks.subject_id（一对多，on delete restrict）

decks（词卡集）
    │
    ├── cards.deck_id（一对多，on delete cascade）
    │
    ├── learning_records.deck_id（一对多，on delete cascade）
    │
    └── comments.deck_id（一对多，on delete cascade）

profiles（用户资料）
    │
    └── comments.user_id（一对多，on delete cascade）

完整链条：
  subjects → decks → cards
  auth.users → profiles
  auth.users → decks
  auth.users → learning_records
  decks → learning_records
  decks → comments
  profiles → comments


========================================
四、权限模型总览
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
  - 发表评论、查看所有评论、删除自己的评论

学科管理：
  - 只有 Supabase Dashboard 后台能增删改
  - 前端无任何入口


========================================
五、已完成功能
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
[✓] 创建后自动跳转到对应的编辑页面
[✓] 编辑词卡集标题
[✓] 切换随机打乱设置
[✓] 删除词卡集（级联删除单词卡、学习记录、评论）
[✓] 学科不可改（创建后固定）
[✓] 首页按「学科」折叠分组，默认折叠，点击展开
[✓] 学科展开状态在搜索过滤时保持


【单词卡】
[✓] 添加单词卡（正面 / 背面）
[✓] 新增卡片默认追加到最后（position = max + 1）
[✓] 编辑单词卡
[✓] 删除单词卡
[✓] 列表按 position 升序排序
[✓] 拖动单词卡调整顺序（HTML5 拖拽，松手写回数据库）
[✓] 拖拽失败时提示并重新拉取服务端顺序


【学习模式】
[✓] 翻卡学习（点击卡片翻转，带 3D 翻转动画）
[✓] 标记「会 / 不会」
[✓] 完成统计（共 N 张，掌握 X 张，未掌握 Y 张）
[✓] 全部重学
[✓] 巩固知识（只重学不会的）
[✓] 返回首页
[✓] 随机打乱（由词卡集设置控制，每次开始学习时自动打乱）
[✓] 学习界面顶部显示「Practice mode」按钮（总词数 >= 4 时）


【练习模式】
[✓] 完成学习后，若总词数 >= 4，显示「Practice mode」入口
[✓] 学习界面顶部也有直接进入练习的按钮（总词数 >= 4 时）
[✓] 随机出现单词（front），下方随机出现 4 个释义选项
[✓] 选项 = 1 个正确 back + 3 个其它卡片的 back（去重后随机）
[✓] 题目数量 = 词卡总词数
[✓] 每题做完立即显示是否正确，并高亮正确答案
[✓] 可进入下一题
[✓] 全部做完显示正确率（百分比）
[✓] 可「Practice again」重新练习
[✓] 可返回来源界面（学习界面或完成界面）


【评论】
[✓] 学习完成界面下方显示评论区
[✓] 所有登录用户可发表评论
[✓] 评论按时间倒序展示
[✓] 显示评论作者（可点击进入个人主页）、相对时间、内容
[✓] 自己的评论可删除
[✓] 评论内容做 HTML 转义，防止 XSS


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
[✓] 搜索结果保持学科折叠结构


【UI / 体验】
[✓] 全站 UI 英文化
[✓] 统一配色、圆角、阴影、按钮样式
[✓] 响应式布局（适配窄屏）
[✓] 学习卡片 3D 翻转动画


【性能】
[✓] 学习页并行请求（Promise.all）
[✓] 记录学习不阻塞卡片显示
[✓] 外键索引（cards.deck_id, decks.user_id, comments.deck_id, comments.created_at）


【部署】
[✓] Netlify 部署
[✓] 公网访问
[✓] Supabase Site URL 配置
[✓] HTTPS 自动


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
[ ] 单元自然排序（Chapter 1 vs Chapter 10）
[ ] 词卡集分页（数据量大时）
[ ] 邮箱验证流程优化
[ ] 评论实时更新（Supabase Realtime）
[ ] 移动端拖拽排序（Pointer Events）
[ ] 单元折叠（已放弃制作）


========================================
文档结束
========================================