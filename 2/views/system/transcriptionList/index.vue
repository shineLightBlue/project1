<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
         <el-form-item label="任务ID" prop="transcriptionTaskId">
        <el-input
          v-model="queryParams.transcriptionTaskId"
          placeholder="请输入任务ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="文件ID" prop="fileId">
        <el-input
          v-model="queryParams.fileId"
          placeholder="请输入文件ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入用户账号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
       <el-form-item label="所用模型" prop="model">
          <el-select v-model="queryParams.model" placeholder="请选择所用模型" filterable>
             <el-option label="全部" value="" />
            <el-option
              v-for="item in modelList"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
          <el-form-item label="转写状态" prop="businessStatus">
          <el-select v-model="queryParams.businessStatus" placeholder="请选择转写状态" filterable>
             <el-option label="全部" value="" />
            <el-option
              v-for="item in transcriptionStatusOptions"
              :key="item.dictValue"
              :label="item.dictLabel"
              :value="item.dictValue"
            />
          </el-select>
        </el-form-item>
          <el-form-item label="提交时间" prop="timeRange">
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
        :data="transcriptionRecord"
        stripe
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="任务ID" align="center" prop="transcriptionTaskId" width="200" show-overflow-tooltip />
        <el-table-column label="文件ID" align="center" prop="fileId" width="100" show-overflow-tooltip />
        <el-table-column label="用户账号" align="center" prop="userAccount" width="150" show-overflow-tooltip />
        <el-table-column label="上传时间" align="center" prop="uploadTime" width="150">
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="文件属性" align="center" width="150">
          <template slot-scope="scope">
            <div>
              <div>时长：{{ formatDuration(scope.row.fileDuration) }}</div>
              <div>大小：{{ formatFileSize(scope.row.fileSize) }}</div>
              <div>格式：{{ scope.row.fileFormat || '-' }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="转写状态" align="center" prop="businessStatus" width="120">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.businessStatus === '待转写'" type="info" size="small">待转写</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写完成'" type="warning" size="small">转写完成</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '全部完成'" type="success" size="small">全部完成</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写失败'" type="danger" size="small">转写失败</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写内容少'" type="success" size="small">转写内容少</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '转写为空'" type="warning" size="small">转写为空</el-tag>
            <el-tag v-else-if="scope.row.businessStatus === '生成失败'" type="danger" size="small">生成失败</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
         <el-table-column label="失败详情" align="center" prop="failureDetail" width="120">
          <template slot-scope="scope">
            <span v-if="scope.row.failureDetail">{{ scope.row.failureDetail }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
                 <el-table-column label="消耗权益" align="center" prop="durationSec" width="120">
                     <template slot-scope="scope">
                      <span v-if="scope.row.durationSec">转写时长：{{ scope.row.durationSec }}s</span>
                      <span v-else>-</span>
                 </template>
                 </el-table-column>
        <el-table-column label="所用模型" align="center" prop="model" width="150" show-overflow-tooltip />
        <el-table-column label="耗时" align="center" prop="costTime" width="150" show-overflow-tooltip >
            <template slot-scope="scope">
                      <span v-if="scope.row.costTime">{{ scope.row.costTime }}s</span>
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
import { listTranscriptionRecord,getModel } from "@/api/system/fileManage";
import { getDicts } from "@/api/system/dict/data";
import { addDateRange } from "@/utils/ruoyi";
export default {
  name: "FileManage",
  data() {
    return {
     timeRange: [], // 更新时间范围
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 文件列表
      transcriptionRecord: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        fileId: null,
        userAccount: null,
        model: null,
        businessStatus: null,
        transcriptionTaskId:null
      },
      // 调整原因选项（从字典获取）
      transcriptionStatusOptions: [],
      // 表格最大高度
      tableMaxHeight: 600,
      // 模型列表
      modelList: []
    };
  },
  created() {
    this.getList();
    this.loadTranscriptionStatusDict()
    this.getModel()
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
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    getModel(){
        getModel().then(response => {
        this.modelList = response.data || [];
      });
    },
    /** 查询文件列表 */
    getList() {
      this.loading = true;
      // 转换存储状态查询参数
      listTranscriptionRecord(this.queryParams).then(response => {
        console.log(response)
        this.transcriptionRecord = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
       /** 加载调整原因字典数据 */
    loadTranscriptionStatusDict() {
      getDicts('t_transcription_status').then(response => {
        this.transcriptionStatusOptions = response.data || [];
      }).catch(() => {
        this.transcriptionStatusOptions = [];
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
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
      handleTimeRangeChange(val) {
      console.log(val)
      this.timeRange = val || [];
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
      this.download('system/file/transcription/export', {
        ...this.queryParams
      }, `transcription_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}
</style>

