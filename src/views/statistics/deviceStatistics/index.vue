<template>
  <div class="device-statistics-container">
    <!-- 筛选条件面板 -->
    <div class="filter-panel">
      <div class="filter-row">
        <!-- 国家筛选 -->
        <div class="filter-group">
          <span class="filter-group__label">国家</span>
          <el-select
            v-model="selectedCountries"
            multiple
            collapse-tags
            placeholder="全部"
            size="small"
            class="filter-select"
            @change="handleCountryChange"
          >
            <el-option
              v-for="country in countryList"
              :key="country"
              :label="country"
              :value="country"
            />
          </el-select>
        </div>

        <!-- 设备型号筛选 -->
        <div class="filter-group">
          <span class="filter-group__label">设备</span>
          <el-select
            v-model="selectedProducts"
            multiple
            collapse-tags
            placeholder="全部"
            size="small"
            class="filter-select"
            @change="handleProductChange"
          >
            <el-option
              v-for="product in productOptions"
              :key="product"
              :label="product"
              :value="product"
            />
          </el-select>
        </div>

        <!-- 时间筛选 -->
        <div class="filter-group filter-group--right">
          <span class="filter-group__label">时间</span>
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
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <div
        v-for="card in statisticsCards"
        :key="card.type"
        class="stat-card"
        :class="{ 'stat-card--loading': card.loading }"
        @click="handleCardClick(card)"
      >
        <div class="stat-card__label">{{ card.label }}</div>
        <div class="stat-card__value">
          <span v-if="card.loading">加载中...</span>
          <span v-else>{{ card.value }}</span>
        </div>
      </div>
    </div>

    <!-- 中部统计卡片 -->
    <div class="middle-statistics">
      <!-- 绑定设备型号占比 -->
      <div class="stat-card-large" @click="handleModelCardClick">
        <div class="stat-card-large__header">
          <h3>绑定设备型号占比</h3>
        </div>
        <div class="stat-card-large__content stat-card-large__content--with-table">
          <div class="data-table-container">
            <el-table
              :data="modelTableData"
              style="width: 100%"
              :max-height="350"
              :border="false"
              :stripe="false"
              :fit="true"
            >
              <el-table-column width="20" align="left">
                <template slot-scope="scope">
                  <span
                    class="color-indicator"
                    :style="{ backgroundColor: getModelColor(scope.$index) }"
                  ></span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="设备型号" width="100" show-overflow-tooltip />
              <el-table-column prop="value" label="设备数" width="60" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatNumber(scope.row.value) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="proportion" label="占比" width="70" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatPercentage(scope.row.proportion) }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="chart-container" @click="handleChartLegendClick($event)">
            <pie-chart
              v-if="modelChartData.length > 0"
              :chart-data="modelChartData"
              :colors="modelColors"
              height="300px"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 绑定国家分布 -->
      <div class="stat-card-large">
        <div class="stat-card-large__header">
          <h3>绑定国家分布</h3>
        </div>
        <div class="stat-card-large__content stat-card-large__content--with-table">
          <div class="data-table-container">
            <el-table
              :data="countryTableData"
              style="width: 100%"
              :max-height="350"
              :border="false"
              :stripe="false"
              :fit="true"
            >
              <el-table-column width="20" align="left">
                <template slot-scope="scope">
                  <span
                    class="color-indicator"
                    :style="{ backgroundColor: getCountryColor(scope.$index) }"
                  ></span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="国家" width="100" show-overflow-tooltip />
              <el-table-column prop="value" label="设备数" width="60" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatNumber(scope.row.value) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="proportion" label="占比" width="70" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatPercentage(scope.row.proportion) }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="chart-container">
            <pie-chart
              v-if="countryChartData.length > 0"
              :chart-data="countryChartData"
              :colors="countryColors"
              height="300px"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 绑定设备平台分布 -->
      <div class="stat-card-large">
        <div class="stat-card-large__header">
          <h3>绑定设备平台分布</h3>
        </div>
        <div class="stat-card-large__content stat-card-large__content--with-table">
          <div class="data-table-container">
            <el-table
              :data="platformTableData"
              style="width: 100%"
              :max-height="350"
              :border="false"
              :stripe="false"
              :fit="true"
            >
              <el-table-column width="20" align="left">
                <template slot-scope="scope">
                  <span
                    class="color-indicator"
                    :style="{ backgroundColor: getPlatformColor(scope.$index) }"
                  ></span>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="平台" width="100" show-overflow-tooltip />
              <el-table-column prop="value" label="设备数" width="60" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatNumber(scope.row.value) }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="proportion" label="占比" width="70" align="right">
                <template slot-scope="scope">
                  <span style="white-space: nowrap;">{{ formatPercentage(scope.row.proportion) }}%</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="chart-container">
            <pie-chart
              v-if="platformChartData.length > 0"
              :chart-data="platformChartData"
              :colors="platformColors"
              height="300px"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 绑定设备趋势图 -->
      <div class="stat-card-large stat-card-large--full" @click="handleTrendCardClick">
        <div class="stat-card-large__header">
          <h3>绑定设备趋势图</h3>
        </div>
        <div class="stat-card-large__content">
          <div class="chart-container" @click="handleChartLegendClick($event, 'top')">
            <line-chart
              v-if="trendChartData.length > 0"
              :chart-data="trendChartData"
              height="400px"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="800px"
      append-to-body
    >
      <el-table
        :data="detailList"
        v-loading="detailLoading"
        stripe
        style="width: 100%"
        :max-height="400"
      >
        <el-table-column prop="rank" label="排名" width="80" align="center" />
        <el-table-column prop="country" label="国家" min-width="120" align="center" />
        <el-table-column prop="deviceCount" label="设备数量" min-width="150" align="right">
          <template slot-scope="scope">
            {{ formatNumber(scope.row.deviceCount) }}
          </template>
        </el-table-column>
        <el-table-column prop="proportion" label="占比" min-width="100" align="right">
          <template slot-scope="scope">
            {{ formatPercentage(scope.row.proportion) }}%
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 设备型号国家对比对话框 -->
    <el-dialog
      title="绑定设备型号国家分布"
      :visible.sync="modelCountryDialogVisible"
      width="1400px"
      append-to-body
    >
      <div v-loading="modelCountryLoading" class="model-country-container">
        <div
          v-for="(item, index) in modelCountryData"
          :key="index"
          class="model-country-item"
        >
          <h4 class="model-country-title">{{ item.productName }}</h4>
          <div class="model-country-content">
            <div class="data-table-container">
              <el-table
                :data="item.countryStatistics"
                style="width: 100%"
                :max-height="350"
                :border="false"
                :stripe="false"
                :fit="true"
              >
                <el-table-column width="20" align="left">
                  <template slot-scope="scope">
                    <span
                      class="color-indicator"
                      :style="{ backgroundColor: getCountryColor(scope.$index) }"
                    ></span>
                  </template>
                </el-table-column>
                <el-table-column prop="country" label="国家" width="100" show-overflow-tooltip />
                <el-table-column prop="deviceCount" label="设备数" width="60" align="right">
                  <template slot-scope="scope">
                    <span style="white-space: nowrap;">{{ formatNumber(scope.row.deviceCount) }}</span>
                  </template>
                </el-table-column>
                <el-table-column prop="proportion" label="占比" width="70" align="right">
                  <template slot-scope="scope">
                    <span style="white-space: nowrap;">{{ formatPercentage(scope.row.proportion) }}%</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="chart-container">
              <pie-chart
                v-if="item.countryStatistics && item.countryStatistics.length > 0"
                :chart-data="formatModelCountryChartData(item)"
                :colors="countryColors"
                height="300px"
              />
              <div v-else class="chart-placeholder">暂无数据</div>
            </div>
          </div>
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="modelCountryDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 趋势图国家对比对话框 -->
    <el-dialog
      title="绑定设备趋势图"
      :visible.sync="trendCountryDialogVisible"
      width="1400px"
      append-to-body
    >
      <div v-loading="trendCountryLoading" class="trend-charts-container">
        <div
          v-for="(product, index) in trendCountryData"
          :key="index"
          class="trend-chart-item"
        >
          <h4 class="trend-chart-title">{{ product.productName }}</h4>
          <div class="chart-container">
            <line-chart
              v-if="product && product.trendData && product.trendData.length > 0"
              :chart-data="formatTrendChartDataForProduct(product)"
              height="400px"
              :className="'trend-chart-' + index"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
        <div v-if="!trendCountryLoading && (!trendCountryData || trendCountryData.length === 0)" class="no-data-placeholder">
          暂无数据
        </div>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button @click="trendCountryDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 底部区域：活跃设备趋势图和明细列表 -->
    <div class="bottom-section">
      <!-- 活跃设备数趋势图 -->
      <div class="stat-card-large stat-card-large--full">
        <div class="stat-card-large__header">
          <h3>活跃设备数趋势</h3>
          <div class="period-selector">
            <span
              v-for="period in periodTypes"
              :key="period.value"
              :class="['period-item', { 'active': activePeriod === period.value }]"
              @click="handlePeriodChange(period.value)"
            >
              {{ period.label }}
            </span>
          </div>
        </div>
        <div class="stat-card-large__content">
          <div class="chart-container">
            <bar-chart
              v-if="activeTrendChartData.xAxis.length > 0"
              :chart-data="activeTrendChartData"
              height="400px"
            />
            <div v-else class="chart-placeholder">暂无数据</div>
          </div>
        </div>
      </div>

      <!-- 绑定设备明细列表 -->
      <div class="stat-card-large stat-card-large--full">
        <div class="stat-card-large__header">
          <h3>绑定设备明细</h3>
          <el-button type="primary" size="small" @click="handleExport">导出</el-button>
        </div>
        <div class="stat-card-large__content">
          <el-table
            v-loading="detailTableLoading"
            :data="detailTableData"
            stripe
            style="width: 100%"
            :max-height="500"
            border
          >
            <el-table-column prop="date" label="日期" width="120" align="center" />
            <el-table-column prop="country" label="国家" min-width="120" align="center" />
            <el-table-column prop="productName" label="设备型号" min-width="150" align="center" />
            <el-table-column prop="bindDeviceCount" label="绑定设备数" width="130" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.bindDeviceCount) }}
              </template>
            </el-table-column>
            <el-table-column prop="activeDeviceCount" label="活跃设备数" width="130" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.activeDeviceCount) }}
              </template>
            </el-table-column>
            <el-table-column prop="activeDeviceRate" label="活跃设备率" width="130" align="right">
              <template slot-scope="scope">
                {{ formatPercentage(scope.row.activeDeviceRate) }}%
              </template>
            </el-table-column>
          </el-table>
          <pagination
            v-show="detailTableTotal > 0"
            :total="detailTableTotal"
            :page.sync="detailTableQuery.pageNum"
            :limit.sync="detailTableQuery.pageSize"
            @pagination="loadDetailTable"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  getDeviceStatistics,
  getDeviceStatisticsByCountry,
  getDeviceModelStatistics,
  getDevicePlatformStatistics,
  getDeviceTrendStatistics,
  getDeviceModelCountryStatistics,
  getDeviceTrendByCountry,
  getDeviceDetailList,
  getActiveDeviceTrend
} from '@/api/statistics/deviceStatistics'
import PieChart from './components/PieChart'
import LineChart from './components/LineChart'
import BarChart from './components/BarChart'
import * as echarts from 'echarts'

export default {
  name: 'DeviceStatistics',
  components: {
    PieChart,
    LineChart,
    BarChart
  },
  data() {
    return {
      statisticsCards: [
        {
          type: 'yesterday',
          label: '昨日绑定设备',
          value: 0,
          loading: true
        },
        {
          type: 'current',
          label: '当前已绑定设备',
          value: 0,
          loading: true
        },
        {
          type: 'total',
          label: '累计绑定设备',
          value: 0,
          loading: true
        }
      ],
      // 图表数据
      modelChartData: [],
      countryChartData: [],
      platformChartData: [],
      trendChartData: [],
      // 表格数据
      modelTableData: [],
      countryTableData: [],
      platformTableData: [],
      // 颜色配置
      modelColors: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF', '#FF69B4', '#32CD32'],
      countryColors: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF', '#FF69B4', '#32CD32'],
      platformColors: ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF'],
      // 对话框
      dialogVisible: false,
      dialogTitle: '',
      detailList: [],
      detailLoading: false,
      currentType: null,
      // 设备型号国家对比
      modelCountryDialogVisible: false,
      modelCountryData: [],
      modelCountryLoading: false,
      // 趋势图国家对比
      trendCountryDialogVisible: false,
      trendCountryData: [],
      trendCountryLoading: false,
      trendChartInstances: {},
      // 底部区域
      periodTypes: [
        { label: '日', value: 'day' },
        { label: '周', value: 'week' },
        { label: '月', value: 'month' }
      ],
      activePeriod: 'month',
      activeTrendChartData: {
        xAxis: [],
        series: []
      },
      // 明细列表
      detailTableData: [],
      detailTableLoading: false,
      detailTableTotal: 0,
      detailTableQuery: {
        pageNum: 1,
        pageSize: 10
      },
      // 筛选条件
      dateRangeType: 'month', // 默认本月至今
      dateRange: [],
      tempDateRange: [],
      dateOptions: [
        { value: 'month', label: '本月至今' },
        { value: 'today', label: '今日' },
        { value: 'last7days', label: '近7天' },
        { value: 'last30days', label: '近30天' },
        { value: 'custom', label: '自定义区间' }
      ],
      selectedProducts: [], // 空数组表示全部
      selectedCountries: [], // 空数组表示全部
      productOptions: [], // 设备型号选项，从后端获取
      countryList: [] // 国家列表，从后端获取
    }
  },
  mounted() {
    this.initDateRange()
    this.loadProductOptions()
    this.loadCountryList()
    this.loadStatistics()
    this.loadMiddleStatistics()
    this.loadActiveTrend()
    this.loadDetailTable()
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
    // 格式化日期
    formatDate(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
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
          // 自定义区间，不自动设置，等待用户选择
          this.tempDateRange = this.dateRange.length === 2 ? [...this.dateRange] : []
          break
      }

      if (type !== 'custom') {
        this.refreshAllData()
      }
    },
    // 应用自定义日期范围
    applyCustomDateRange() {
      if (this.tempDateRange && this.tempDateRange.length === 2) {
        this.dateRange = [...this.tempDateRange]
        this.refreshAllData()
      }
    },
    // 处理设备选择变化
    handleProductChange() {
      this.refreshAllData()
    },
    // 处理国家选择变化
    handleCountryChange() {
      this.refreshAllData()
    },
    // 加载设备型号选项
    async loadProductOptions() {
      try {
        const res = await getDeviceModelStatistics({})
        if (res.code === 200 && res.data) {
          this.productOptions = res.data
            .map(item => item.productName)
            .filter(name => name && name !== '未知型号')
        }
      } catch (error) {
        console.error('加载设备型号列表失败:', error)
      }
    },
    // 加载国家列表
    async loadCountryList() {
      try {
        // 从国家统计接口获取国家列表
        const res = await getDeviceStatisticsByCountry('current', {})
        if (res.code === 200 && res.data) {
          this.countryList = res.data.map(item => item.country).filter(country => country && country !== '未知')
        }
      } catch (error) {
        console.error('加载国家列表失败:', error)
      }
    },
    // 获取筛选条件
    getFilterParams() {
      const filter = {}
      if (this.dateRange[0]) {
        filter.startDate = this.dateRange[0]
      }
      if (this.dateRange[1]) {
        filter.endDate = this.dateRange[1]
      }
      if (this.selectedProducts.length > 0) {
        filter.productNames = this.selectedProducts
      }
      if (this.selectedCountries.length > 0) {
        filter.countries = this.selectedCountries
      }
      return filter
    },
    // 刷新所有数据
    refreshAllData() {
      this.loadStatistics()
      this.loadMiddleStatistics()
      this.loadActiveTrend()
      this.loadDetailTable()
    },
    // 加载顶部统计数据
    async loadStatistics() {
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceStatistics(filter)
        if (res.code === 200) {
          const data = res.data
          this.statisticsCards[0].value = data.yesterdayBindCount || 0
          this.statisticsCards[0].loading = false
          this.statisticsCards[1].value = data.currentBindCount || 0
          this.statisticsCards[1].loading = false
          this.statisticsCards[2].value = data.totalBindCount || 0
          this.statisticsCards[2].loading = false
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
        this.statisticsCards.forEach(card => {
          card.loading = false
        })
      }
    },
    // 加载中部统计数据
    async loadMiddleStatistics() {
      await Promise.all([
        this.loadModelStatistics(),
        this.loadCountryStatistics(),
        this.loadPlatformStatistics(),
        this.loadTrendStatistics()
      ])
    },
    // 加载设备型号统计
    async loadModelStatistics() {
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceModelStatistics(filter)
        if (res.code === 200 && res.data) {
          this.modelChartData = res.data.map(item => ({
            name: item.productName || '未知型号',
            value: item.deviceCount || 0,
            proportion: item.proportion || 0
          }))
          this.modelTableData = this.modelChartData
        }
      } catch (error) {
        console.error('加载设备型号统计失败:', error)
      }
    },
    // 加载国家统计（使用当前已绑定数据）
    async loadCountryStatistics() {
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceStatisticsByCountry('current', filter)
        if (res.code === 200 && res.data) {
          this.countryChartData = res.data.map(item => ({
            name: item.country || '未知',
            value: item.deviceCount || 0,
            proportion: item.proportion || 0
          }))
          this.countryTableData = this.countryChartData
        }
      } catch (error) {
        console.error('加载国家统计失败:', error)
      }
    },
    // 加载平台统计
    async loadPlatformStatistics() {
      try {
        const filter = this.getFilterParams()
        const res = await getDevicePlatformStatistics(filter)
        if (res.code === 200 && res.data) {
          this.platformChartData = res.data.map(item => ({
            name: this.formatPlatformName(item.platform || '未知'),
            value: item.deviceCount || 0,
            proportion: item.proportion || 0
          }))
          this.platformTableData = this.platformChartData
        }
      } catch (error) {
        console.error('加载平台统计失败:', error)
      }
    },
    // 加载趋势统计
    async loadTrendStatistics() {
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceTrendStatistics(filter)
        if (res.code === 200 && res.data) {
          this.trendChartData = res.data || []
        }
      } catch (error) {
        console.error('加载趋势统计失败:', error)
      }
    },
    // 格式化平台名称
    formatPlatformName(platform) {
      const platformMap = {
        'ios': 'iOS',
        'android': 'Android',
        'web': 'Web',
        '小程序': '小程序'
      }
      return platformMap[platform] || platform
    },
    // 处理卡片点击
            async handleCardClick(card) {
              this.currentType = card.type
              this.dialogTitle = card.label + ' - 国家分布'
              this.dialogVisible = true
              this.detailList = []
              this.detailLoading = true

              try {
                const filter = this.getFilterParams()
                const res = await getDeviceStatisticsByCountry(card.type, filter)
                if (res && res.code === 200) {
          this.detailList = res.data || []
        }
      } catch (error) {
        console.error('加载详情数据失败:', error)
        this.$message.error('加载详情数据失败')
      } finally {
        this.detailLoading = false
      }
    },
    // 格式化数字
    formatNumber(num) {
      if (num == null) return '0'
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    },
    // 格式化百分比
    formatPercentage(num) {
      if (num == null) return '0.00'
      return parseFloat(num).toFixed(2)
    },
    // 检测是否点击了图例区域，阻止冒泡
    // legendPosition: 'right' 表示图例在右侧（饼状图）, 'top' 表示图例在顶部（折线图）
    handleChartLegendClick(event, legendPosition = 'right') {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const width = rect.width
      const height = rect.height
      
      let isLegendArea = false
      
      if (legendPosition === 'right') {
        // 饼状图：图例在右侧 55% 之后的区域
        isLegendArea = x > width * 0.55
      } else if (legendPosition === 'top') {
        // 折线图：图例在顶部 50px 以内的区域
        isLegendArea = y < 50
      }
      
      if (isLegendArea) {
        event.stopPropagation()
      }
    },
    // 处理设备型号卡片点击
    async handleModelCardClick() {
      this.modelCountryDialogVisible = true
      this.modelCountryData = []
      this.modelCountryLoading = true
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceModelCountryStatistics(filter)
        if (res.code === 200 && res.data) {
          this.modelCountryData = res.data || []
        }
      } catch (error) {
        console.error('加载设备型号国家统计失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.modelCountryLoading = false
      }
    },
    // 获取国家颜色
    getCountryColor(index) {
      return this.countryColors[index % this.countryColors.length]
    },
    // 获取平台颜色
    getPlatformColor(index) {
      return this.platformColors[index % this.platformColors.length]
    },
    // 获取设备型号颜色
    getModelColor(index) {
      return this.modelColors[index % this.modelColors.length]
    },
    // 格式化设备型号国家图表数据
    formatModelCountryChartData(item) {
      if (!item || !item.countryStatistics || item.countryStatistics.length === 0) {
        return []
      }
      return item.countryStatistics.map(country => ({
        name: country.country || '未知',
        value: country.deviceCount || 0,
        proportion: country.proportion || 0
      }))
    },
    // 处理趋势图卡片点击
    async handleTrendCardClick() {
      this.trendCountryDialogVisible = true
      this.trendCountryData = []
      this.trendCountryLoading = true
      try {
        const filter = this.getFilterParams()
        const res = await getDeviceTrendByCountry(filter)
        if (res.code === 200 && res.data) {
          this.trendCountryData = res.data || []
        }
      } catch (error) {
        console.error('加载趋势国家统计失败:', error)
        this.$message.error('加载数据失败')
      } finally {
        this.trendCountryLoading = false
      }
    },
    // 格式化趋势图数据（用于主趋势图）
    formatMainTrendChartData(rawData) {
      if (!rawData || rawData.length === 0) {
        return { xAxis: [], series: [] }
      }

      const dates = [...new Set(rawData.map(item => item.date))].sort()
      const allProductNames = new Set()
      rawData.forEach(item => {
        if (item.productCounts) {
          Object.keys(item.productCounts).forEach(name => allProductNames.add(name))
        }
      })
      const productList = Array.from(allProductNames)

      const series = []

      // 合计系列
      const totalData = dates.map(date => {
        const item = rawData.find(d => d.date === date)
        return item ? (item.totalCount || 0) : 0
      })
      series.push({
        name: '合计',
        type: 'line',
        smooth: true,
        data: totalData,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      })

      // 各产品型号系列
      const productColors = ['#67C23A', '#E6A23C', '#F56C6C', '#909399', '#00BFFF']
      productList.forEach((productName, index) => {
        const productData = dates.map(date => {
          const item = rawData.find(d => d.date === date)
          if (item && item.productCounts) {
            return item.productCounts[productName] || 0
          }
          return 0
        })
        series.push({
          name: productName,
          type: 'line',
          smooth: true,
          data: productData,
          itemStyle: {
            color: productColors[index % productColors.length]
          },
          lineStyle: {
            color: productColors[index % productColors.length],
            width: 2
          }
        })
      })

      return {
        xAxis: dates,
        series: series
      }
    },
    // 格式化趋势图数据（用于趋势图国家对比弹窗中的每个产品图表）
    formatTrendChartDataForProduct(productItem) {
      if (!productItem || !productItem.trendData || productItem.trendData.length === 0) {
        return { xAxis: [], series: [] }
      }

      const dates = [...new Set(productItem.trendData.map(item => item.date))].sort()
      const allCountries = new Set()
      productItem.trendData.forEach(item => {
        if (item.countryCounts) {
          Object.keys(item.countryCounts).forEach(countryName => allCountries.add(countryName))
        }
      })
      const countryList = Array.from(allCountries)

      const series = []

      // 合计系列
      const totalData = dates.map(date => {
        const item = productItem.trendData.find(d => d.date === date)
        return item ? (item.totalCount || 0) : 0
      })
      series.push({
        name: '合计',
        type: 'line',
        smooth: true,
        data: totalData,
        itemStyle: {
          color: '#409EFF'
        },
        lineStyle: {
          color: '#409EFF',
          width: 2
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      })

      // 各国家系列
      countryList.forEach((countryName, index) => {
        const countryData = dates.map(date => {
          const item = productItem.trendData.find(d => d.date === date)
          if (item && item.countryCounts) {
            return item.countryCounts[countryName] || 0
          }
          return 0
        })
        series.push({
          name: countryName,
          type: 'line',
          smooth: true,
          data: countryData,
          itemStyle: {
            color: this.countryColors[index % this.countryColors.length]
          },
          lineStyle: {
            color: this.countryColors[index % this.countryColors.length],
            width: 2
          }
        })
      })

      return {
        xAxis: dates,
        series: series
      }
    },
    // 加载活跃设备趋势
    async loadActiveTrend() {
      try {
        const res = await getActiveDeviceTrend(this.activePeriod)
        if (res.code === 200 && res.data) {
          const data = res.data || []
          this.activeTrendChartData = {
            xAxis: data.map(item => item.date),
            series: [{
              name: '活跃设备数',
              data: data.map(item => item.activeDeviceCount),
              color: '#409EFF'
            }]
          }
        }
      } catch (error) {
        console.error('加载活跃设备趋势失败:', error)
      }
    },
    // 切换周期类型
    handlePeriodChange(period) {
      this.activePeriod = period
      this.loadActiveTrend()
    },
    // 加载明细列表
    async loadDetailTable() {
      this.detailTableLoading = true
      try {
        const filter = this.getFilterParams()
        const query = {
          ...this.detailTableQuery,
          ...filter
        }
        const res = await getDeviceDetailList(query)
        if (res.code === 200) {
          this.detailTableData = res.rows || []
          this.detailTableTotal = res.total || 0
        }
      } catch (error) {
        console.error('加载明细列表失败:', error)
        this.$message.error('加载明细列表失败')
      } finally {
        this.detailTableLoading = false
      }
    },
    // 导出明细
    handleExport() {
      this.$message.info('导出功能开发中...')
    }
  }
}
</script>

<style scoped lang="scss">
.device-statistics-container {
  padding: 24px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
  min-height: calc(100vh - 84px);
  position: relative;

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
  margin-bottom: 24px;

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
      font-size: 28px;
      color: #409eff;
      padding: 8px;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(64, 158, 255, 0.05) 100%);
      border-radius: 12px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    h1 {
      margin: 0;
      font-size: 26px;
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
  }
}

/* 筛选条件面板 */
.filter-panel {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 20px 24px;
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
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  width: 100%;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-group--right {
  margin-left: auto;
}

.filter-group__label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  white-space: nowrap;
}

.filter-select {
  width: 160px;
}

.date-quick-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.date-chip {
  padding: 8px 18px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  background: #ffffff;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  &:hover {
    border-color: #409eff;
    color: #409eff;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  }
}

.date-chip--active {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  border-color: #409eff;
  color: #fff;
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
  transform: translateY(-2px);
}

.custom-date-range {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-left: 8px;

  .apply-btn {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }
  }
}

.date-picker {
  width: 280px;
}

.statistics-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
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
}

.stat-card--loading {
  opacity: 0.6;
}

.stat-card__label {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
  font-weight: 500;
}

.stat-card__value {
  font-size: 36px;
  font-weight: 700;
  color: #1e293b;
  text-align: right;
  letter-spacing: -0.5px;
}

.dialog-footer {
  text-align: center;
}

/* 中部统计卡片 */
.middle-statistics {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-bottom: 24px;
}

.stat-card-large {
  padding: 24px;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #409eff, #66b1ff);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
    border-color: rgba(64, 158, 255, 0.3);

    &::before {
      opacity: 1;
    }
  }
}

.stat-card-large--full {
  grid-column: 1 / -1;
}

.stat-card-large__header {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-card-large__header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  letter-spacing: -0.3px;
}

.stat-card-large__content {
  position: relative;
}

.stat-card-large__content--with-table {
  display: flex;
  gap: 25px;
  align-items: flex-start;
  padding-top: 10px;
}

.data-table-container {
  flex: 0 0 250px;
  min-width: 0;
  max-width: 250px;
  overflow: hidden;
}

.data-table-container .el-table {
  font-size: 13px;
  background: transparent;
  width: 100% !important;
  table-layout: fixed !important;
  border-radius: 8px;
}

.data-table-container .el-table__header-wrapper,
.data-table-container .el-table__body-wrapper {
  width: 100% !important;
}

.data-table-container .el-table td {
  border: none;
  padding: 12px 3px;
  background: transparent !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
  word-break: keep-all;
}

.data-table-container .el-table td .el-table__cell {
  white-space: nowrap !important;
}

.data-table-container .el-table .el-table__body-wrapper {
  overflow-x: hidden !important;
  overflow-y: auto;
}

.data-table-container .el-table .el-table__body {
  width: 100% !important;
}

.data-table-container .el-table th {
  padding: 8px 3px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  font-weight: 600;
  color: #475569;
  font-size: 13px;
  border: none;
}

.data-table-container .el-table tr {
  background: transparent !important;
  transition: all 0.2s;
}

.data-table-container .el-table tr:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(64, 158, 255, 0.01) 100%) !important;
}

.data-table-container .el-table::before {
  display: none;
}

.chart-container {
  flex: 1;
  min-width: 0;
  min-height: 300px;
  border-radius: 12px;
  overflow: hidden;
}

.color-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border-radius: 4px;
  vertical-align: middle;
  margin-right: 5px;
}

.chart-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #94a3b8;
  font-size: 14px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  border-radius: 12px;
}

/* 设备型号国家分布容器 */
.model-country-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 10px 0;
}

.model-country-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(226, 232, 240, 0.6);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.model-country-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 15px 0;
  text-align: left;
  padding-left: 5px;
  letter-spacing: -0.3px;
}

.model-country-content {
  display: flex;
  gap: 25px;
  align-items: flex-start;
}

.model-country-content .data-table-container {
  flex: 0 0 250px;
  min-width: 0;
  max-width: 250px;
  overflow: hidden;
}

.model-country-content .data-table-container .el-table {
  font-size: 13px;
  background: transparent;
  width: 100% !important;
  table-layout: fixed !important;
}

.model-country-content .data-table-container .el-table__header-wrapper,
.model-country-content .data-table-container .el-table__body-wrapper {
  width: 100% !important;
}

.model-country-content .data-table-container .el-table .el-table__body-wrapper {
  overflow-x: hidden !important;
  overflow-y: auto;
}

.model-country-content .data-table-container .el-table td {
  border: none;
  padding: 12px 3px;
  background: transparent !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap !important;
  word-break: keep-all;
}

.model-country-content .data-table-container .el-table th {
  padding: 8px 3px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%) !important;
  font-weight: 600;
  color: #475569;
  font-size: 13px;
  border: none;
}

.model-country-content .data-table-container .el-table tr {
  background: transparent !important;
  transition: all 0.2s;
}

.model-country-content .data-table-container .el-table tr:hover {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.03) 0%, rgba(64, 158, 255, 0.01) 100%) !important;
}

.model-country-content .data-table-container .el-table::before {
  display: none;
}

.model-country-content .chart-container {
  flex: 1;
  min-width: 0;
}

/* 趋势图容器 */
.trend-charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  padding: 20px 0;
}

.trend-chart-item {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
}

.trend-chart-item .chart-container {
  min-height: 400px;
  border-radius: 8px;
  overflow: hidden;
}

.trend-chart-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 15px 0;
  text-align: center;
  letter-spacing: -0.3px;
}

.no-data-placeholder {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-size: 14px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  border-radius: 12px;
}

/* 底部区域 */
.bottom-section {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.period-selector {
  display: flex;
  gap: 10px;
}

.period-item {
  padding: 6px 16px;
  cursor: pointer;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.period-item:hover {
  background-color: rgba(64, 158, 255, 0.05);
  color: #409eff;
}

.period-item.active {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

/* 美化表格 */
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

/* 美化分页 */
::v-deep .pagination-container {
  margin-top: 20px;
  padding: 16px;
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
  border-radius: 12px;
  border: 1px solid rgba(226, 232, 240, 0.6);
}

/* 美化弹窗 */
::v-deep .el-dialog {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);

  .el-dialog__header {
    padding: 20px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-bottom: 1px solid #e2e8f0;

    .el-dialog__title {
      font-weight: 700;
      color: #1e293b;
      font-size: 18px;
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: #ffffff;
  }

  .el-dialog__footer {
    padding: 16px 24px;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    border-top: 1px solid #e2e8f0;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-statistics-container {
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

  .statistics-cards {
    grid-template-columns: 1fr;
  }

  .middle-statistics {
    grid-template-columns: 1fr;
  }

  .stat-card-large--full {
    grid-column: 1;
  }

  .trend-charts-container {
    grid-template-columns: 1fr;
  }

  .model-country-container {
    grid-template-columns: 1fr;
  }

  .bottom-section {
    grid-template-columns: 1fr;
  }

  .stat-card-large__content--with-table {
    flex-direction: column;
  }

  .model-country-content {
    flex-direction: column;
  }
}

/* 动画优化 */
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

.stat-card,
.stat-card-large {
  animation: fadeInUp 0.5s ease-out;
}

/* 加载状态优化 */
::v-deep .el-loading-mask {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border-radius: 16px;
}
</style>
