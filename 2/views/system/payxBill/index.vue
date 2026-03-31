<template>
  <div class="admin-page-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="120px" class="admin-search-form">
      <el-form-item label="账单流水号" prop="billNo">
        <el-input
          v-model="queryParams.billNo"
          placeholder="请输入账单流水号"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单ID" prop="orderId">
        <el-input
          v-model="queryParams.orderId"
          placeholder="请输入订单ID"
          clearable
          style="width: 180px"
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
      <el-form-item label="用户账号" prop="userAccount">
        <el-input
          v-model="queryParams.userAccount"
          placeholder="请输入手机号或邮箱"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="交易类型" prop="txnType">
        <el-select v-model="queryParams.txnType" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="新购" :value="0" />
          <el-option label="续费" :value="1" />
          <el-option label="退款" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="收支类型" prop="incomeType">
        <el-select v-model="queryParams.incomeType" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="收入" :value="0" />
          <el-option label="支出" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="币种" prop="currency">
        <el-input
          v-model="queryParams.currency"
          placeholder="请输入币种"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="支付方式" prop="payType">
        <el-select v-model="queryParams.payType" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="Alipay" :value="1" />
          <el-option label="Google" :value="3" />
          <el-option label="Apple" :value="2" />
          <el-option label="Stripe" :value="4" />
          <el-option label="微信" :value="0" />
          <el-option label="其他" :value="5" />
        </el-select>
      </el-form-item>
      <el-form-item label="第三方交易单号" prop="platformTxnId">
        <el-input
          v-model="queryParams.platformTxnId"
          placeholder="请输入第三方交易单号"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="Web" :value="2" />
          <el-option label="Android" :value="1" />
          <el-option label="iOS" :value="0" />
        </el-select>
      </el-form-item>
      <el-form-item label="权益流水号" prop="interestId">
        <el-input
          v-model="queryParams.interestId"
          placeholder="请输入权益流水号"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="商品" prop="productName">
        <el-select v-model="queryParams.productName" placeholder="全部" clearable style="width: 180px" filterable>
          <el-option label="全部" value="" />
          <el-option
            v-for="product in productNameOptions"
            :key="product.value"
            :label="product.label"
            :value="product.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="账单状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="支付成功" :value="1" />
          <el-option label="已关闭" :value="3" />
          <el-option label="退款成功" :value="2" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付时间" prop="payDateRange">
        <el-date-picker
          v-model="payDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handlePayDateRangeChange"
        />
      </el-form-item>
      <el-form-item label="创建时间" prop="createTimeRange">
        <el-date-picker
          v-model="createTimeRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
          size="small"
          style="width: 240px"
          @change="handleCreateTimeRangeChange"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="admin-toolbar">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:payxBill:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="billList"
        @cell-dblclick="handleCellDblClick"
        border
        stripe
        class="admin-table"
        :max-height="tableMaxHeight"
      style="width: 100%"
    >
      <el-table-column label="账单流水号" align="center" prop="billNo" width="180" fixed="left" show-overflow-tooltip />
      <el-table-column label="订单ID" align="center" prop="orderId" width="180" show-overflow-tooltip />
      <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
      <el-table-column label="用户账号" align="center" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.phonenumber">{{ scope.row.phonenumber }}</span>
          <span v-else-if="scope.row.email">{{ scope.row.email }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="商品" align="center" prop="productName" width="150" show-overflow-tooltip />
      <el-table-column label="交易类型" align="center" prop="txnType" width="100">
        <template slot-scope="scope">
          <el-tag :type="getTxnTypeTagType(scope.row.txnType)" size="small">
            {{ getTxnTypeName(scope.row.txnType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="收支类型" align="center" prop="incomeType" width="100">
        <template slot-scope="scope">
          <el-tag :type="scope.row.incomeType === 0 ? 'success' : 'danger'" size="small">
            {{ scope.row.incomeType === 0 ? '收入' : '支出' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付金额" align="right" prop="amtPaid" width="100">
        <template slot-scope="scope">
          <span class="amt-paid">{{ formatMoney(scope.row.amtPaid, scope.row.currency) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="原价" align="right" prop="amt" width="100">
        <template slot-scope="scope">
          <span>{{ formatMoney(scope.row.amt, scope.row.currency) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="优惠金额" align="right" prop="amtDiscount" width="100">
        <template slot-scope="scope">
          <span class="amt-discount">{{ formatMoney(scope.row.amtDiscount, scope.row.currency) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="币种" align="center" prop="currency" width="70">
        <template slot-scope="scope">
          {{ (scope.row.currency || '').toUpperCase() }}
        </template>
      </el-table-column>
      <el-table-column label="支付方式" align="center" prop="payType" width="100">
        <template slot-scope="scope">
          <el-tag :type="getPayTypeTagType(scope.row.payType)" size="small">
            {{ getPayTypeName(scope.row.payType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform" width="90">
        <template slot-scope="scope">
          <el-tag :type="getPlatformType(scope.row.platform)" size="small" effect="plain">
            {{ formatPlatform(scope.row.platform) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="第三方交易单号" align="center" prop="platformTxnId" width="220" show-overflow-tooltip />
      <el-table-column label="权益流水号" align="center" prop="interestId" width="180" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.interestId || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="账单状态" align="center" prop="status" width="100">
        <template slot-scope="scope">
          <el-tag :type="getStatusTagType(scope.row.status)" size="small">
            {{ getBillStatusName(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="支付时间" align="center" prop="paidAt" width="160">
        <template slot-scope="scope">
          <span v-if="scope.row.paidAt">
            {{ parseTime(scope.row.paidAt, '{y}-{m}-{d} {h}:{i}:{s}') }}
          </span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="80" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-view"
            @click="handleDetail(scope.row)"
            v-hasPermi="['system:payxBill:query']"
          >详情</el-button>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <div class="admin-pagination-wrapper">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 账单详情对话框 -->
    <el-dialog title="账单详情" :visible.sync="detailOpen" width="1200px" append-to-body custom-class="admin-dialog">
      <el-descriptions :column="3" border size="medium">
        <el-descriptions-item label="账单流水号" :span="3">{{ detailForm.billNo }}</el-descriptions-item>
        <el-descriptions-item label="订单ID">{{ detailForm.orderId }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailForm.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户账号">
          <span v-if="detailForm.phonenumber">{{ detailForm.phonenumber }}</span>
          <span v-else-if="detailForm.email">{{ detailForm.email }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="交易类型">
          <el-tag :type="getTxnTypeTagType(detailForm.txnType)" size="small">
            {{ getTxnTypeName(detailForm.txnType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="收支类型">
          <el-tag :type="detailForm.incomeType === 0 ? 'success' : 'danger'" size="small">
            {{ detailForm.incomeType === 0 ? '收入' : '支出' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付金额">{{ formatMoney(detailForm.amtPaid, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="原价">{{ formatMoney(detailForm.amt, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">{{ formatMoney(detailForm.amtDiscount, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ (detailForm.currency || '').toUpperCase() }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag :type="getPayTypeTagType(detailForm.payType)" size="small">
            {{ getPayTypeName(detailForm.payType) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台">
          <el-tag :type="getPlatformType(detailForm.platform)" size="small" effect="plain">
            {{ formatPlatform(detailForm.platform) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="第三方交易单号" :span="3">{{ detailForm.platformTxnId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="权益流水号" :span="3">{{ detailForm.interestId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="商品" :span="3">{{ detailForm.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账单状态">
          <el-tag :type="getStatusTagType(detailForm.status)" size="small">
            {{ getBillStatusName(detailForm.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="支付时间">
          {{ detailForm.paidAt ? parseTime(detailForm.paidAt) : '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ detailForm.createBy || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ parseTime(detailForm.updateTime) }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listPayxBill, getPayxBill } from "@/api/system/payxBill";
import { formatMoney as formatMoneyUtil } from "@/utils/payConstants";
import { addDateRange } from "@/utils/ruoyi";

export default {
  name: "PayxBill",
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
      // 账单表格数据
      billList: [],
      // 详情弹窗
      detailOpen: false,
      // 详情表单
      detailForm: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        orderId: null,
        userId: null,
        userAccount: null,
        productName: null,
        txnType: null,
        incomeType: null,
        currency: null,
        payType: null,
        platformTxnId: null,
        platform: null,
        interestId: null,
        status: null
      },
      // 时间范围选择器
      payDateRange: [], // 支付时间范围
      createTimeRange: [], // 创建时间范围
      // 产品名称选项（固定列表）
      productNameOptions: [
        { label: '专业版包年会员', value: 'wm_year_pro' },
        { label: '专业版包月会员', value: 'wm_month_pro' },
        { label: '大师版包月会员', value: 'wm_month_ultimate' },
        { label: '大师版包年会员', value: 'wm_year_ultimate' },
        { label: '120分钟转写时长', value: 'wm_transcription_120' },
        { label: '600分钟转写时长', value: 'wm_transcription_600' },
        { label: '3000分钟转写时长', value: 'wm_transcription_3000' },
        { label: '6000分钟转写时长', value: 'wm_transcription_6000' }
      ]
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
    /** 查询账单列表 */
    getList() {
      this.loading = true;
      // 处理时间范围参数 - 使用 addDateRange 方法将参数放入 params 对象
      const params = { ...this.queryParams };
      addDateRange(params, this.payDateRange, 'PaidAt');
      addDateRange(params, this.createTimeRange, 'Time');
      listPayxBill(params).then(response => {
        this.billList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 支付时间范围变化 */
    handlePayDateRangeChange(val) {
      this.payDateRange = val || [];
    },
    /** 创建时间范围变化 */
    handleCreateTimeRangeChange(val) {
      this.createTimeRange = val || [];
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
        billNo: null,
        orderId: null,
        userId: null,
        userAccount: null,
        productName: null,
        txnType: null,
        incomeType: null,
        currency: null,
        payType: null,
        platformTxnId: null,
        platform: null,
        interestId: null,
        status: null
      };
      this.payDateRange = [];
      this.createTimeRange = [];
      this.handleQuery();
    },
    /** 查看详情 */
    handleDetail(row) {
      getPayxBill(row.billNo).then(response => {
        this.detailForm = response.data;
        this.detailOpen = true;
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/payxBill/export', {
        ...this.queryParams
      }, `payxBill_${new Date().getTime()}.xlsx`);
    },
    /** 格式化金额 */
    formatMoney(amount, currency) {
      // 使用通用的货币格式化函数
      return formatMoneyUtil(amount, currency);
    },
    /** 获取交易类型名称 */
    getTxnTypeName(txnType) {
      const map = { 0: '新购', 1: '续费', 2: '退款' };
      return map[txnType] || '-';
    },
    /** 获取交易类型标签类型 */
    getTxnTypeTagType(txnType) {
      const map = { 0: 'primary', 1: 'success', 2: 'warning' };
      return map[txnType] || 'info';
    },
    /** 获取支付方式名称 */
    getPayTypeName(payType) {
      const map = { 0: '微信', 1: 'Alipay', 2: 'Apple', 3: 'Google', 4: 'Stripe', 5: '其他' };
      return map[payType] || '-';
    },
    /** 获取支付方式标签类型 */
    getPayTypeTagType(payType) {
      const map = { 0: 'success', 1: 'primary', 2: '', 3: 'success', 4: 'primary', 5: 'info' };
      return map[payType] || 'info';
    },
    /** 格式化客户端平台 */
    formatPlatform(platform) {
      const map = { 0: 'iOS', 1: 'Android', 2: 'Web', 3: '小程序', 4: '其他' };
      return map[platform] !== undefined ? map[platform] : '-';
    },
    /** 获取平台标签类型 */
    getPlatformType(platform) {
      const map = { 0: 'primary', 1: 'success', 2: 'warning', 3: 'info', 4: '' };
      return map[platform] || 'info';
    },
    /** 获取状态名称 */
    getStatusName(status) {
      const map = { 0: '初始化', 1: '成功', 2: '失败', 3: '已取消' };
      return map[status] || '-';
    },
    /** 获取账单状态名称（对齐需求） */
    getBillStatusName(status) {
      const map = { 1: '支付成功', 3: '已关闭', 2: '退款成功' };
      return map[status] || '-';
    },
    /** 获取状态标签类型 */
    getStatusTagType(status) {
      const map = { 0: 'info', 1: 'success', 2: 'success', 3: 'info' };
      return map[status] || 'info';
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

<style scoped lang="scss">
.amt-paid {
  color: #409EFF;
  font-weight: 500;
}

.amt-discount {
  color: #67C23A;
  font-weight: 500;
}

/* 优化搜索表单对齐 */
::v-deep .admin-search-form {
  .el-form-item {
    margin-right: 20px;
    margin-bottom: 16px;
    vertical-align: top;
  }

  .el-form-item__label {
    text-align: right;
    padding-right: 12px;
    white-space: nowrap;
  }

  .el-form-item__content {
    line-height: 32px;
  }

  /* 统一输入框和下拉框样式 */
  .el-input,
  .el-select {
    width: 100%;
  }

  /* 日期选择器特殊处理 */
  .el-date-editor {
    width: 100% !important;
  }
}
</style>
