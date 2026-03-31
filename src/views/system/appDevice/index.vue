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
      <el-form-item label="设备ID" prop="deviceId">
        <el-input
          v-model="queryParams.deviceId"
          placeholder="请输入设备ID"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select
          v-model="queryParams.platform"
          placeholder="平台"
          clearable
          style="width: 240px"
        >
          <el-option label="iOS" value="ios" />
          <el-option label="Android" value="android" />
          <el-option label="Web" value="web" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="状态"
          clearable
          style="width: 240px"
        >
          <el-option label="正常" value="0" />
          <el-option label="禁用" value="1" />
        </el-select>
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
          v-hasPermi="['system:appDevice:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:appDevice:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table ref="tables" v-loading="loading" :data="list" :default-sort="defaultSort" :row-class-name="tableRowClassName" @sort-change="handleSortChange" @selection-change="handleSelectionChange" @cell-dblclick="handleCellDblClick" :max-height="tableMaxHeight">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="用户ID" align="center" prop="userId" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="设备ID" align="center" prop="deviceId" :show-overflow-tooltip="true" />
      <el-table-column label="设备型号" align="center" prop="deviceModel" :show-overflow-tooltip="true" />
      <el-table-column label="设备名称" align="center" prop="deviceName" :show-overflow-tooltip="true" />
      <el-table-column label="平台" align="center" prop="platform" width="100" />
      <el-table-column label="操作系统" align="center" prop="os" :show-overflow-tooltip="true" />
      <el-table-column label="App版本" align="center" prop="appVersion" width="100" />
      <el-table-column label="首次登录时间" align="center" prop="firstLoginTime" width="180" sortable="custom" :sort-orders="['descending', 'ascending']">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.firstLoginTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="首次登录IP" align="center" prop="firstLoginIp" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="首次登录地点" align="center" prop="firstLoginLocation" :show-overflow-tooltip="true" />
      <el-table-column label="最后登录时间" align="center" prop="lastLoginTime" width="180" sortable="custom" :sort-orders="['descending', 'ascending']">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lastLoginTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="最后登录IP" align="center" prop="lastLoginIp" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="最后登录地点" align="center" prop="lastLoginLocation" :show-overflow-tooltip="true" />
      <el-table-column label="登录次数" align="center" prop="loginCount" width="100" sortable="custom" :sort-orders="['descending', 'ascending']" />
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="0"
            inactive-value="1"
            @change="handleStatusChange(scope.row)"
            v-hasPermi="['system:appDevice:edit']"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="150">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.isOnline"
            size="mini"
            type="text"
            icon="el-icon-remove-outline"
            @click="handleForceLogout(scope.row)"
            v-hasPermi="['system:appDevice:forceLogout']"
          >踢下线</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:appDevice:remove']"
          >删除</el-button>
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
  </div>
</template>

<script>
import { list, delDevice, changeStatus, forceLogout } from "@/api/system/appDevice";

export default {
  name: "AppDevice",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 选中的设备列表（使用业务标识）
      selectedDevices: [],
      // 默认排序
      defaultSort: { prop: "lastLoginTime", order: "descending" },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        deviceId: undefined,
        platform: undefined,
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
    /** 查询App设备列表 */
    getList() {
      this.loading = true;
      list(this.queryParams).then(response => {
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
      this.resetForm("queryForm");
      this.queryParams.pageNum = 1;
      this.$refs.tables.sort(this.defaultSort.prop, this.defaultSort.order)
    },
    /** 多选框选中数据 */
    handleSelectionChange(selection) {
      // 不再使用id，使用业务标识userId+deviceId
      this.selectedDevices = selection;
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 排序触发事件 */
    handleSortChange(column, prop, order) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    /** 状态修改 */
    handleStatusChange(row) {
      let text = row.status === "0" ? "启用" : "停用";
      const deviceName = row.deviceName || row.deviceId || '该设备';
      this.$modal.confirm('确认要"' + text + '""' + deviceName + '"设备吗？').then(() => {
        return changeStatus(row.userId, row.deviceId, row.status);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.status = row.status === "0" ? "1" : "0";
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const deviceName = row.deviceName || row.deviceId || '该设备';
      this.$modal.confirm('是否确认删除设备"' + deviceName + '"？').then(() => {
        return delDevice(row.userId, row.deviceId);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/appDevice/export', {
        ...this.queryParams
      }, `appDevice_${new Date().getTime()}.xlsx`)
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
    /** 表格行样式 */
    tableRowClassName({ row, rowIndex }) {
      if (row.isOnline) {
        return 'online-device-row';
      }
      return '';
    },
    /** 踢下线按钮操作 */
    handleForceLogout(row) {
      this.$modal.confirm('确认要踢下线设备"' + (row.deviceName || row.deviceId) + '"吗？').then(() => {
        return forceLogout(row.userId, row.deviceId);
      }).then(() => {
        this.$modal.msgSuccess("踢下线成功");
        this.getList();
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
::v-deep .online-device-row {
  background-color: #f0f9ff !important;
}
</style>

