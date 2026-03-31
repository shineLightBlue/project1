<template>
  <div class="ai-cost-dashboard">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-title">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="currentColor"/>
          </svg>
          <h1>AI成本指标</h1>
        </div>
        <div class="header-actions">
          <el-button 
            class="refresh-btn" 
            icon="el-icon-refresh" 
            circle 
            @click="refreshAllData" 
            :loading="loading"
            type="primary"
            size="medium"
          />
        </div>
      </div>
    </div>

    <!-- 时间范围选择器 -->
    <div class="filter-panel">
      <div class="date-quick-filters">
        <button
          v-for="option in dateOptions"
          :key="option.value"
          class="date-chip"
          :class="{ 'date-chip--active': dateRangeType === option.value }"
          @click="handleDateRangeTypeChange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div v-if="dateRangeType === 'custom'" class="custom-date-range">
        <el-date-picker
          v-model="tempDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="yyyy-MM-dd"
          value-format="yyyy-MM-dd"
          size="small"
          class="date-picker"
        />
        <el-button 
          type="primary" 
          size="small" 
          class="apply-btn" 
          @click="applyCustomDateRange"
          :disabled="!tempDateRange || tempDateRange.length !== 2"
        >
          应用
        </el-button>
      </div>
      <div class="current-range-display" v-if="dateRange[0] && dateRange[1]">
        <i class="el-icon-date"></i>
        <span>{{ dateRange[0] }} ~ {{ dateRange[1] }}</span>
      </div>
    </div>

    <!-- 平台余额卡片区 -->
    <div class="balance-section">
      <h3 class="section-title">
        <i class="el-icon-wallet"></i>
        平台余额
      </h3>
      <div class="balance-grid" v-loading="balanceLoading">
        <div
          v-for="item in balanceList"
          :key="item.platformCode"
          class="balance-card"
          :class="[`balance-card--${(item.platformType || 'llm').toLowerCase()}`]"
          @click="openBalanceHistoryDialog(item)"
        >
          <div class="balance-card__header">
            <span class="platform-name">{{ item.platformName || item.platformCode }}</span>
            <span class="platform-type">{{ item.platformType }}</span>
          </div>
          <div class="balance-card__value">
            <span class="currency-symbol">{{ getCurrencySymbol(item.balanceUnit) }}</span>
            <span class="amount">{{ formatNumber(item.balanceValue) }}</span>
          </div>
          <div class="balance-card__footer">
            <span class="update-time">
              <i class="el-icon-time"></i>
              {{ formatTime(item.snapshotTime) }}
            </span>
            <span class="fetch-status" :class="{ 'status-success': item.fetchStatus === 1, 'status-manual': item.fetchStatus === 2, 'status-failed': item.fetchStatus === 0 }">
              {{ getFetchStatusText(item.fetchStatus) }}
            </span>
          </div>
        </div>
        <!-- 手动录入按钮 -->
        <div class="balance-card balance-card--add" @click="openManualInputDialog">
          <i class="el-icon-plus"></i>
          <span>手动录入余额</span>
        </div>
      </div>
    </div>

    <!-- 消耗汇总面板 -->
    <div class="summary-section">
      <h3 class="section-title">
        <i class="el-icon-data-analysis"></i>
        消耗汇总
      </h3>
      <div class="summary-grid" v-loading="summaryLoading">
        <div class="summary-card summary-card--token">
          <div class="summary-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
              <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="currentColor"/>
              <path d="M2 12L12 17L22 12V7L12 12L2 7V12Z" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          <div class="summary-card__content">
            <h4>Token 消耗</h4>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="label">总计</span>
                <span class="value">{{ formatLargeNumber(summary.totalTokens) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">输入</span>
                <span class="value">{{ formatLargeNumber(summary.inputTokens) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">输出</span>
                <span class="value">{{ formatLargeNumber(summary.outputTokens) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">请求次数</span>
                <span class="value">{{ formatNumber(summary.llmRequestCount) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="summary-card summary-card--transcription">
          <div class="summary-card__icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2S9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor" opacity="0.3"/>
              <path d="M17.3 11C17.3 14 14.76 16.1 12 16.1S6.7 14 6.7 11H5C5 14.41 7.72 17.23 11 17.72V21H13V17.72C16.28 17.23 19 14.41 19 11H17.3Z" fill="currentColor"/>
            </svg>
          </div>
          <div class="summary-card__content">
            <h4>转写时长消耗</h4>
            <div class="summary-stats">
              <div class="stat-item">
                <span class="label">总计</span>
                <span class="value">{{ formatDuration(summary.totalTranscriptionSeconds) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">文件转写</span>
                <span class="value">{{ formatDuration(summary.fileTranscriptionSeconds) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">实时转写</span>
                <span class="value">{{ formatDuration(summary.realtimeTranscriptionSeconds) }}</span>
              </div>
              <div class="stat-item">
                <span class="label">请求次数</span>
                <span class="value">{{ formatNumber(summary.asrRequestCount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <div class="charts-row">
        <!-- Token消耗趋势 -->
        <div class="chart-container">
          <h3 class="section-title">
            <i class="el-icon-data-line"></i>
            Token 消耗趋势
          </h3>
          <div class="chart-wrapper" v-loading="trendLoading">
            <token-trend-chart :chart-data="tokenTrendData" height="350px" />
          </div>
        </div>
        <!-- 平台消耗分布 -->
        <div class="chart-container">
          <h3 class="section-title">
            <i class="el-icon-pie-chart"></i>
            平台消耗分布
          </h3>
          <div class="chart-controls">
            <el-radio-group v-model="distributionMetricType" size="small" @change="loadDistribution">
              <el-radio-button label="token">Token</el-radio-button>
              <el-radio-button label="transcription">转写时长</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-wrapper" v-loading="distributionLoading">
            <platform-distribution-chart :chart-data="distributionData" height="300px" />
          </div>
        </div>
      </div>
    </div>

    <!-- 消耗明细列表 -->
    <div class="detail-section">
      <h3 class="section-title">
        <i class="el-icon-document"></i>
        消耗明细
      </h3>
      <el-table :data="costList" v-loading="listLoading" border style="width: 100%">
        <el-table-column prop="statHour" label="时间" min-width="160">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.statHour) }}
          </template>
        </el-table-column>
        <el-table-column prop="platformName" label="平台" min-width="140" />
        <el-table-column prop="platformType" label="类型" min-width="80" />
        <el-table-column prop="model" label="模型" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.model || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="country" label="国家" min-width="100">
          <template slot-scope="scope">
            {{ scope.row.country || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="inputTokens" label="输入Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.inputTokens) }}
          </template>
        </el-table-column>
        <el-table-column prop="outputTokens" label="输出Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.outputTokens) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalTokens" label="总Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.totalTokens) }}
          </template>
        </el-table-column>
        <el-table-column label="转写时长" min-width="120">
          <template slot-scope="scope">
            {{ formatDuration(scope.row.totalTranscriptionSeconds) }}
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        :auto-scroll="false"
        @pagination="loadCostList"
      />
    </div>

    <!-- 按日消耗明细列表 -->
    <div class="detail-section">
      <h3 class="section-title">
        <i class="el-icon-document"></i>
        按日消耗明细
      </h3>
      <el-table :data="costDailyList" v-loading="dailyListLoading" border style="width: 100%">
        <el-table-column prop="statDay" label="日期" min-width="120">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.statDay).substring(0, 10) }}
          </template>
        </el-table-column>
        <el-table-column prop="platformName" label="平台" min-width="140" />
        <el-table-column prop="platformType" label="类型" min-width="80" />
        <el-table-column prop="model" label="模型" min-width="120">
          <template slot-scope="scope">
            {{ scope.row.model || 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="country" label="国家" min-width="100">
          <template slot-scope="scope">
            {{ scope.row.country || '未知' }}
          </template>
        </el-table-column>
        <el-table-column prop="inputTokens" label="输入Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.inputTokens) }}
          </template>
        </el-table-column>
        <el-table-column prop="outputTokens" label="输出Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.outputTokens) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalTokens" label="总Token" min-width="120">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.totalTokens) }}
          </template>
        </el-table-column>
        <el-table-column label="转写时长" min-width="120">
          <template slot-scope="scope">
            {{ formatDuration(scope.row.totalTranscriptionSeconds) }}
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="dailyTotal > 0"
        :total="dailyTotal"
        :page.sync="dailyQueryParams.pageNum"
        :limit.sync="dailyQueryParams.pageSize"
        :auto-scroll="false"
        @pagination="loadCostDailyList"
      />
    </div>

    <!-- 手动录入余额弹窗 -->
    <el-dialog title="手动录入余额" :visible.sync="manualInputDialog.visible" width="500px" append-to-body>
      <el-form :model="manualInputDialog.form" :rules="manualInputRules" ref="manualInputForm" label-width="100px">
        <el-form-item label="平台" prop="platformCode">
          <el-select v-model="manualInputDialog.form.platformCode" placeholder="请选择平台" style="width: 100%">
            <el-option
              v-for="platform in platformList"
              :key="platform.platformCode"
              :label="platform.platformName"
              :value="platform.platformCode"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="余额" prop="balanceValue">
          <el-input-number v-model="manualInputDialog.form.balanceValue" :precision="2" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="单位" prop="balanceUnit">
          <el-select v-model="manualInputDialog.form.balanceUnit" placeholder="请选择单位" style="width: 100%">
            <el-option label="CNY (人民币)" value="CNY" />
            <el-option label="USD (美元)" value="USD" />
            <el-option label="Credits (积分)" value="credits" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="manualInputDialog.form.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="manualInputDialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitManualInput" :loading="manualInputDialog.loading">确定</el-button>
      </div>
    </el-dialog>

    <!-- 余额变动历史弹窗 -->
    <el-dialog :title="`${balanceHistoryDialog.platform ? balanceHistoryDialog.platform.platformName || balanceHistoryDialog.platform.platformCode : ''} - 余额变动历史`" :visible.sync="balanceHistoryDialog.visible" width="800px" append-to-body>
      <el-table :data="balanceHistoryDialog.list" v-loading="balanceHistoryDialog.loading" border style="width: 100%">
        <el-table-column prop="snapshotTime" label="时间" min-width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.snapshotTime) }}
          </template>
        </el-table-column>
        <el-table-column label="余额" min-width="140">
          <template slot-scope="scope">
            {{ getCurrencySymbol(scope.row.balanceUnit) }}{{ formatNumber(scope.row.balanceValue) }}
          </template>
        </el-table-column>
        <el-table-column label="变动金额" min-width="140">
          <template slot-scope="scope">
            <span :class="getChangeAmountClass(scope.$index, scope.row)">
              {{ formatChangeAmount(scope.$index, scope.row) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balanceUnit" label="单位" min-width="100" />
        <el-table-column prop="fetchStatus" label="来源" min-width="100">
          <template slot-scope="scope">
            {{ getFetchStatusText(scope.row.fetchStatus) }}
          </template>
        </el-table-column>
        <el-table-column prop="errorMessage" label="错误信息" min-width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            {{ scope.row.errorMessage || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <pagination
        v-show="balanceHistoryDialog.total > 0"
        :total="balanceHistoryDialog.total"
        :page.sync="balanceHistoryDialog.queryParams.pageNum"
        :limit.sync="balanceHistoryDialog.queryParams.pageSize"
        :auto-scroll="false"
        @pagination="handleHistoryPageChange"
      />
    </el-dialog>
  </div>
</template>

<script>
import {
  getPlatformList,
  getCostSummary,
  getPlatformBalance,
  getCostTrend,
  getCostDistribution,
  getCostList,
  getCostDailyList,
  manualInputBalance,
  getBalanceHistory
} from '@/api/statistics/cost'
import TokenTrendChart from './components/TokenTrendChart'
import PlatformDistributionChart from './components/PlatformDistributionChart'

export default {
  name: 'AiCostDashboard',
  components: {
    TokenTrendChart,
    PlatformDistributionChart
  },
  data() {
    return {
      loading: false,
      balanceLoading: false,
      summaryLoading: false,
      trendLoading: false,
      distributionLoading: false,
      listLoading: false,

      // 日期范围
      dateRangeType: 'month',
      dateRange: [],
      tempDateRange: [],
      dateOptions: [
        { value: 'month', label: '本月至今' },
        { value: 'today', label: '今日' },
        { value: 'last7days', label: '近7天' },
        { value: 'last30days', label: '近30天' },
        { value: 'custom', label: '自定义' }
      ],

      // 平台列表
      platformList: [],

      // 余额数据
      balanceList: [],

      // 余额历史弹窗
      balanceHistoryDialog: {
        visible: false,
        loading: false,
        platform: null,
        list: [],
        total: 0,
        queryParams: {
          pageNum: 1,
          pageSize: 10
        }
      },

      // 汇总数据
      summary: {
        totalTokens: 0,
        inputTokens: 0,
        outputTokens: 0,
        llmRequestCount: 0,
        totalTranscriptionSeconds: 0,
        fileTranscriptionSeconds: 0,
        realtimeTranscriptionSeconds: 0,
        asrRequestCount: 0
      },

      // 趋势数据
      tokenTrendData: {},

      // 分布数据
      distributionMetricType: 'token',
      distributionData: [],

      // 明细列表
      costList: [],
      total: 0,
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },

      // 按日明细列表
      costDailyList: [],
      dailyTotal: 0,
      dailyListLoading: false,
      dailyQueryParams: {
        pageNum: 1,
        pageSize: 10
      },

      // 手动录入弹窗
      manualInputDialog: {
        visible: false,
        loading: false,
        form: {
          platformCode: '',
          balanceValue: 0,
          balanceUnit: 'CNY',
          remark: ''
        }
      },
      manualInputRules: {
        platformCode: [{ required: true, message: '请选择平台', trigger: 'change' }],
        balanceValue: [{ required: true, message: '请输入余额', trigger: 'blur' }],
        balanceUnit: [{ required: true, message: '请选择单位', trigger: 'change' }]
      }
    }
  },
  created() {
    this.initDateRange()
    this.loadPlatformList()
    // 初次加载：余额（不受日期筛选影响）
    this.loadBalance()
    // 加载受日期筛选影响的数据
    this.refreshFilteredData()
  },
  methods: {
    // 初始化日期范围
    initDateRange() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      this.dateRange = [
        this.formatDate(new Date(year, month, 1)),
        this.formatDate(now)
      ]
    },

    // 处理日期范围类型变化
    handleDateRangeTypeChange(type) {
      this.dateRangeType = type
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      switch (type) {
        case 'month':
          // 本月至今
          this.dateRange = [this.formatDate(new Date(year, month, 1)), this.formatDate(now)]
          break
        case 'today':
          // 今日
          this.dateRange = [this.formatDate(now), this.formatDate(now)]
          break
        case 'last7days':
          // 近7天
          const last7 = new Date(now)
          last7.setDate(last7.getDate() - 6)
          this.dateRange = [this.formatDate(last7), this.formatDate(now)]
          break
        case 'last30days':
          // 近30天
          const last30 = new Date(now)
          last30.setDate(last30.getDate() - 29)
          this.dateRange = [this.formatDate(last30), this.formatDate(now)]
          break
        case 'custom':
          this.tempDateRange = [...this.dateRange]
          return
      }
      // 只刷新受日期筛选影响的数据
      this.refreshFilteredData()
    },

    // 应用自定义日期范围
    applyCustomDateRange() {
      if (this.tempDateRange && this.tempDateRange.length === 2) {
        this.dateRange = [...this.tempDateRange]
        // 只刷新受日期筛选影响的数据
        this.refreshFilteredData()
      }
    },

    // 加载平台列表
    async loadPlatformList() {
      try {
        const res = await getPlatformList({})
        this.platformList = res.data || []
      } catch (error) {
        console.error('加载平台列表失败', error)
      }
    },

    // 刷新所有数据（包括余额，用于手动刷新按钮）
    async refreshAllData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadBalance(),
          this.refreshFilteredData()
        ])
      } finally {
        this.loading = false
      }
    },

    // 刷新受日期筛选影响的数据
    async refreshFilteredData() {
      this.loading = true
      try {
        await Promise.all([
          this.loadSummary(),
          this.loadTrend(),
          this.loadDistribution(),
          this.loadCostList(),
          this.loadCostDailyList()
        ])
      } finally {
        this.loading = false
      }
    },

    // 加载余额数据
    async loadBalance() {
      this.balanceLoading = true
      try {
        const res = await getPlatformBalance()
        this.balanceList = res.data || []
      } catch (error) {
        console.error('加载余额失败', error)
      } finally {
        this.balanceLoading = false
      }
    },

    // 加载汇总数据
    async loadSummary() {
      this.summaryLoading = true
      try {
        const res = await getCostSummary(this.dateRange[0], this.dateRange[1], 'ALL')
        this.summary = res.data || this.summary
      } catch (error) {
        console.error('加载汇总失败', error)
      } finally {
        this.summaryLoading = false
      }
    },

    // 加载趋势数据
    async loadTrend() {
      this.trendLoading = true
      try {
        const res = await getCostTrend(this.dateRange[0], this.dateRange[1], 'day', null)
        this.tokenTrendData = res.data || {}
      } catch (error) {
        console.error('加载趋势失败', error)
      } finally {
        this.trendLoading = false
      }
    },

    // 加载分布数据
    async loadDistribution() {
      this.distributionLoading = true
      try {
        const res = await getCostDistribution(this.dateRange[0], this.dateRange[1], this.distributionMetricType)
        this.distributionData = res.data || []
      } catch (error) {
        console.error('加载分布失败', error)
      } finally {
        this.distributionLoading = false
      }
    },

    // 加载消耗列表
    async loadCostList() {
      this.listLoading = true
      try {
        const res = await getCostList({
          ...this.queryParams,
          startDate: this.dateRange[0],
          endDate: this.dateRange[1]
        })
        this.costList = res.rows || []
        this.total = res.total || 0
      } catch (error) {
        console.error('加载列表失败', error)
      } finally {
        this.listLoading = false
      }
    },

    // 加载按日消耗列表
    async loadCostDailyList() {
      this.dailyListLoading = true
      try {
        const res = await getCostDailyList({
          ...this.dailyQueryParams,
          startDate: this.dateRange[0],
          endDate: this.dateRange[1]
        })
        this.costDailyList = res.rows || []
        this.dailyTotal = res.total || 0
      } catch (error) {
        console.error('加载按日列表失败', error)
      } finally {
        this.dailyListLoading = false
      }
    },

    // 打开余额历史弹窗
    openBalanceHistoryDialog(item) {
      this.balanceHistoryDialog.visible = true
      this.balanceHistoryDialog.platform = item
      this.balanceHistoryDialog.queryParams.pageNum = 1
      this.balanceHistoryDialog.queryParams.pageSize = 10
      this.loadBalanceHistory()
    },

    // 加载余额历史记录
    async loadBalanceHistory() {
      if (!this.balanceHistoryDialog.platform) return
      this.balanceHistoryDialog.loading = true
      try {
        const res = await getBalanceHistory({
          platformCode: this.balanceHistoryDialog.platform.platformCode,
          pageNum: this.balanceHistoryDialog.queryParams.pageNum,
          pageSize: this.balanceHistoryDialog.queryParams.pageSize
        })
        this.balanceHistoryDialog.list = res.rows || []
        this.balanceHistoryDialog.total = res.total || 0
      } catch (error) {
        console.error('加载余额历史失败', error)
        this.$message.error('加载余额历史失败')
      } finally {
        this.balanceHistoryDialog.loading = false
      }
    },

    // 处理余额历史分页变化
    handleHistoryPageChange() {
      this.loadBalanceHistory()
    },

    // 打开手动录入弹窗
    openManualInputDialog() {
      this.manualInputDialog.visible = true
      this.manualInputDialog.form = {
        platformCode: '',
        balanceValue: 0,
        balanceUnit: 'CNY',
        remark: ''
      }
    },

    // 提交手动录入
    async submitManualInput() {
      this.$refs.manualInputForm.validate(async (valid) => {
        if (valid) {
          this.manualInputDialog.loading = true
          try {
            await manualInputBalance(this.manualInputDialog.form)
            this.$message.success('录入成功')
            this.manualInputDialog.visible = false
            this.loadBalance()
          } catch (error) {
            this.$message.error('录入失败')
          } finally {
            this.manualInputDialog.loading = false
          }
        }
      })
    },

    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    // 格式化日期时间
    formatDateTime(dateStr) {
      if (!dateStr) return '-'
      return dateStr.replace('T', ' ').substring(0, 19)
    },

    // 格式化时间
    formatTime(dateStr) {
      if (!dateStr) return '-'
      return dateStr.replace('T', ' ').substring(11, 16)
    },

    // 格式化数字
    formatNumber(num) {
      if (num === null || num === undefined) return '0'
      return Number(num).toLocaleString('zh-CN')
    },

    // 格式化大数字
    formatLargeNumber(num) {
      if (num === null || num === undefined) return '0'
      if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B'
      } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M'
      } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K'
      }
      return this.formatNumber(num)
    },

    // 格式化时长
    formatDuration(seconds) {
      if (!seconds || seconds === 0) return '0秒'
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60
      let result = ''
      if (hours > 0) result += `${hours}时`
      if (minutes > 0) result += `${minutes}分`
      if (secs > 0 || result === '') result += `${secs}秒`
      return result
    },

    // 获取货币符号
    getCurrencySymbol(unit) {
      if (!unit) return ''
      switch (unit.toUpperCase()) {
        case 'USD': return '$'
        case 'CNY': return '¥'
        default: return ''
      }
    },

    // 获取拉取状态文本
    getFetchStatusText(status) {
      switch (status) {
        case 0: return '失败'
        case 1: return '自动'
        case 2: return '手动'
        default: return '-'
      }
    },

    // 计算变动金额（显示当前行比下一行少多少，即消耗了多少）
    calculateChangeAmount(currentIndex, currentRow) {
      const list = this.balanceHistoryDialog.list
      if (!list || list.length === 0 || !currentRow) {
        return null
      }

      // 如果是最后一行，没有下一行，无法计算
      if (currentIndex === list.length - 1) {
        return null
      }

      const nextRow = list[currentIndex + 1]
      if (!nextRow) {
        return null
      }

      // 确保单位一致
      if (nextRow.balanceUnit !== currentRow.balanceUnit) {
        return null // 单位不一致，无法计算
      }

      const currentValue = parseFloat(currentRow.balanceValue) || 0
      const nextValue = parseFloat(nextRow.balanceValue) || 0
      
      // 计算消耗：下一行余额 - 当前行余额（正数表示消耗，负数表示充值）
      const changeAmount = nextValue - currentValue

      // 如果变动为0，返回null
      if (Math.abs(changeAmount) < 0.01) {
        return null
      }

      return {
        amount: changeAmount,
        unit: currentRow.balanceUnit
      }
    },

    // 格式化变动金额显示
    formatChangeAmount(index, row) {
      const change = this.calculateChangeAmount(index, row)
      if (change === null) {
        return '-'
      }

      const symbol = this.getCurrencySymbol(change.unit)
      const formattedAmount = this.formatNumber(Math.abs(change.amount))
      
      // change.amount > 0 表示消耗（下一行余额 > 当前行余额）
      // change.amount < 0 表示充值（下一行余额 < 当前行余额）
      if (change.amount > 0) {
        // 消耗，显示正数
        return `-${symbol}${formattedAmount}`
      } else {
        // 充值，显示负数（但实际是增加）
        return `+${symbol}${formattedAmount}`
      }
    },

    // 获取变动金额的样式类
    getChangeAmountClass(index, row) {
      const change = this.calculateChangeAmount(index, row)
      if (change === null) {
        return 'change-amount--neutral'
      }

      // change.amount > 0 表示消耗（余额下降），显示红色
      // change.amount < 0 表示充值（余额上升），显示绿色
      if (change.amount > 0) {
        return 'change-amount--decrease' // 消耗，红色
      } else {
        return 'change-amount--increase' // 充值，绿色
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.ai-cost-dashboard {
  padding: 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%);
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;

  // 添加微妙的背景装饰
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 200px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(103, 194, 58, 0.03) 100%);
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}

.page-header {
  margin-bottom: 32px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      width: 40px;
      height: 40px;
      color: #409eff;
      padding: 8px;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: -0.5px;
    }
  }

  .refresh-btn {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
    
    &:hover {
      transform: rotate(180deg) scale(1.1);
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
    }

    &:active {
      transform: rotate(180deg) scale(0.95);
    }
  }
}

.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin-bottom: 32px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  .date-quick-filters {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .date-chip {
    padding: 8px 20px;
    border: 1.5px solid #e2e8f0;
    border-radius: 24px;
    background: #ffffff;
    color: #64748b;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(64, 158, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.3s, height 0.3s;
    }

    &:hover {
      border-color: #409eff;
      color: #409eff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);

      &::before {
        width: 100px;
        height: 100px;
      }
    }

    &--active {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
      border-color: #409eff;
      color: #fff;
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
      transform: translateY(-2px);

      &:hover {
        box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
      }
    }
  }

  .custom-date-range {
    display: flex;
    align-items: center;
    gap: 12px;

    .apply-btn {
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }
  }

  .current-range-display {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
    border-radius: 8px;
    color: #409eff;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba(64, 158, 255, 0.2);
  }
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.3px;

  i {
    color: #409eff;
    font-size: 20px;
    padding: 6px;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &:hover i {
    transform: scale(1.1);
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(64, 158, 255, 0.1) 100%);
  }
}

.balance-section {
  margin-bottom: 32px;

  .balance-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
  }

  .balance-card {
    padding: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, transparent, currentColor, transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
      border-color: rgba(64, 158, 255, 0.3);

      &::before {
        opacity: 1;
      }
    }

    &--llm {
      border-left: 4px solid #409eff;
      color: #409eff;

      &::before {
        background: linear-gradient(90deg, transparent, #409eff, transparent);
      }
    }

    &--asr {
      border-left: 4px solid #67c23a;
      color: #67c23a;

      &::before {
        background: linear-gradient(90deg, transparent, #67c23a, transparent);
      }
    }

    &--add {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      cursor: pointer;
      border: 2px dashed #cbd5e1;
      background: linear-gradient(135deg, rgba(248, 250, 252, 0.5) 0%, rgba(241, 245, 249, 0.5) 100%);
      color: #94a3b8;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        border-color: #409eff;
        color: #409eff;
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.05) 0%, rgba(64, 158, 255, 0.02) 100%);
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
      }

      i {
        font-size: 32px;
        transition: transform 0.3s;
      }

      &:hover i {
        transform: rotate(90deg) scale(1.1);
      }
    }

    &__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;

      .platform-name {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }

      .platform-type {
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 4px;
        background: #f0f9ff;
        color: #409eff;
      }
    }

    &__value {
      margin-bottom: 16px;

      .currency-symbol {
        font-size: 18px;
        color: #94a3b8;
        margin-right: 6px;
        font-weight: 500;
      }

      .amount {
        font-size: 32px;
        font-weight: 800;
        background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        letter-spacing: -1px;
        line-height: 1.2;
      }
    }

    &__footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #909399;

      .fetch-status {
        padding: 2px 6px;
        border-radius: 4px;

        &.status-success {
          background: #f0f9eb;
          color: #67c23a;
        }

        &.status-manual {
          background: #fdf6ec;
          color: #e6a23c;
        }

        &.status-failed {
          background: #fef0f0;
          color: #f56c6c;
        }
      }
    }
  }
}

.summary-section {
  margin-bottom: 32px;

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
    gap: 24px;
  }

  .summary-card {
    display: flex;
    gap: 24px;
    padding: 28px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, currentColor, transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);

      &::before {
        opacity: 1;
      }
    }

    &--token {
      border-left: 4px solid #409eff;

      .summary-card__icon svg {
        color: #409eff;
      }
    }

    &--transcription {
      border-left: 4px solid #67c23a;

      .summary-card__icon svg {
        color: #67c23a;
      }
    }

    &__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 16px;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      flex-shrink: 0;

      svg {
        width: 36px;
        height: 36px;
        transition: transform 0.3s;
      }
    }

    &:hover &__icon {
      transform: scale(1.1);
      box-shadow: 0 4px 16px rgba(64, 158, 255, 0.2);

      svg {
        transform: scale(1.1);
      }
    }

    &--transcription:hover &__icon {
      box-shadow: 0 4px 16px rgba(103, 194, 58, 0.2);
    }

    &__content {
      flex: 1;

      h4 {
        margin: 0 0 20px;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
        letter-spacing: -0.3px;
      }

      .summary-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;

        .stat-item {
          padding: 12px;
          background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
          border-radius: 12px;
          border: 1px solid rgba(226, 232, 240, 0.6);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

          &:hover {
            background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(248, 250, 252, 1) 100%);
            border-color: rgba(64, 158, 255, 0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          }

          .label {
            display: block;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 6px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .value {
            font-size: 20px;
            font-weight: 700;
            color: #1e293b;
            letter-spacing: -0.5px;
          }
        }
      }
    }
  }
}

.charts-section {
  margin-bottom: 32px;

  .charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
    gap: 24px;
  }

  .chart-container {
    padding: 24px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      box-shadow: 0 8px 28px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }

    .chart-controls {
      margin-bottom: 20px;
      padding: 8px;
      background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
      border-radius: 12px;
      border: 1px solid rgba(226, 232, 240, 0.6);
    }

    .chart-wrapper {
      min-height: 320px;
      border-radius: 12px;
      overflow: hidden;
    }
  }
}

.detail-section {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  margin-bottom: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.06);
  }

  // 美化表格
  ::v-deep .el-table {
    border-radius: 12px;
    overflow: hidden;

    th {
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      color: #1e293b;
      font-weight: 600;
      border-bottom: 2px solid #e2e8f0;
    }

    td {
      border-bottom: 1px solid #f1f5f9;
    }

    tr {
      transition: all 0.2s;

      &:hover {
        background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(64, 158, 255, 0.01) 100%);
      }
    }
  }

  // 美化分页
  ::v-deep .pagination-container {
    margin-top: 20px;
    padding: 16px;
    background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
    border-radius: 12px;
    border: 1px solid rgba(226, 232, 240, 0.6);
  }
}

// 响应式设计
@media (max-width: 768px) {
  .ai-cost-dashboard {
    padding: 16px;
  }

  .page-header .header-content {
    padding: 16px;
  }

  .page-header .header-title h1 {
    font-size: 20px;
  }

  .filter-panel {
    padding: 16px;
  }

  .balance-grid {
    grid-template-columns: 1fr !important;
  }

  .summary-grid {
    grid-template-columns: 1fr !important;
  }

  .charts-row {
    grid-template-columns: 1fr !important;
  }
}

// 动画优化
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.balance-card,
.summary-card,
.chart-container,
.detail-section {
  animation: fadeInUp 0.5s ease-out;
}

// 加载状态优化
::v-deep .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 16px;
}

// 余额变动金额样式
.change-amount {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
  transition: all 0.2s;

  &--increase {
    color: #67c23a;
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(103, 194, 58, 0.05) 100%);
    border: 1px solid rgba(103, 194, 58, 0.2);
    
    &::before {
      content: '↑';
      font-size: 14px;
      font-weight: 700;
    }
  }

  &--decrease {
    color: #f56c6c;
    background: linear-gradient(135deg, rgba(245, 108, 108, 0.1) 0%, rgba(245, 108, 108, 0.05) 100%);
    border: 1px solid rgba(245, 108, 108, 0.2);
    
    &::before {
      content: '↓';
      font-size: 14px;
      font-weight: 700;
    }
  }

  &--neutral {
    color: #909399;
    font-weight: 500;
  }
}
</style>

