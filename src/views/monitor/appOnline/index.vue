<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 240px;"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-setting"
          size="mini"
          @click="handleInitIndex"
          v-hasPermi="['monitor:appOnline:init']"
        >初始化索引</el-button>
      </el-col>
    </el-row>

    <el-table
      v-loading="loading"
      :data="list"
      style="width: 100%;"
      @cell-dblclick="handleCellDblClick"
    >
      <el-table-column label="序号" type="index" align="center" width="60">
        <template slot-scope="scope">
          <span>{{(queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1}}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户ID" align="center" prop="userId" width="150" :show-overflow-tooltip="true" />
      <el-table-column label="在线设备数" align="center" prop="deviceCount" width="100" />
      <el-table-column label="最后活跃平台" align="center" prop="lastPlatform" width="120" />
      <el-table-column label="最后活跃IP" align="center" prop="lastIpaddr" width="150" :show-overflow-tooltip="true" />
      <el-table-column label="最后活跃时间" align="center" prop="lastActiveTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.lastActiveTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="260">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleViewDevices(scope.row)"
            v-hasPermi="['monitor:appOnline:list']"
          >查看设备</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleForceLogoutAll(scope.row)"
            v-hasPermi="['monitor:appOnline:forceLogout']"
          >全部强退</el-button>
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

    <!-- 设备列表弹窗 -->
    <el-dialog :title="'用户 ' + currentUserId + ' 的登录设备'" :visible.sync="deviceDialogVisible" width="1200px" append-to-body>
      <el-table
        v-loading="deviceLoading"
        :data="deviceList"
        style="width: 100%;"
        @cell-dblclick="handleDeviceCellDblClick"
      >
        <el-table-column label="设备ID" align="center" prop="deviceId" width="180" :show-overflow-tooltip="true" />
        <el-table-column label="设备型号" align="center" prop="deviceModel" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="设备名称" align="center" prop="deviceName" width="140" :show-overflow-tooltip="true" />
        <el-table-column label="平台" align="center" prop="platform" width="80" />
        <el-table-column label="操作系统" align="center" prop="os" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="IP地址" align="center" prop="ipaddr" width="130" :show-overflow-tooltip="true" />
        <el-table-column label="登录地点" align="center" prop="loginLocation" width="120" :show-overflow-tooltip="true" />
        <el-table-column label="登录时间" align="center" prop="loginTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.loginTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃时间" align="center" prop="lastActiveTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.lastActiveTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="80" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleForceLogout(scope.row)"
              v-hasPermi="['monitor:appOnline:forceLogout']"
            >强退</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script>
import { list, devices, forceLogout, forceLogoutAll, initIndex } from "@/api/monitor/appOnline";

export default {
  name: "AppOnline",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 总条数
      total: 0,
      // 表格数据
      list: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: undefined
      },
      // 设备列表弹窗
      deviceDialogVisible: false,
      deviceLoading: false,
      deviceList: [],
      currentUserId: ''
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询App在线用户列表 */
    getList() {
      this.loading = true;
      list(this.queryParams).then(response => {
        this.list = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 查看设备列表 */
    handleViewDevices(row) {
      this.currentUserId = row.userId;
      this.deviceDialogVisible = true;
      this.deviceLoading = true;
      devices(row.userId).then(response => {
        this.deviceList = response.data || [];
        this.deviceLoading = false;
      }).catch(() => {
        this.deviceLoading = false;
      });
    },
    /** 强退按钮操作 */
    handleForceLogout(row) {
      this.$modal.confirm('是否确认强退该设备？').then(() => {
        return forceLogout(row.tokenId);
      }).then(() => {
        // 刷新设备列表
        this.handleViewDevices({ userId: this.currentUserId });
        // 刷新用户列表
        this.getList();
        this.$modal.msgSuccess("强退成功");
      }).catch(() => {});
    },
    /** 全部强退按钮操作 */
    handleForceLogoutAll(row) {
      this.$modal.confirm('是否确认强退用户"' + row.userId + '"的所有设备？').then(() => {
        return forceLogoutAll(row.userId);
      }).then(() => {
        this.deviceDialogVisible = false;
        this.getList();
        this.$modal.msgSuccess("全部强退成功");
      }).catch(() => {});
    },
    /** 初始化索引 */
    handleInitIndex() {
      this.$modal.confirm('初始化索引会同步所有现有的在线用户到全局索引，确认执行？').then(() => {
        return initIndex();
      }).then(response => {
        this.$modal.msgSuccess(response.msg || "初始化成功");
        this.getList();
      }).catch(() => {});
    },
    /** 双击单元格复制内容 */
    handleCellDblClick(row, column, cell, event) {
      this.copyCell(row, column, cell);
    },
    /** 设备列表双击单元格复制内容 */
    handleDeviceCellDblClick(row, column, cell, event) {
      this.copyCell(row, column, cell);
    },
    /** 复制单元格内容 */
    copyCell(row, column, cell) {
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
