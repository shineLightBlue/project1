<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模块名称" prop="title">
        <el-input
          v-model="queryParams.title"
          placeholder="请输入模块名称"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备ID" prop="deviceId">
        <el-input
          v-model="queryParams.deviceId"
          placeholder="请输入设备ID"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="设备型号" prop="deviceModel">
        <el-input
          v-model="queryParams.deviceModel"
          placeholder="请输入设备型号"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="操作状态"
          clearable
          style="width: 240px"
        >
          <el-option label="正常" value="0" />
          <el-option label="异常" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="操作时间">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd HH:mm:ss"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          :default-time="['00:00:00', '23:59:59']"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['monitor:appOperLog:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          @click="handleClean"
          v-hasPermi="['monitor:appOperLog:remove']"
        >清空</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['monitor:appOperLog:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table ref="tables" v-loading="loading" :data="list" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange" @cell-dblclick="handleCellDblClick" :max-height="tableMaxHeight">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="日志编号" align="center" prop="operId" />
      <el-table-column label="用户ID" align="center" prop="userId" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="模块标题" align="center" prop="title" :show-overflow-tooltip="true" />
      <el-table-column label="请求方式" align="center" prop="requestMethod" width="100" />
      <el-table-column label="请求URL" align="center" prop="operUrl" :show-overflow-tooltip="true" min-width="200" />
      <el-table-column label="操作状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === 0" type="success">正常</el-tag>
          <el-tag v-else-if="scope.row.status === 1" type="danger">异常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作IP" align="center" prop="operIp" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="耗时" align="center" prop="costTime" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.costTime }}ms</span>
        </template>
      </el-table-column>
      <el-table-column label="设备ID" align="center" prop="deviceId" :show-overflow-tooltip="true" />
      <el-table-column label="设备型号" align="center" prop="deviceModel" :show-overflow-tooltip="true" />
      <el-table-column label="App版本" align="center" prop="appVersion" width="100" />
      <el-table-column label="平台" align="center" prop="platform" width="100" />
      <el-table-column label="操作时间" align="center" prop="operTime" width="160" sortable="custom" :sort-orders="['descending', 'ascending']">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.operTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['monitor:appOperLog:query']"
          >详细</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 操作日志详细 -->
    <el-dialog title="App操作日志详细" :visible.sync="open" width="900px" append-to-body class="oper-log-dialog">
      <el-tabs v-model="activeTab" class="dialog-tabs">
        <!-- Tab 1: 基本信息 -->
        <el-tab-pane label="基本信息" name="base">
          <div class="tab-content">
            <el-descriptions :column="2" border size="medium" class="mb-20">
              <el-descriptions-item label="模块标题">{{ form.title }}</el-descriptions-item>
              <el-descriptions-item label="用户ID">
                {{ form.userId }}
                <el-button type="text" icon="el-icon-copy-document" size="mini" @click="handleCopy(form.userId)" v-if="form.userId"></el-button>
              </el-descriptions-item>
              <el-descriptions-item label="操作IP">{{ form.operIp }}</el-descriptions-item>
              <el-descriptions-item label="操作地点">{{ form.operLocation }}</el-descriptions-item>
              <el-descriptions-item label="操作时间">{{ parseTime(form.operTime) }}</el-descriptions-item>
              <el-descriptions-item label="耗时">
                <el-tag :type="form.costTime > 1000 ? 'warning' : 'success'" size="small">{{ form.costTime }}ms</el-tag>
              </el-descriptions-item>
            </el-descriptions>

            <el-descriptions :column="1" border size="medium">
              <el-descriptions-item label="请求URL">{{ form.operUrl }}</el-descriptions-item>
              <el-descriptions-item label="请求方式">
                <el-tag size="small">{{ form.requestMethod }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="操作方法">{{ form.method }}</el-descriptions-item>
              <el-descriptions-item label="操作状态">
                <el-tag v-if="form.status === 0" type="success">正常</el-tag>
                <el-tag v-else-if="form.status === 1" type="danger">异常</el-tag>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- Tab 2: 设备环境 -->
        <el-tab-pane label="设备环境" name="device">
          <div class="tab-content">
            <el-descriptions :column="2" border size="medium">
              <el-descriptions-item label="设备ID">
                <span class="text-truncate" :title="form.deviceId">{{ form.deviceId }}</span>
                <el-button type="text" icon="el-icon-copy-document" size="mini" @click="handleCopy(form.deviceId)" v-if="form.deviceId"></el-button>
              </el-descriptions-item>
              <el-descriptions-item label="设备型号">{{ form.deviceModel }}</el-descriptions-item>
              <el-descriptions-item label="平台">{{ form.platform }}</el-descriptions-item>
              <el-descriptions-item label="App版本">{{ form.appVersion }}</el-descriptions-item>
              <el-descriptions-item label="操作系统">{{ form.os }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-tab-pane>

        <!-- Tab 3: 数据载荷 -->
        <el-tab-pane label="数据载荷" name="payload">
          <div class="tab-content">
            <div class="payload-section">
              <div class="payload-header">
                <span class="payload-title">请求参数</span>
                <el-button type="text" icon="el-icon-copy-document" size="mini" @click="handleCopy(form.operParam)" v-if="form.operParam">复制</el-button>
              </div>
              <div class="code-wrapper">
                <pre>{{ formatJson(form.operParam) }}</pre>
              </div>
            </div>

            <div class="payload-section">
              <div class="payload-header">
                <span class="payload-title">返回参数</span>
                <el-button type="text" icon="el-icon-copy-document" size="mini" @click="handleCopy(form.jsonResult)" v-if="form.jsonResult">复制</el-button>
              </div>
              <div class="code-wrapper">
                <pre>{{ formatJson(form.jsonResult) }}</pre>
              </div>
            </div>

            <div class="payload-section" v-if="form.status === 1">
               <div class="payload-header">
                <span class="payload-title" style="color: #F56C6C;">错误消息</span>
                <el-button type="text" icon="el-icon-copy-document" size="mini" @click="handleCopy(form.errorMsg)">复制</el-button>
              </div>
              <div class="code-wrapper error-wrapper">
                <pre>{{ form.errorMsg }}</pre>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
      <div slot="footer" class="dialog-footer">
        <el-button @click="open = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { list, getInfo, delAppOperLog, cleanOperLog } from "@/api/monitor/appOperLog";

export default {
  name: "AppOperLog",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
      // 选中数组
      ids: [],
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 是否显示弹出层
      open: false,
      // 日期范围
      dateRange: [],
      // 默认排序
      defaultSort: { prop: "operTime", order: "descending" },
      // 激活的tab
      activeTab: 'base',
      // 表单参数
      form: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        title: undefined,
        status: undefined
      }
    };
  },
  computed: {
    // 动态计算表格高度
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 70 : 0;
      const toolbarHeight = 40;
      const paginationHeight = 60;
      const padding = 40;
      const tablePaginationGap = 12;
      const margins = 20;
      const tableBottomPadding = 8;
      const tableWrapperMargin = 12;
      const reserved = searchHeight + toolbarHeight + paginationHeight + padding + tablePaginationGap + margins + tableBottomPadding + tableWrapperMargin;
      const viewportHeight = window.innerHeight || 800;
      const calculated = viewportHeight - reserved - 94;
      return Math.max(300, calculated);
    }
  },
  mounted() {
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => {
        this.updateTableHeight();
      });
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 查询App操作日志列表 */
    getList() {
      this.loading = true;
      list(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
          this.list = response.rows;
          this.total = response.total;
          this.loading = false;
        }
      );
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.dateRange = [];
      this.resetForm("queryForm");
      this.queryParams.pageNum = 1;
      this.$refs.tables.sort(this.defaultSort.prop, this.defaultSort.order)
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.operId)
      this.multiple = !selection.length
    },
    /** 排序触发事件 */
    handleSortChange(column, prop, order) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    /** 详细按钮操作 */
    handleView(row) {
      this.activeTab = 'base';
      getInfo(row.operId).then(response => {
        this.form = response.data;
        this.open = true;
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const operIds = row.operId || this.ids;
      this.$modal.confirm('是否确认删除日志编号为"' + operIds + '"的数据项？').then(function() {
        return delAppOperLog(operIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 清空按钮操作 */
    handleClean() {
      this.$modal.confirm('是否确认清空所有操作日志数据项？').then(function() {
        return cleanOperLog();
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("清空成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('monitor/appOperLog/export', {
        ...this.queryParams
      }, `appOperLog_${new Date().getTime()}.xlsx`)
    },
    /** 双击单元格复制内容 */
    handleCellDblClick(row, column, cell, event) {
      let text = '';
      const prop = column.property;
      if (prop && row[prop] !== null && row[prop] !== undefined) {
        text = String(row[prop]);
      } else {
        text = cell.innerText || cell.textContent || '';
      }
      text = text.trim();
      if (!text || text === '-') {
        return;
      }
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
          this.$message.success('已复制: ' + text);
        }).catch(() => {
          this.fallbackCopy(text);
        });
      } else {
        this.fallbackCopy(text);
      }
    },
    /** 兼容复制方法 */
    fallbackCopy(text) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.$message.success('已复制: ' + text);
      } catch (err) {
        this.$message.error('复制失败');
      }
      document.body.removeChild(textarea);
    },
    formatJson(json) {
      if (!json) return "";
      if (typeof json === 'object') {
        return JSON.stringify(json, null, 2);
      }
      try {
        const parsed = JSON.parse(json);
        return JSON.stringify(parsed, null, 2);
      } catch (e) {
        return json;
      }
    }
  }
};
</script>

<style scoped>
.tab-content {
  padding: 10px 0;
}
.mb-20 {
  margin-bottom: 20px;
}
.text-truncate {
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
.payload-section {
  margin-bottom: 20px;
}
.payload-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.payload-title {
  font-weight: bold;
  font-size: 14px;
  color: #606266;
}
.code-wrapper {
  background-color: #f8f9fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}
.error-wrapper {
  background-color: #fef0f0;
  border-color: #fde2e2;
}
.code-wrapper pre {
  margin: 0;
  font-family: Consolas, Monaco, monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #303133;
}
</style>

