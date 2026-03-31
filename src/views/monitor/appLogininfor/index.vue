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
      <el-form-item label="登录账号" prop="loginAccount">
        <el-input
          v-model="queryParams.loginAccount"
          placeholder="请输入登录账号"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="登录方式" prop="loginType">
        <el-select
          v-model="queryParams.loginType"
          placeholder="登录方式"
          clearable
          style="width: 240px"
        >
          <el-option label="手机验证码" value="phone_code" />
          <el-option label="手机密码" value="phone_pwd" />
          <el-option label="邮箱验证码" value="email_code" />
          <el-option label="邮箱密码" value="email_pwd" />
          <el-option label="微信" value="wechat" />
          <el-option label="Google" value="google" />
          <el-option label="Apple" value="apple" />
          <el-option label="退出" value="logout" />
          <el-option label="强制退出" value="force_logout" />
        </el-select>
      </el-form-item>
      <el-form-item label="登录状态" prop="status">
        <el-select
          v-model="queryParams.status"
          placeholder="登录状态"
          clearable
          style="width: 240px"
        >
          <el-option label="成功" value="0" />
          <el-option label="失败" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="登录时间">
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
          v-hasPermi="['monitor:appLogininfor:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          @click="handleClean"
          v-hasPermi="['monitor:appLogininfor:remove']"
        >清空</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['monitor:appLogininfor:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table ref="tables" v-loading="loading" :data="list" @selection-change="handleSelectionChange" :default-sort="defaultSort" @sort-change="handleSortChange" @cell-dblclick="handleCellDblClick" :max-height="tableMaxHeight">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="访问编号" align="center" prop="infoId" />
      <el-table-column label="用户ID" align="center" prop="userId" width="120" :show-overflow-tooltip="true" />
      <el-table-column label="登录账号" align="center" prop="loginAccount" :show-overflow-tooltip="true" />
      <el-table-column label="登录方式" align="center" prop="loginType" width="120">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.loginType === 'phone_code'" type="info">手机验证码</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'phone_pwd'" type="info">手机密码</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'email_code'" type="info">邮箱验证码</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'email_pwd'" type="info">邮箱密码</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'wechat'" type="success">微信</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'google'" type="success">Google</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'apple'" type="success">Apple</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'logout'" type="warning">退出</el-tag>
          <el-tag v-else-if="scope.row.loginType === 'force_logout'" type="danger">强制退出</el-tag>
          <span v-else>{{ scope.row.loginType }}</span>
        </template>
      </el-table-column>
      <el-table-column label="登录状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag v-if="scope.row.status === '0'" type="success">成功</el-tag>
          <el-tag v-else-if="scope.row.status === '1'" type="danger">失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="IP地址" align="center" prop="ipaddr" width="130" :show-overflow-tooltip="true" />
      <el-table-column label="登录地点" align="center" prop="loginLocation" :show-overflow-tooltip="true" />
      <el-table-column label="设备ID" align="center" prop="deviceId" :show-overflow-tooltip="true" />
      <el-table-column label="设备型号" align="center" prop="deviceModel" :show-overflow-tooltip="true" />
      <el-table-column label="操作系统" align="center" prop="os" width="100" />
      <el-table-column label="平台" align="center" prop="platform" width="100" />
      <el-table-column label="App版本" align="center" prop="appVersion" width="100" />
      <el-table-column label="提示消息" align="center" prop="msg" :show-overflow-tooltip="true" />
      <el-table-column label="登录时间" align="center" prop="loginTime" sortable="custom" :sort-orders="['descending', 'ascending']" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.loginTime) }}</span>
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
import { list, delAppLogininfor, cleanLogininfor } from "@/api/monitor/appLogininfor";

export default {
  name: "AppLogininfor",
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
      // 日期范围
      dateRange: [],
      // 默认排序
      defaultSort: { prop: "loginTime", order: "descending" },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined,
        loginAccount: undefined,
        loginType: undefined,
        status: undefined,
        deviceId: undefined
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
    /** 查询App登录日志列表 */
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
      this.ids = selection.map(item => item.infoId)
      this.multiple = !selection.length
    },
    /** 排序触发事件 */
    handleSortChange(column, prop, order) {
      this.queryParams.orderByColumn = column.prop;
      this.queryParams.isAsc = column.order;
      this.getList();
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const infoIds = row.infoId || this.ids;
      this.$modal.confirm('是否确认删除访问编号为"' + infoIds + '"的数据项？').then(function() {
        return delAppLogininfor(infoIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 清空按钮操作 */
    handleClean() {
      this.$modal.confirm('是否确认清空所有App登录日志数据项？').then(function() {
        return cleanLogininfor();
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("清空成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('monitor/appLogininfor/export', {
        ...this.queryParams
      }, `appLogininfor_${new Date().getTime()}.xlsx`)
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
    }
  }
};
</script>

