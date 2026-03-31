<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
      <el-form-item label="任务ID" prop="taskId">
        <el-input
          v-model="queryParams.taskId"
          placeholder="请输入任务ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="任务类型" prop="taskType">
        <el-select v-model="queryParams.taskType" placeholder="请选择任务类型" clearable style="width: 150px">
          <el-option label="全部" value="all" />
          <el-option label="转写" value="transcription" />
          <el-option label="生成纪要" value="summary" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="admin-toolbar">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table 
        v-loading="loading" 
        :data="taskList" 
        stripe 
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="任务ID" align="center" prop="taskId" width="200" show-overflow-tooltip />
        <el-table-column label="任务类型" align="center" prop="taskType" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.taskType === '转写'" type="primary" size="small">转写</el-tag>
            <el-tag v-else-if="scope.row.taskType === '生成纪要'" type="success" size="small">生成纪要</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="用户ID" align="center" prop="userId" width="150" show-overflow-tooltip />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.status === 'SUCCEEDED' || scope.row.status === '1'" type="success" size="small">成功</el-tag>
            <el-tag v-else-if="scope.row.status === 'FAILED' || scope.row.status === '0'" type="danger" size="small">失败</el-tag>
            <el-tag v-else-if="scope.row.status === 'processing'" type="warning" size="small">处理中</el-tag>
            <el-tag v-else type="info" size="small">待处理</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="错误信息" align="left" prop="errorMessage" width="250" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.errorMessage" style="color: #f56c6c;">{{ scope.row.errorMessage }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="平台" align="center" prop="platform" width="120" />
        <el-table-column label="模型" align="center" prop="model" width="120" />
        <el-table-column label="音频时长" align="center" prop="durationSec" width="120" v-if="showDurationColumn">
          <template slot-scope="scope">
            <span v-if="scope.row.durationSec">{{ scope.row.durationSec }}秒</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Token数" align="center" prop="totalTokens" width="120" v-if="showTokenColumn">
          <template slot-scope="scope">
            <span v-if="scope.row.totalTokens">{{ scope.row.totalTokens }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="文件地址" align="left" prop="fileUrl" width="250" show-overflow-tooltip v-if="showFileUrlColumn" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="updateTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
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
import { listTask } from "@/api/system/fileManage";

export default {
  name: "Task",
  data() {
    return {
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 任务列表
      taskList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        taskId: null,
        userId: null,
        taskType: null
      },
      // 表格最大高度
      tableMaxHeight: 600
    };
  },
  computed: {
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 100 : 0;
      const toolbarHeight = 50;
      const paginationHeight = 60;
      return window.innerHeight - 200 - searchHeight - toolbarHeight - paginationHeight;
    },
    showDurationColumn() {
      return this.taskList.some(item => item.durationSec !== undefined && item.durationSec !== null);
    },
    showTokenColumn() {
      return this.taskList.some(item => item.totalTokens !== undefined && item.totalTokens !== null);
    },
    showFileUrlColumn() {
      return this.taskList.some(item => item.fileUrl !== undefined && item.fileUrl !== null);
    }
  },
  created() {
    console.log("Task component created");
    // 从路由参数获取taskId
    if (this.$route.query.taskId) {
      this.queryParams.taskId = this.$route.query.taskId;
    }
    this.getList();
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  watch: {
    '$route'(to, from) {
      if (to.query.taskId !== from.query.taskId) {
        this.queryParams.taskId = to.query.taskId;
        this.handleQuery();
      }
    }
  },
  methods: {
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 查询任务列表 */
    getList() {
      this.loading = true;
      listTask(this.queryParams).then(response => {
        this.taskList = response.rows;
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
      // 保留路由参数中的taskId
      if (this.$route.query.taskId) {
        this.queryParams.taskId = this.$route.query.taskId;
      }
      this.handleQuery();
    },
    /** 双击单元格 */
    handleCellDblClick(row, column, cell, event) {
      // 可以在这里添加双击查看详情的逻辑
    }
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}
</style>

