<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
      <el-form-item label="文件ID" prop="id">
        <el-input
          v-model="queryParams.id"
          placeholder="请输入文件ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户账号" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="存储状态" prop="storageStatus">
        <el-select v-model="queryParams.storageStatus" placeholder="请选择存储状态" clearable style="width: 150px">
           <el-option label="全部" value="" />
          <el-option label="可用" value="available" />
          <el-option label="已删除" value="deleted" />
          <el-option label="回收站" value="recycle" />
        </el-select>
      </el-form-item>
      <el-form-item label="业务状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择业务状态" clearable style="width: 150px">
           <el-option label="全部" value="" />
          <el-option
              v-for="item in businessStatusOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
        </el-select>
      </el-form-item>
        <el-form-item label="上传时间" prop="timeRange">
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd HH:mm:ss"
          size="small"
          style="width: 350px"
          @change="handleTimeRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
     <el-row>
    <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"  
          v-hasPermi="['system:role:export']"
        >导出</el-button>
     </el-row>
    <el-row :gutter="10" class="admin-toolbar">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table 
        v-loading="loading" 
        :data="fileList" 
        stripe 
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="序号" type="index" width="60" align="center" />
        <el-table-column label="文件ID" align="center" prop="fileId" width="200" show-overflow-tooltip />
        <el-table-column label="用户账号" align="center" prop="userAccount" width="150" show-overflow-tooltip />
        <el-table-column label="上传时间" align="center" prop="uploadTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.uploadTime">{{ parseTime(scope.row.uploadTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="文件属性" align="center" width="200">
          <template slot-scope="scope">
            <div>
              <div>时长：{{ formatDuration(scope.row.fileDuration) }}</div>
              <div>大小：{{ formatFileSize(scope.row.fileSize) }}</div>
              <div>格式：{{ scope.row.fileFormat || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="存储状态" align="center" prop="storageStatus" width="100">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.storageStatus === '可用'" type="success" size="small">可用</el-tag>
            <el-tag v-else-if="scope.row.storageStatus === '已删除'" type="danger" size="small">已删除</el-tag>
            <el-tag v-else-if="scope.row.storageStatus === '回收站'" type="warning" size="small">回收站</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="业务状态" align="center" prop="businessStatus" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.businessStatus === '待转写'" type="info" size="small">{{ scope.row.businessStatus }}</el-tag>
            <el-tag v-if="scope.row.businessStatus === '转写中'" type="info" size="small">转写中</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写完成'" type="warning" size="small">转写完成</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '全部完成'" type="success" size="small">全部完成</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写失败'" type="danger" size="small">转写失败</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '生成失败'" type="danger" size="small">生成失败</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写内容少'" type="danger" size="small">转写内容少</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写为空'" type="danger" size="small">转写为空</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="失败详情" align="left" prop="failureDetail" width="250" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.failureDetail">{{ scope.row.failureDetail }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="关联处理任务" align="center" width="300">
          <template slot-scope="scope">
            <div v-if="scope.row.transcriptionTaskId || scope.row.summaryTaskId">
              <div v-if="scope.row.transcriptionTaskId" style="margin-bottom: 5px;">
                <el-link type="primary" @click="handleTaskClick(scope.row.transcriptionTaskId)" :underline="false">
                  转写任务：{{ scope.row.transcriptionTaskId }}
                </el-link>
              </div>
              <div v-if="scope.row.summaryTaskId && shouldShowSummaryTask(scope.row.businessStatus)">
                <el-link type="primary" @click="handleTaskClick(scope.row.summaryTaskId)" :underline="false">
                  生成纪要任务：{{ scope.row.summaryTaskId }}
                </el-link>
              </div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="消耗权益" align="center" width="150">
          <template slot-scope="scope">
            <div v-if="scope.row.consumedTranscriptionDuration">
              <div>转写时长：-{{ scope.row.consumedTranscriptionDuration }}秒</div>
            </div>
            <div v-if="scope.row.consumedSummaryTokens">
              <div>生成纪要token数：{{ scope.row.consumedSummaryTokens }}</div>
            </div>
            <span v-if="!scope.row.consumedTranscriptionDuration && !scope.row.consumedSummaryTokens">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-time"
              @click="handleHistory(scope.row)"
              v-hasPermi="['system:file:query']"
            >处理历史</el-button>
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

    <!-- 处理历史对话框 -->
    <el-dialog title="处理历史" :visible.sync="historyDialog.open" width="800px" append-to-body>
      <el-timeline>
        <el-timeline-item
          v-for="(item, index) in historyList"
          :key="index"
          :timestamp="item.uploadTime ? parseTime(item.uploadTime, '{y}-{m}-{d} {h}:{i}:{s}') : ''"
          placement="top"
        >
          <el-card>
            <h4>{{ item.businessStatus }}</h4>
            <p v-if="item.transcriptionTaskId || item.summaryTaskId">
              <span v-if="item.transcriptionTaskId">转写任务ID：{{ item.transcriptionTaskId }}</span>
              <span v-if="item.summaryTaskId" style="margin-left: 10px;">纪要任务ID：{{ item.summaryTaskId }}</span>
            </p>
            <p v-if="item.failureDetail" style="color: #f56c6c;">{{ item.failureDetail }}</p>
          </el-card>
        </el-timeline-item>
      </el-timeline>
      <div slot="footer" class="dialog-footer">
        <el-button @click="historyDialog.open = false" size="small">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listFileManage, getFileHistory } from "@/api/system/fileManage";
import { getDicts } from "@/api/system/dict/data";
export default {
  name: "FileManage",
  data() {
    return {
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 文件列表
      fileList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        id: null,
        userId: null,
        storageStatus: null,
        businessStatus: null
      },
      // 表格最大高度
      tableMaxHeight: 600,
      // 处理历史对话框
      historyDialog: {
        open: false
      },
      timeRange: [], // 创建时间范围
      // 处理历史列表
      historyList: [],
      // 绑定原因选项（从字典获取）
      businessStatusOptions: [],
    };
  },
  created() {
    this.getList();
    this.loadBusinessStatusDict()
    this.updateTableHeight();
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  computed: {
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 100 : 0;
      const toolbarHeight = 50;
      const paginationHeight = 60;
      return window.innerHeight - 200 - searchHeight - toolbarHeight - paginationHeight;
    }
  },
  methods: {
      /** 加载绑定状态字典数据 */
    loadBusinessStatusDict() {
      getDicts('transcrition_node').then(response => {
        this.businessStatusOptions = response.data || [];
      }).catch(() => {
        this.businessStatusOptions = [];
      });
    },
    handleTimeRangeChange(val) {
      console.log(val)
      this.timeRange = val || [];
    },
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 查询文件列表 */
    getList() {
      this.loading = true;
      // 转换存储状态查询参数
      const params = { ...this.queryParams };
      if (params.storageStatus === 'available') {
        params.delFlag = '0';
        params.isRecycle = '0';
        delete params.storageStatus;
      } else if (params.storageStatus === 'deleted') {
        params.delFlag = '2';
        delete params.storageStatus;
      } else if (params.storageStatus === 'recycle') {
        params.isRecycle = '1';
        params.delFlag = '0';
        delete params.storageStatus;
      }
      // 业务状态在SQL中计算，这里只传递用于前端筛选提示
      // delete params.businessStatus;
      
      listFileManage(params).then(response => {
        this.fileList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      console.log(this.queryParams)
      this.queryParams.pageNum = 1;
      this.beginTime = this.timeRange.length > 0 ? this.timeRange[0] : null
      this.endTime = this.timeRange.length > 0 ? this.timeRange[1] : null
      this.queryParams.beginTime = this.beginTime
      this.queryParams.endTime = this.endTime
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.timeRange = [];
      this.handleQuery();
    },
    /** 处理历史 */
    handleHistory(row) {
      this.historyDialog.open = true;
      this.historyList = [];
      getFileHistory(row.fileId).then(response => {
        this.historyList = response.data || [];
      });
    },
    /** 任务ID点击 */
    handleTaskClick(taskId) {
      this.$router.push({
        path: '/file/task',
        query: { taskId: taskId }
      });
    },
    /** 判断是否显示纪要任务ID */
    shouldShowSummaryTask(businessStatus) {
      return businessStatus === '全部完成' || businessStatus === '生成失败';
    },
         /** 格式化时长为时:分:秒 */
    formatDuration(seconds) {
      if (!seconds || isNaN(seconds)) return '00:00:00';
      seconds = Math.floor(seconds);
      const h = Math.floor(seconds / 3600);
      const m = Math.floor((seconds % 3600) / 60);
      const s = seconds % 60;
      const pad = n => n.toString().padStart(2, '0');
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    },
   /** 格式化文件大小：>=1024显示MB，<1024显示KB */
    formatFileSize(size) {
      if (!size || isNaN(size)) return '0KB';
      if (size >= 1024) {
        return (size / 1024).toFixed(2) + 'MB';
      } else {
        return size + 'KB';
      }
    },
    /** 双击单元格 */
    handleCellDblClick(row, column, cell, event) {
      // 可以在这里添加双击查看详情的逻辑
    },
     /** 导出按钮操作 */
    handleExport() {
      this.download('system/file/export', {
        ...this.queryParams
      }, `file_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}
</style>

