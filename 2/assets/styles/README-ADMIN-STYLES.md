# 管理后台通用样式使用指南

## 概述

本样式系统提供了统一的管理后台页面样式，包括布局、组件、颜色等，可以在所有后台页面中复用。

## 文件结构

```
assets/styles/
├── admin-variables.scss    # 设计系统变量（颜色、间距、圆角等）
├── admin-layout.scss      # 布局样式（容器、表格、表单等）
├── admin-components.scss   # 组件样式（按钮、标签、对话框等）
└── admin-common.scss       # 主入口文件（导入所有模块）
```

## 快速开始

### 1. 在 Vue 组件中使用

```vue
<template>
  <div class="admin-page-container">
    <!-- 搜索表单 -->
    <el-form class="admin-search-form" :model="queryParams" :inline="true">
      <!-- 表单内容 -->
    </el-form>

    <!-- 工具栏 -->
    <el-row class="admin-toolbar">
      <el-button type="primary">新增</el-button>
    </el-row>

    <!-- 表格容器 -->
    <div class="admin-table-wrapper">
      <el-table class="admin-table" :data="tableData" :max-height="tableMaxHeight">
        <!-- 表格列 -->
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="admin-pagination-wrapper">
      <pagination :total="total" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 如果需要使用变量，可以导入
@import '@/assets/styles/admin-variables.scss';

// 或者直接使用类名，样式已全局可用
</style>
```

## 类名说明

### 布局类名

| 类名 | 说明 | 使用场景 |
|------|------|----------|
| `.admin-page-container` | 页面容器 | 所有后台页面的根容器 |
| `.admin-search-form` | 搜索表单 | 搜索表单区域 |
| `.admin-toolbar` | 工具栏 | 操作按钮区域 |
| `.admin-table-wrapper` | 表格容器 | 表格外层容器 |
| `.admin-table` | 表格样式 | el-table 组件 |
| `.admin-pagination-wrapper` | 分页容器 | 分页组件外层 |

### 组件类名

| 类名 | 说明 | 使用场景 |
|------|------|----------|
| `.admin-tag` | 标签样式 | el-tag 组件（已全局应用） |
| `.admin-action-btn` | 操作按钮 | 表格中的操作按钮 |
| `.admin-dialog` | 对话框样式 | el-dialog 组件（已全局应用） |
| `.admin-tabs` | 标签页样式 | el-tabs 组件（已全局应用） |
| `.admin-card` | 卡片样式 | el-card 组件（已全局应用） |
| `.admin-empty-state` | 空状态 | 无数据时的显示 |

### 向后兼容

为了兼容现有代码，以下旧类名仍然可用（通过 `@extend` 实现）：

- `.app-container` → `.admin-page-container`
- `.search-form` → `.admin-search-form`
- `.toolbar-row`, `.mb8` → `.admin-toolbar`
- `.table-wrapper` → `.admin-table-wrapper`
- `.data-table` → `.admin-table`
- `.pagination-wrapper` → `.admin-pagination-wrapper`

## 变量使用

### 在 SCSS 中使用变量

```scss
<style lang="scss" scoped>
@import '@/assets/styles/admin-variables.scss';

.custom-component {
  color: $admin-primary;
  padding: $admin-spacing-lg;
  border-radius: $admin-radius-md;
  box-shadow: $admin-shadow-sm;
}
</style>
```

### 可用变量

#### 颜色变量
- `$admin-primary` - 主色
- `$admin-success` - 成功色
- `$admin-warning` - 警告色
- `$admin-danger` - 危险色
- `$admin-info` - 信息色
- `$admin-text-primary` - 主要文本色
- `$admin-text-secondary` - 次要文本色
- `$admin-text-tertiary` - 三级文本色
- `$admin-bg-base` - 基础背景色
- `$admin-bg-elevated` - 提升背景色
- `$admin-border-color` - 边框色

#### 阴影变量
- `$admin-shadow-sm` - 小阴影
- `$admin-shadow-md` - 中等阴影
- `$admin-shadow-lg` - 大阴影

#### 圆角变量
- `$admin-radius-sm` - 小圆角 (6px)
- `$admin-radius-md` - 中等圆角 (8px)
- `$admin-radius-lg` - 大圆角 (12px)

#### 间距变量
- `$admin-spacing-xs` - 4px
- `$admin-spacing-sm` - 8px
- `$admin-spacing-md` - 12px
- `$admin-spacing-lg` - 16px
- `$admin-spacing-xl` - 20px
- `$admin-spacing-xxl` - 24px

## 完整示例

### 列表页面示例

```vue
<template>
  <div class="admin-page-container">
    <!-- 搜索表单 -->
    <el-form 
      class="admin-search-form" 
      :model="queryParams" 
      :inline="true"
      v-show="showSearch"
    >
      <el-form-item label="名称">
        <el-input v-model="queryParams.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 工具栏 -->
    <el-row class="admin-toolbar">
      <el-button type="primary" icon="el-icon-plus" @click="handleAdd">
        新增
      </el-button>
      <el-button type="warning" icon="el-icon-download" @click="handleExport">
        导出
      </el-button>
    </el-row>

    <!-- 表格 -->
    <div class="admin-table-wrapper">
      <el-table 
        class="admin-table"
        v-loading="loading"
        :data="list"
        :max-height="tableMaxHeight"
        stripe
        border
      >
        <el-table-column prop="name" label="名称" />
        <el-table-column label="操作" width="200">
          <template slot-scope="scope">
            <el-button 
              class="admin-action-btn"
              type="text"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button 
              class="admin-action-btn"
              type="text"
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="admin-pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tableMaxHeight: 600,
      // ... 其他数据
    }
  },
  mounted() {
    this.updateTableHeight()
    window.addEventListener('resize', this.updateTableHeight)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight)
  },
  methods: {
    updateTableHeight() {
      // 动态计算表格高度
      const viewportHeight = window.innerHeight || 800
      const reserved = 200 // 搜索表单、工具栏、分页等高度
      this.tableMaxHeight = Math.max(300, viewportHeight - reserved - 84)
    }
  }
}
</script>
```

### 对话框示例

```vue
<template>
  <el-dialog
    title="编辑"
    :visible.sync="dialogVisible"
    width="800px"
    custom-class="admin-dialog"
  >
    <el-form :model="form" label-width="100px">
      <!-- 表单内容 -->
    </el-form>
  </el-dialog>
</template>
```

### 空状态示例

```vue
<template>
  <div v-if="list.length === 0 && !loading" class="admin-empty-state">
    <i class="el-icon-box"></i>
    <p>暂无数据</p>
  </div>
</template>
```

## 最佳实践

1. **使用语义化类名**：优先使用 `admin-*` 前缀的类名
2. **保持一致性**：所有后台页面使用相同的样式系统
3. **响应式设计**：样式已包含响应式支持，移动端自动适配
4. **表格高度**：建议使用动态计算的 `max-height`，确保表格可以滚动
5. **空状态**：使用 `.admin-empty-state` 统一空状态显示

## 迁移指南

### 从旧样式迁移

如果你的页面已经使用了旧类名（如 `.app-container`），可以：

1. **直接替换**：将旧类名替换为新类名
2. **保持兼容**：旧类名仍然可用，但建议逐步迁移到新类名
3. **移除重复样式**：删除组件中重复的样式定义，使用通用样式

### 迁移步骤

1. 在组件中引入通用样式（如果使用变量）
2. 将旧类名替换为新类名
3. 删除组件中重复的样式定义
4. 测试页面显示和交互

## 注意事项

1. 样式已全局导入，无需在每个组件中单独导入
2. 使用 `scoped` 时，深度选择器需要使用 `::v-deep` 或 `/deep/`
3. 表格的 `max-height` 建议动态计算，以适应不同屏幕尺寸
4. 对话框使用 `custom-class="admin-dialog"` 应用样式

## 更新日志

- 2025-01-XX: 初始版本，提取自 vappuser 页面样式

