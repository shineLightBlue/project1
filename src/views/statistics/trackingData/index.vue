  <template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="120px" class="admin-search-form">
      <el-form-item label="事件ID" prop="eventId">
        <el-select v-model="queryParams.eventId" placeholder="请选择事件ID" clearable filterable style="width: 200px">
          <el-option
            v-for="dict in dict.type.tracking_event_id"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="事件名称" prop="eventName">
        <el-input
          v-model="queryParams.eventName"
          placeholder="请输入事件名称"
          clearable
          style="width: 200px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="会话ID" prop="sessionId">
        <el-input
          v-model="queryParams.sessionId"
          placeholder="请输入会话ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="浏览器" prop="browser">
        <el-input
          v-model="queryParams.browser"
          placeholder="请输入浏览器"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="操作系统" prop="os">
        <el-input
          v-model="queryParams.os"
          placeholder="请输入操作系统"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="IP地址" prop="ipAddress">
        <el-input
          v-model="queryParams.ipAddress"
          placeholder="请输入IP地址"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="国家" prop="country">
        <el-input
          v-model="queryParams.country"
          placeholder="请输入国家"
          clearable
          style="width: 120px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="请求来源" prop="requestSource">
        <el-input
          v-model="queryParams.requestSource"
          placeholder="请输入请求来源"
          clearable
          style="width: 150px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="产品序列号" prop="productSn">
        <el-input
          v-model="queryParams.productSn"
          placeholder="请输入产品序列号"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="事件时间" prop="eventTimeRange">
        <el-date-picker
          v-model="eventTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handleEventTimeRangeChange"
        />
      </el-form-item>
      <el-form-item label="上报时间" prop="reportTimeRange">
        <el-date-picker
          v-model="reportTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handleReportTimeRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <!-- 操作按钮区域 -->
    <el-row :gutter="10" class="admin-toolbar">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:trackingData:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="trackingDataList"
        border
        stripe
        class="admin-table"
        :max-height="tableMaxHeight"
        style="width: 100%"
      >
        <el-table-column label="ID" align="center" prop="id" width="80" />
        <el-table-column label="事件ID" align="center" prop="eventId" width="120">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.tracking_event_id" :value="scope.row.eventId"/>
          </template>
        </el-table-column>
        <el-table-column label="事件名称" align="center" prop="eventName" width="200" show-overflow-tooltip />
        <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
        <el-table-column label="会话ID" align="center" prop="sessionId" width="180" show-overflow-tooltip />
        <el-table-column label="浏览器" align="center" prop="browser" width="120" show-overflow-tooltip />
        <el-table-column label="操作系统" align="center" prop="os" width="120" show-overflow-tooltip />
        <el-table-column label="IP地址" align="center" prop="ipAddress" width="140" show-overflow-tooltip />
        <el-table-column label="国家" align="center" prop="country" width="100" />
        <el-table-column label="请求来源" align="center" prop="requestSource" width="120" show-overflow-tooltip />
        <el-table-column label="产品序列号" align="center" prop="productSn" width="180" show-overflow-tooltip />
        <el-table-column label="事件时间" align="center" prop="eventTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.eventTime">{{ parseTime(scope.row.eventTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="上报时间" align="center" prop="reportTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.reportTime">{{ parseTime(scope.row.reportTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="事件详细数据" align="left" prop="eventData" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-hasPermi="['system:trackingData:query']"
            >详情</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog title="埋点数据详情" :visible.sync="detailOpen" width="800px" append-to-body custom-class="admin-dialog">
      <el-descriptions :column="2" border v-if="detailForm.id">
        <el-descriptions-item label="ID" :span="2">{{ detailForm.id }}</el-descriptions-item>
        <el-descriptions-item label="事件ID" :span="2">
          <dict-tag :options="dict.type.tracking_event_id" :value="detailForm.eventId"/>
        </el-descriptions-item>
        <el-descriptions-item label="事件名称" :span="2" show-overflow-tooltip>{{ detailForm.eventName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户ID" :span="2" show-overflow-tooltip>{{ detailForm.userId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="会话ID" :span="2" show-overflow-tooltip>{{ detailForm.sessionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ detailForm.browser || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ detailForm.os || '-' }}</el-descriptions-item>
        <el-descriptions-item label="IP地址" :span="2" show-overflow-tooltip>{{ detailForm.ipAddress || '-' }}</el-descriptions-item>
        <el-descriptions-item label="国家">{{ detailForm.country || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求来源">{{ detailForm.requestSource || '-' }}</el-descriptions-item>
        <el-descriptions-item label="产品序列号" :span="2" show-overflow-tooltip>{{ detailForm.productSn || '-' }}</el-descriptions-item>
        <el-descriptions-item label="事件时间" :span="2">
          {{ detailForm.eventTime ? parseTime(detailForm.eventTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="上报时间" :span="2">
          {{ detailForm.reportTime ? parseTime(detailForm.reportTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="事件详细数据" :span="2" show-overflow-tooltip>
          <pre style="white-space: pre-wrap; word-wrap: break-word; max-height: 200px; overflow-y: auto;">{{ detailForm.eventData || '-' }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listTrackingData, getTrackingData, exportTrackingData } from "@/api/statistics/trackingData";
import { addDateRange } from "@/utils/ruoyi";

export default {
  name: "TrackingData",
  dicts: ['tracking_event_id'],
  data() {
    return {
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 埋点数据列表
      trackingDataList: [],
      // 表格最大高度
      tableMaxHeight: 600,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        eventId: null,
        eventName: null,
        userId: null,
        sessionId: null,
        browser: null,
        os: null,
        ipAddress: null,
        country: null,
        requestSource: null,
        productSn: null
      },
      // 事件时间范围
      eventTimeRange: [],
      // 上报时间范围
      reportTimeRange: [],
      // 详情对话框
      detailOpen: false,
      detailForm: {}
    };
  },
  computed: {
    // 动态计算表格高度（基于 DOM 实际高度）
    calculatedTableHeight() {
      return this.tableMaxHeight;
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
        // 获取页面容器
        const container = this.$el;
        if (!container) return;

        // 获取搜索表单实际高度
        const searchForm = container.querySelector('.admin-search-form');
        const searchHeight = this.showSearch && searchForm ? searchForm.offsetHeight : 0;

        // 获取工具栏实际高度
        const toolbar = container.querySelector('.admin-toolbar');
        const toolbarHeight = toolbar ? toolbar.offsetHeight : 40;

        // 分页高度（固定，包含 padding）
        const paginationHeight = 80;

        // 间距：搜索表单 margin-bottom(12) + 工具栏 margin-bottom(12) + 表格容器 margin-bottom(12) + 额外安全边距
        const margins = 50;

        // 页面容器高度是 calc(100vh - 99px)
        const viewportHeight = window.innerHeight || 800;
        const containerHeight = viewportHeight - 99;

        // 计算表格可用高度
        const calculated = containerHeight - searchHeight - toolbarHeight - paginationHeight - margins;
        this.tableMaxHeight = Math.max(300, calculated);
      });
    },
    /** 查询埋点数据列表 */
    getList() {
      this.loading = true;
      // 处理时间范围参数 - 使用 addDateRange 方法将参数放入 params 对象
      const params = { ...this.queryParams };
      addDateRange(params, this.eventTimeRange, 'EventTime');
      addDateRange(params, this.reportTimeRange, 'ReportTime');
      listTrackingData(params).then(response => {
        this.trackingDataList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 事件时间范围变化 */
    handleEventTimeRangeChange(val) {
      this.eventTimeRange = val || [];
    },
    /** 上报时间范围变化 */
    handleReportTimeRangeChange(val) {
      this.reportTimeRange = val || [];
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      // 重置所有查询参数
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        eventId: null,
        eventName: null,
        userId: null,
        sessionId: null,
        browser: null,
        os: null,
        ipAddress: null,
        country: null,
        requestSource: null,
        productSn: null
      };
      this.eventTimeRange = [];
      this.reportTimeRange = [];
      this.handleQuery();
    },
    /** 查看详情 */
    handleView(row) {
      getTrackingData(row.id).then(response => {
        this.detailForm = response.data;
        this.detailOpen = true;
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = { ...this.queryParams };
      addDateRange(params, this.eventTimeRange, 'EventTime');
      addDateRange(params, this.reportTimeRange, 'ReportTime');
      this.download('system/trackingData/export', params, `trackingData_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}

.admin-search-form {
  margin-bottom: 12px;
}

.admin-toolbar {
  margin-bottom: 12px;
}

.admin-table-wrapper {
  margin-bottom: 12px;
}

.admin-pagination-wrapper {
  padding: 10px 0;
}

pre {
  margin: 0;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.5;
}
</style>
