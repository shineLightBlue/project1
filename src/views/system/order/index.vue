<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="用户ID" prop="userId">
        <el-input
          v-model="queryParams.userId"
          placeholder="请输入用户ID"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

<!--      <el-form-item label="用户手机号" prop="phoneNumber">
        <el-input
          v-model="queryParams.phoneNumber"
          placeholder="请输入手机号"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="用户邮箱" prop="email">
        <el-input
          v-model="queryParams.email"
          placeholder="请输入邮箱"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>-->

      <el-form-item label="订单id" prop="orderId">
        <el-input
          v-model="queryParams.orderId"
          placeholder="请输入订单id"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="订单创建时间" prop="buyDate">
        <el-date-picker
          v-model="dateRange"
          style="width: 240px"
          value-format="yyyy-MM-dd"
          type="daterange"
          range-separator="-"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
        ></el-date-picker>
      </el-form-item>

      <el-form-item label="购买平台" prop="buyServerPlatform">
        <el-input
          v-model="queryParams.buyServerPlatform"
          placeholder="请输入购买平台"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>

      <el-form-item label="订单状态" prop="orderStatus">
        <el-input
          v-model="queryParams.orderStatus"
          placeholder="订单状态"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>





      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:order:export']"
        >导出</el-button>
      </el-form-item>
    </el-form>
<!--    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['system:order:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:order:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:order:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['system:order:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>-->

    <el-table v-loading="loading" :data="orderList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
<!--      <el-table-column label="id" align="center" prop="id" />-->
      <el-table-column label="购买平台" align="center" prop="buyServerPlatform" />
      <el-table-column label="商品" align="center" prop="productName" />
      <el-table-column label="付款金额" align="center" prop="payAmount" />
      <el-table-column label="币种" align="center" prop="currency" />
      <el-table-column label="订单id" align="center" prop="orderId" />
      <el-table-column label="购买时间" align="center" prop="buyDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.buyDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="用户ID" align="center" prop="userId" />
<!--      <el-table-column label="电话号码" align="center" prop="phoneNumber" />
      <el-table-column label="用户邮箱" align="center" prop="email" />-->
      <el-table-column label="订单状态" align="center" prop="orderStatus" />
      <el-table-column label="权限发放" align="center" prop="permissionSendStatus" />
      <el-table-column label="异常&处理" align="center" prop="permissionSendFailReason" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleSendPermission(scope.row)"
            v-hasPermi="['system:order:edit']"
           >激活</el-button>
           <el-button
             size="mini"
             type="text"
             icon="el-icon-delete"
             @click="handleCancelPermission(scope.row)"
             v-hasPermi="['system:order:remove']"
           >过期</el-button>
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

     <!-- 添加或修改用户购买记录对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="订单id" prop="orderId">
          <el-input v-model="form.orderId" placeholder="请输入订单id" />
        </el-form-item>
        <el-form-item label=" 产品id" prop="productId">
          <el-input v-model="form.productId" placeholder="请输入 产品id" />
        </el-form-item>
        <el-form-item label="购买时间" prop="buyDate">
          <el-date-picker clearable
            v-model="form.buyDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择购买时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="购买平台(苹果,谷歌,其他)" prop="buyServerPlatform">
          <el-input v-model="form.buyServerPlatform" placeholder="请输入购买平台(苹果,谷歌,其他)" />
        </el-form-item>
        <el-form-item label="返回当次交易id" prop="serverPlatformTransactionId">
          <el-input v-model="form.serverPlatformTransactionId" placeholder="请输入返回当次交易id" />
        </el-form-item>
        <el-form-item label="平台返回原始交易id" prop="serverPlatformOriginalTransactionId">
          <el-input v-model="form.serverPlatformOriginalTransactionId" placeholder="请输入平台返回原始交易id" />
        </el-form-item>
        <el-form-item label=" 是国内还是海外订单标识" prop="isAboardFlag">
          <el-input v-model="form.isAboardFlag" placeholder="请输入 是国内还是海外订单标识" />
        </el-form-item>
        <el-form-item label="支付时间" prop="payDate">
          <el-date-picker clearable
            v-model="form.payDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择支付时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="付款金额" prop="payAmount">
          <el-input v-model="form.payAmount" placeholder="请输入付款金额" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-input v-model="form.currency" placeholder="请输入币种" />
        </el-form-item>
        <el-form-item label="删除标志" prop="delFlag">
          <el-input v-model="form.delFlag" placeholder="请输入删除标志" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="订阅开始时间" prop="subscribeStartDate">
          <el-date-picker clearable
            v-model="form.subscribeStartDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择订阅开始时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="订阅到期时间" prop="subscripeEndDate">
          <el-date-picker clearable
            v-model="form.subscripeEndDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择订阅到期时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="首次订阅时间" prop="originalSubscripeDate">
          <el-date-picker clearable
            v-model="form.originalSubscripeDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择首次订阅时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="是否续订标识" prop="isContinueSubscripeFlag">
          <el-input v-model="form.isContinueSubscripeFlag" placeholder="请输入是否续订标识" />
        </el-form-item>
        <el-form-item label="权限发放失败时间" prop="permissionSendFailDate">
          <el-date-picker clearable
            v-model="form.permissionSendFailDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择权限发放失败时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="权限发放失败类型/原因" prop="permissionSendFailReason">
          <el-input v-model="form.permissionSendFailReason" placeholder="请输入权限发放失败类型/原因" />
        </el-form-item>
        <el-form-item label=" 是否已人工处理标识" prop="isPersonDealedFlag">
          <el-input v-model="form.isPersonDealedFlag" placeholder="请输入 是否已人工处理标识" />
        </el-form-item>
        <el-form-item label="处理人id" prop="operateUserId">
          <el-input v-model="form.operateUserId" placeholder="请输入处理人id" />
        </el-form-item>
        <el-form-item label="处理时间" prop="operateDate">
          <el-date-picker clearable
            v-model="form.operateDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择处理时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="权限已发周期数" prop="sendedTimeCount">
          <el-input v-model="form.sendedTimeCount" placeholder="请输入权限已发周期数" />
        </el-form-item>
        <el-form-item label="最后一次权限发放时间" prop="lastSendDate">
          <el-date-picker clearable
            v-model="form.lastSendDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择最后一次权限发放时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="最后处理时间" prop="lastOperateDate">
          <el-date-picker clearable
            v-model="form.lastOperateDate"
            type="date"
            value-format="yyyy-MM-dd"
            placeholder="请选择最后处理时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="订单确认状态说明" prop="confirmStatusDescripe">
          <el-input v-model="form.confirmStatusDescripe" placeholder="请输入订单确认状态说明" />
        </el-form-item>
        <el-form-item label="订单是否确认标识" prop="isConfirmFlag">
          <el-input v-model="form.isConfirmFlag" placeholder="请输入订单是否确认标识" />
        </el-form-item>
        <el-form-item label="确认次数统计" prop="confirmTimeCount">
          <el-input v-model="form.confirmTimeCount" placeholder="请输入确认次数统计" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder,sendPermission,cancelPermission } from "@/api/system/order";
export default {
  name: "Order",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 日期范围
      dateRange: [],
      // 总条数
      total: 0,
      // 用户购买记录表格数据
      orderList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        orderId: null,
        productId: null,
        buyDate: null,
        buyServerPlatform: null,
        serverPlatformTransactionId: null,
        serverPlatformOriginalTransactionId: null,
        isAboardFlag: null,
        payType: null,
        payDate: null,
        payAmount: null,
        currency: null,
        orderStatus: null,
        subscribeStartDate: null,
        subscripeEndDate: null,
        originalSubscripeDate: null,
        isContinueSubscripeFlag: null,
        permissionSendStatus: null,
        permissionSendFailDate: null,
        permissionSendFailReason: null,
        isPersonDealedFlag: null,
        operateUserId: null,
        operateDate: null,
        sendedTimeCount: null,
        lastSendDate: null,
        memberStatus: null,
        status: null,
        lastOperateDate: null,
        confirmStatus: null,
        confirmStatusDescripe: null,
        isConfirmFlag: null,
        confirmTimeCount: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        userId: [
          { required: true, message: "用户ID不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询用户购买记录列表 */
    getList() {
      this.loading = true;
      listOrder(this.addDateRange(this.queryParams, this.dateRange)).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        userId: null,
        orderId: null,
        productId: null,
        buyDate: null,
        buyServerPlatform: null,
        serverPlatformTransactionId: null,
        serverPlatformOriginalTransactionId: null,
        isAboardFlag: null,
        payType: null,
        payDate: null,
        payAmount: null,
        currency: null,
        orderStatus: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        subscribeStartDate: null,
        subscripeEndDate: null,
        originalSubscripeDate: null,
        isContinueSubscripeFlag: null,
        permissionSendStatus: null,
        permissionSendFailDate: null,
        permissionSendFailReason: null,
        isPersonDealedFlag: null,
        operateUserId: null,
        operateDate: null,
        sendedTimeCount: null,
        lastSendDate: null,
        memberStatus: null,
        status: null,
        lastOperateDate: null,
        confirmStatus: null,
        confirmStatusDescripe: null,
        isConfirmFlag: null,
        confirmTimeCount: null
      };
      this.resetForm("form");
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加用户购买记录";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      alert('开发中...')
      return;
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改用户购买记录";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      alert("开发中...")
      return;
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除用户购买记录编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 激活权限 */
    handleSendPermission(row) {
      alert("开发中...")
     // return;
      sendPermission(row).then(() => {
        this.getList();
        this.$modal.msgSuccess("激活成功成功");
      }).catch(() => {});
    },

    /** 取消权限 */
    handleCancelPermission(row) {
      alert("开发中...")
      // return;
      cancelPermission(row).then(() => {
        this.getList();
        this.$modal.msgSuccess("取消成功");
      }).catch(() => {});
    },



    /** 导出按钮操作 */
    handleExport() {
      this.download('system/order/export', {
        ...this.queryParams
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
