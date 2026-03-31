<template>
  <div class="admin-page-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="120px" class="admin-search-form">
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
      <el-form-item label="商品名称" prop="productName">
        <el-select v-model="queryParams.productName" placeholder="全部" clearable style="width: 180px" filterable>
          <el-option label="全部" value="" />
          <el-option label="120分钟转写时长" value="wm_transcription_120" />
          <el-option label="600分钟转写时长" value="wm_transcription_600" />
          <el-option label="3000分钟转写时长" value="wm_transcription_3000" />
          <el-option label="6000分钟转写时长" value="wm_transcription_6000" />
        </el-select>
      </el-form-item>
      <el-form-item label="支付方式" prop="buyServerPlatform">
        <el-select v-model="queryParams.buyServerPlatform" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="Alipay" value="alipay" />
          <el-option label="Google" value="google" />
          <el-option label="Apple" value="apple" />
          <el-option label="Stripe" value="stripe" />
          <el-option label="微信" value="wechatpay" />
        </el-select>
      </el-form-item>
      <el-form-item label="第三方交易ID" prop="serverPlatformTransactionId">
        <el-input
          v-model="queryParams.serverPlatformTransactionId"
          placeholder="请输入第三方交易ID"
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
      <el-form-item label="支付状态" prop="orderStatus">
        <el-select v-model="queryParams.orderStatus" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="待支付" value="待支付" />
          <el-option label="支付成功" value="成功" />
          <el-option label="已退款" value="已退款" />
          <el-option label="已关闭" value="已取消" />
          <el-option label="支付失败" value="支付失败" />
        </el-select>
      </el-form-item>
      <el-form-item label="履约状态" prop="permissionSendFlag">
        <el-select v-model="queryParams.permissionSendFlag" placeholder="全部" clearable style="width: 180px">
          <el-option label="全部" value="" />
          <el-option label="待发放" value="待发放" />
          <el-option label="权益发放成功" value="已下发权限" />
          <el-option label="权益发放失败" value="权益发放失败" />
          <el-option label="已取消" value="已取消" />
        </el-select>
      </el-form-item>
      <el-form-item label="权益流水ID" prop="interestRecordId">
        <el-input
          v-model="queryParams.interestRecordId"
          placeholder="请输入权益流水ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="账单流水ID" prop="billRecordId">
        <el-input
          v-model="queryParams.billRecordId"
          placeholder="请输入账单流水ID"
          clearable
          style="width: 180px"
          @keyup.enter.native="handleQuery"
        />
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
          v-hasPermi="['system:sevicebag:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="admin-table-wrapper">
      <el-table
        v-loading="loading"
        :data="sevicebagList"
        @selection-change="handleSelectionChange"
        @cell-dblclick="handleCellDblClick"
        border
        stripe
        class="admin-table"
        :max-height="tableMaxHeight"
        style="width: 100%"
      >
        <el-table-column type="selection" width="50" align="center" fixed="left" />
        <el-table-column label="订单ID" align="center" prop="orderId" width="180" fixed="left" show-overflow-tooltip />
        <el-table-column label="用户ID" align="center" prop="userId" width="180" show-overflow-tooltip />
        <el-table-column label="用户账号" align="center" width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.phonenumber">{{ scope.row.phonenumber }}</span>
            <span v-else-if="scope.row.email">{{ scope.row.email }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品名称" align="center" prop="productName" width="150" show-overflow-tooltip />
        <el-table-column label="支付金额" align="right" prop="amtPaid" width="100">
          <template slot-scope="scope">
            <span class="amt-paid">{{ formatMoney(scope.row.amtPaid, scope.row.currency) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="原价" align="right" prop="payAmount" width="100">
          <template slot-scope="scope">
            <span>{{ formatMoney(scope.row.payAmount, scope.row.currency) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优惠金额" align="right" prop="amtDiscount" width="100">
          <template slot-scope="scope">
            <span class="amt-discount">{{ formatMoney(scope.row.amtDiscount || 0, scope.row.currency) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="币种" align="center" prop="currency" width="70">
          <template slot-scope="scope">
            {{ (scope.row.currency || '').toUpperCase() }}
          </template>
        </el-table-column>
        <el-table-column label="支付方式" align="center" prop="buyServerPlatform" width="100">
          <template slot-scope="scope">
            <el-tag :type="getPayChannelType(scope.row.buyServerPlatform)" size="small">
              {{ formatPayChannel(scope.row.buyServerPlatform) }}
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
        <el-table-column label="第三方交易ID" align="center" prop="serverPlatformTransactionId" width="220" show-overflow-tooltip />
        <el-table-column label="原始交易ID" align="center" prop="serverPlatformOriginalTransactionId" width="220" show-overflow-tooltip />
        <el-table-column label="支付时间" align="center" prop="buyDate" width="160">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.buyDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="支付状态" align="center" prop="orderStatus" width="100">
          <template slot-scope="scope">
            <el-tag :type="getOrderStatusType(scope.row.orderStatus)" size="small">
              {{ getPayStatusName(scope.row.orderStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="失败原因" align="center" width="200" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.orderStatus === '支付失败' || scope.row.orderStatus === '失败'">
              {{ scope.row.errorMsg || scope.row.errorCode || '-' }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="履约状态" align="center" prop="permissionSendFlag" width="120">
          <template slot-scope="scope">
            <el-tag :type="getPermissionSendFlagType(scope.row.permissionSendFlag)" size="small">
              {{ formatPermissionSendFlag(scope.row.permissionSendFlag) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="权益流水ID" align="center" prop="interestRecordId" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.interestRecordId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="账单流水ID" align="center" prop="billRecordId" width="180" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.billRecordId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="资源动态" align="center" width="150" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ getResourceDynamic(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-view"
              @click="handleDetail(scope.row)"
              v-hasPermi="['system:sevicebag:query']"
            >详情</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-refresh-right"
              @click="handleApplyRefund(scope.row)"
              v-hasPermi="['system:sevicebag:refund']"
              v-if="isRefundable(scope.row)"
            >申请退款</el-button>
            <!--          <el-button-->
            <!--            size="mini"-->
            <!--            type="text"-->
            <!--            icon="el-icon-delete"-->
            <!--            @click="sendPermission(scope.row)"-->
            <!--            v-hasPermi="['system:sevicebag:grant']"-->
            <!--            v-if="scope.row.permissionSendFlag !== '已下发权限'"-->
            <!--          >下发</el-button>-->
            <!--          <el-button-->
            <!--            size="mini"-->
            <!--            type="text"-->
            <!--            icon="el-icon-edit"-->
            <!--            @click="cancelPermission(scope.row)"-->
            <!--            v-hasPermi="['system:sevicebag:revoke']"-->
            <!--            v-if="scope.row.permissionSendFlag === '已下发权限'"-->
            <!--          >收回</el-button>-->
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

    <!-- 订单详情对话框 -->
    <el-dialog title="订单详情" :visible.sync="detailOpen" width="1200px" append-to-body custom-class="admin-dialog">
      <el-descriptions :column="3" border size="medium">
        <el-descriptions-item label="订单ID" :span="3">{{ detailForm.orderId }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ detailForm.userId }}</el-descriptions-item>
        <el-descriptions-item label="用户账号">
          <span v-if="detailForm.phonenumber">{{ detailForm.phonenumber }}</span>
          <span v-else-if="detailForm.email">{{ detailForm.email }}</span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ parseTime(detailForm.createTime) }}</el-descriptions-item>
        <el-descriptions-item label="商品名称" :span="3">{{ detailForm.productName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付金额">{{ formatMoney(detailForm.amtPaid, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="原价">{{ formatMoney(detailForm.payAmount, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="优惠金额">{{ formatMoney(detailForm.amtDiscount || 0, detailForm.currency) }}</el-descriptions-item>
        <el-descriptions-item label="币种">{{ (detailForm.currency || '').toUpperCase() }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">
          <el-tag :type="getPayChannelType(detailForm.buyServerPlatform)" size="small">
            {{ formatPayChannel(detailForm.buyServerPlatform) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平台">
          <el-tag :type="getPlatformType(detailForm.platform)" size="small" effect="plain">
            {{ formatPlatform(detailForm.platform) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="第三方交易ID" :span="3">{{ detailForm.serverPlatformTransactionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="原始交易ID" :span="3">{{ detailForm.serverPlatformOriginalTransactionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="支付时间">{{ parseTime(detailForm.buyDate) }}</el-descriptions-item>
        <el-descriptions-item label="支付状态">
          <el-tag :type="getOrderStatusType(detailForm.orderStatus)" size="small">
            {{ getPayStatusName(detailForm.orderStatus) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="失败原因">
          <span v-if="detailForm.orderStatus === '支付失败' || detailForm.orderStatus === '失败'">
            {{ detailForm.errorMsg || detailForm.errorCode || '-' }}
          </span>
          <span v-else>-</span>
        </el-descriptions-item>
        <el-descriptions-item label="履约状态">
          <el-tag :type="getPermissionSendFlagType(detailForm.permissionSendFlag)" size="small">
            {{ formatPermissionSendFlag(detailForm.permissionSendFlag) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="权益流水ID" :span="3">{{ detailForm.interestRecordId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="账单流水ID" :span="3">{{ detailForm.billRecordId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="资源动态" :span="3">{{ getResourceDynamic(detailForm) }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button @click="detailOpen = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 申请退款对话框 -->
    <el-dialog title="申请退款" :visible.sync="refundOpen" width="600px" append-to-body custom-class="admin-dialog">
      <el-form ref="refundFormRef" :model="refundForm" :rules="refundRules" label-width="100px">
        <el-form-item label="订单ID">
          <el-input v-model="refundForm.orderId" disabled />
        </el-form-item>
        <el-form-item label="退款原因" prop="refundReason">
          <el-input
            type="textarea"
            v-model="refundForm.refundReason"
            :rows="4"
            maxlength="250"
            show-word-limit
            placeholder="请输入退款原因（最多250字）"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="refundOpen = false">取 消</el-button>
        <el-button type="primary" :loading="refundLoading" @click="submitApplyRefund">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listSevicebag, exportSevicebag, applyRefundSevicebag } from "@/api/system/sevicebag";
import { sendPermission, cancelPermission } from '@/api/system/order'
import { formatMoney as formatMoneyUtil } from "@/utils/payConstants";
import { addDateRange } from "@/utils/ruoyi";

export default {
  name: "Sevicebag",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 表格最大高度
      tableMaxHeight: 600,
      // 选中数组
      ids: [],
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // VIEW表格数据
      sevicebagList: [],
      // 详情弹窗
      detailOpen: false,
      // 详情表单
      detailForm: {},
      // 申请退款弹窗
      refundOpen: false,
      refundLoading: false,
      refundForm: {
        orderId: "",
        refundReason: ""
      },
      refundRules: {
        refundReason: [
          { required: true, message: "退款原因不能为空", trigger: "blur" },
          { min: 1, max: 250, message: "退款原因最多250字", trigger: "blur" }
        ]
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderId: null, // 订单ID
        userId: null, // 用户ID
        userAccount: null, // 用户账号（手机号或邮箱）
        productName: "", // 商品名称（下拉选择）
        buyServerPlatform: "", // 支付方式
        serverPlatformTransactionId: null, // 第三方交易ID
        platform: null, // 平台
        orderStatus: "", // 支付状态
        permissionSendFlag: "", // 履约状态
        interestRecordId: null, // 关联权益流水ID
        billRecordId: null // 关联账单流水ID
      },
      // 时间范围选择器
      payDateRange: [], // 支付时间范围
      createTimeRange: [] // 创建时间范围
    };
  },
  computed: {
    // 动态计算表格高度
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 70 : 0;
      const toolbarHeight = 40;
      const paginationHeight = 80; // 增加分页高度预留
      const padding = 40;
      const tablePaginationGap = 12; // 表格与分页的间距
      const margins = 20;
      const reserved = searchHeight + toolbarHeight + paginationHeight + padding + tablePaginationGap + margins;
      const viewportHeight = window.innerHeight || 800;
      const calculated = viewportHeight - reserved - 84;
      return Math.max(300, calculated); // 移除最大高度限制
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
    /** 下发权限 */
    sendPermission(data) {
      this.$modal.confirm('是否确认下发该订单的用户权限？').then(() => {
        return sendPermission(data);
      }).then(() => {
        this.$modal.msgSuccess("下发成功");
        this.getList();
      }).catch(() => {});
    },
    /** 收回权限 */
    cancelPermission(data) {
      this.$modal.confirm('是否确认收回该订单的用户权限？').then(() => {
        return cancelPermission(data);
      }).then(() => {
        this.$modal.msgSuccess("收回成功");
        this.getList();
      }).catch(() => {});
    },
    /** 查询VIEW列表 */
    getList() {
      this.loading = true;
      // 处理时间范围参数
      this.addDateRange(this.queryParams, this.payDateRange, 'PayDate');
      this.addDateRange(this.queryParams, this.createTimeRange, 'Time');
      listSevicebag(this.queryParams).then(response => {
        this.sevicebagList = response.rows;
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
      // 重置所有查询参数
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        orderId: null,
        userId: null,
        userAccount: null,
        productName: "",
        buyServerPlatform: "",
        serverPlatformTransactionId: null,
        platform: null,
        orderStatus: "",
        permissionSendFlag: "",
        interestRecordId: null,
        billRecordId: null
      };
      this.payDateRange = [];
      this.createTimeRange = [];
      this.handleQuery();
    },
    /** 支付时间范围变化 */
    handlePayDateRangeChange(val) {
      this.payDateRange = val || [];
    },
    /** 创建时间范围变化 */
    handleCreateTimeRangeChange(val) {
      this.createTimeRange = val || [];
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
    },
    /** 查看详情 */
    handleDetail(row) {
      this.detailForm = row;
      this.detailOpen = true;
    },
    /** 是否可申请退款 */
    isRefundable(row) {
      if (!row) return false;
      // 仅支付成功可申请，且不能重复申请
      const payType = row.payType;
      const status = row.orderStatus;
      return (status === '成功' || status === '支付成功') && status !== '退款中' && status !== '已退款' && (payType === 'aliPay' || payType === 'wechatPay');
    },
    /** 打开申请退款弹窗 */
    handleApplyRefund(row) {
      this.refundForm = {
        orderId: row.orderId,
        refundReason: ""
      };
      this.refundOpen = true;
      this.$nextTick(() => {
        this.$refs.refundFormRef && this.$refs.refundFormRef.clearValidate();
      });
    },
    /** 提交申请退款 */
    submitApplyRefund() {
      this.$refs["refundFormRef"].validate(valid => {
        if (!valid) return;
        this.$modal.confirm('确认对该订单发起“申请退款”？订单将标记为退款中，等待异步确认。').then(() => {
          this.refundLoading = true;
          return applyRefundSevicebag({
            orderId: this.refundForm.orderId,
            refundReason: this.refundForm.refundReason
          });
        }).then(() => {
          this.$modal.msgSuccess("申请退款已提交");
          this.refundOpen = false;
          this.getList();
        }).finally(() => {
          this.refundLoading = false;
        });
      });
    },
    /** 格式化支付渠道 */
    formatPayChannel(channel) {
      const map = {
        'stripe': 'Stripe',
        'apple': 'Apple',
        'google': 'Google',
        'wechatpay': '微信支付',
        'alipay': '支付宝'
      };
      return map[channel] || channel || '-';
    },
    /** 获取支付渠道标签类型 */
    getPayChannelType(channel) {
      const map = {
        'stripe': 'primary',
        'apple': '',
        'google': 'success',
        'wechatpay': 'success',
        'alipay': 'primary'
      };
      return map[channel] || 'info';
    },
    /** 格式化客户端平台 */
    formatPlatform(platform) {
      const map = {
        0: 'iOS',
        1: 'Android',
        2: 'Web',
        3: '小程序',
        4: '其他'
      };
      return map[platform] !== undefined ? map[platform] : '-';
    },
    /** 获取平台标签类型 */
    getPlatformType(platform) {
      const map = {
        0: '',
        1: 'success',
        2: 'primary',
        3: 'warning',
        4: 'info'
      };
      return map[platform] || 'info';
    },
    /** 获取订单状态标签类型 */
    getOrderStatusType(status) {
      if (!status) return 'info';
      if (status === '成功' || status === '支付成功') return 'success';
      if (status === '待支付') return 'warning';
      if (status === '支付失败' || status === '失败') return 'danger';
      if (status === '退款中') return 'warning';
      if (status === '已退款') return 'info';
      if (status === '已取消' || status === '已关闭') return 'info';
      if (status === '已撤销') return 'info';
      return 'info';
    },
    /** 获取支付状态名称（对齐需求） */
    getPayStatusName(status) {
      if (!status) return '-';
      if (status === '成功') return '支付成功';
      if (status === '已退款') return '已退款';
      if (status === '已取消') return '已关闭';
      if (status === '支付失败' || status === '失败') return '支付失败';
      return status;
    },
    /** 格式化履约状态 */
    formatPermissionSendFlag(flag) {
      if (!flag) return '-';
      if (flag === '已下发权限') return '权益发放成功';
      return flag;
    },
    /** 获取履约状态标签类型 */
    getPermissionSendFlagType(flag) {
      if (!flag) return 'info';
      if (flag === '已下发权限') return 'success';
      if (flag === '权益发放失败') return 'danger';
      if (flag === '待发放') return 'warning';
      if (flag === '已取消') return 'info';
      return 'info';
    },
    /** 格式化秒数为分钟和秒 */
    formatSecondsToMinutes(seconds) {
      if (!seconds || seconds === 0) {
        return '0分钟';
      }
      const totalSeconds = Math.floor(Number(seconds));
      const minutes = Math.floor(totalSeconds / 60);
      const secs = totalSeconds % 60;

      if (minutes === 0) {
        return `${secs}秒`;
      } else if (secs === 0) {
        return `${minutes}分钟`;
      } else {
        return `${minutes}分钟${secs}秒`;
      }
    },
    /** 获取资源动态（转写包使用情况） */
    getResourceDynamic(row) {
      // 只在支付成功时显示使用情况
      if (row.orderStatus !== '成功' && row.orderStatus !== '支付成功') {
        return '-';
      }

      // 如果没有使用情况数据，返回 '-'
      if (!row.transcribeLimitValue && !row.transcribeUsedValue && row.transcribeLimitType !== 0) {
        return '-';
      }

      // 无限制权益
      if (row.transcribeLimitType === 0) {
        const usedText = this.formatSecondsToMinutes(row.transcribeUsedValue || 0);
        return `已使用${usedText}（无限制）`;
      }

      // 有限制权益
      const limitText = this.formatSecondsToMinutes(row.transcribeLimitValue || 0);
      const usedText = this.formatSecondsToMinutes(row.transcribeUsedValue || 0);
      const remainingSeconds = (row.transcribeLimitValue || 0) - (row.transcribeUsedValue || 0);
      const remainingText = this.formatSecondsToMinutes(Math.max(0, remainingSeconds));

      return `${usedText}/${limitText}（剩余${remainingText}）`;
    },
    /** 格式化金额 */
    formatMoney(amount, currency) {
      // 使用通用的货币格式化函数
      return formatMoneyUtil(amount, currency);
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
    /** 导出 */
    handleExport() {
      this.$modal.confirm('是否确认导出补充包订单数据?').then(() => {
        this.exportLoading = true;
        return exportSevicebag(this.queryParams);
      }).then(response => {
        this.$download.saveAs(response, '补充包订单_' + new Date().getTime() + '.xlsx');
        this.exportLoading = false;
      }).catch(() => {
        this.exportLoading = false;
      });
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
