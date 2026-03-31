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
      <el-form-item label="购买时间">
        <el-date-picker
          v-model="daterangeBuyDate"
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
          v-hasPermi="['system:detail:export']"
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
              v-hasPermi="['system:detail:add']"
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
              v-hasPermi="['system:detail:edit']"
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
              v-hasPermi="['system:detail:remove']"
            >删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="el-icon-download"
              size="mini"
              @click="handleExport"
              v-hasPermi="['system:detail:export']"
            >导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>-->

    <el-table v-loading="loading" :data="detailList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="购买平台" align="center" prop="buyServerPlatform" />
      <el-table-column label="用户ID" align="center" prop="userId" />
      <el-table-column label="用户昵称" align="center" prop="nickName" />
      <el-table-column label="用户账号" align="center" width="150" show-overflow-tooltip>
        <template slot-scope="scope">
          <span v-if="scope.row.phonenumber">{{ scope.row.phonenumber }}</span>
          <span v-else-if="scope.row.email">{{ scope.row.email }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="订单id" align="center" prop="orderId" />
      <el-table-column label="购买时间" align="center" prop="buyDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.buyDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="付款金额" align="center" prop="payAmount" />
      <el-table-column label="币种" align="center" prop="currency" />
      <el-table-column label="订单状态" align="center" prop="orderStatus" />
      <el-table-column label=" 产品名称" align="center" prop="productName" />
      <!--      <el-table-column label="返回当次交易id" align="center" prop="serverPlatformTransactionId" />
            <el-table-column label="平台返回原始交易id" align="center" prop="serverPlatformOriginalTransactionId" />-->
      <!--      <el-table-column label="订单确认状态" align="center" prop="confirmStatus" />-->
      <el-table-column label="权限发放状态" align="center" prop="permissionSendStatus" />
      <!--      <el-table-column label="权限发放失败类型/原因" align="center" prop="permissionSendFailReason" />
            <el-table-column label=" 是否已人工处理标识" align="center" prop="isPersonDealedFlag" />
            <el-table-column label="处理人id" align="center" prop="operateUserId" />
            <el-table-column label="处理时间" align="center" prop="operateDate" width="180">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.operateDate, '{y}-{m}-{d}') }}</span>
              </template>
            </el-table-column>-->
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['system:detail:edit']"
          >激活</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['system:detail:remove']"
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

    <!-- 添加或修改VIEW对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="id" prop="id">
          <el-input v-model="form.id" placeholder="请输入id" />
        </el-form-item>
        <el-form-item label="用户ID" prop="userId">
          <el-input v-model="form.userId" placeholder="请输入用户ID" />
        </el-form-item>
        <el-form-item label="用户昵称" prop="nickName">
          <el-input v-model="form.nickName" placeholder="请输入用户昵称" />
        </el-form-item>
        <el-form-item label="订单id" prop="orderId">
          <el-input v-model="form.orderId" placeholder="请输入订单id" />
        </el-form-item>
        <el-form-item label="购买时间" prop="buyDate">
          <el-date-picker clearable
                          v-model="form.buyDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="请选择购买时间">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="付款金额" prop="payAmount">
          <el-input v-model="form.payAmount" placeholder="请输入付款金额" />
        </el-form-item>
        <el-form-item label="币种" prop="currency">
          <el-input v-model="form.currency" placeholder="请输入币种" />
        </el-form-item>
        <el-form-item label=" 产品名称" prop="productName">
          <el-input v-model="form.productName" placeholder="请输入 产品名称" />
        </el-form-item>
        <el-form-item label="返回当次交易id" prop="serverPlatformTransactionId">
          <el-input v-model="form.serverPlatformTransactionId" placeholder="请输入返回当次交易id" />
        </el-form-item>
        <el-form-item label="平台返回原始交易id" prop="serverPlatformOriginalTransactionId">
          <el-input v-model="form.serverPlatformOriginalTransactionId" placeholder="请输入平台返回原始交易id" />
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
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDetail, getDetail, delDetail, addDetail, updateDetail } from "@/api/system/orderServiceBag";

export default {
  name: "OrderServiceBag",
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
      // 总条数
      total: 0,
      // VIEW表格数据
      detailList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 处理时间时间范围
      daterangeBuyDate: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        userId: null,
        nickName: null,
        orderId: null,
        buyDate: null,
        buyServerPlatform: null,
        payAmount: null,
        currency: null,
        orderStatus: null,
        productName: null,
        serverPlatformTransactionId: null,
        serverPlatformOriginalTransactionId: null,
        confirmStatus: null,
        permissionSendStatus: null,
        permissionSendFailReason: null,
        isPersonDealedFlag: null,
        operateUserId: null,
        operateDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        id: [
          { required: true, message: "id不能为空", trigger: "blur" }
        ],
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
    /** 查询VIEW列表 */
    getList() {
      this.loading = true;
      this.queryParams.params = {};
      if (null != this.daterangeBuyDate && '' != this.daterangeBuyDate) {
        this.queryParams.params["beginBuyDate"] = this.daterangeBuyDate[0];
        this.queryParams.params["endBuyDate"] = this.daterangeBuyDate[1];
      }
      listDetail(this.queryParams).then(response => {
        this.detailList = response.rows;
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
        nickName: null,
        orderId: null,
        buyDate: null,
        buyServerPlatform: null,
        payAmount: null,
        currency: null,
        orderStatus: null,
        productName: null,
        serverPlatformTransactionId: null,
        serverPlatformOriginalTransactionId: null,
        confirmStatus: null,
        permissionSendStatus: null,
        permissionSendFailReason: null,
        isPersonDealedFlag: null,
        operateUserId: null,
        operateDate: null
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
      this.daterangeBuyDate = [];
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
      this.title = "添加VIEW";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      alert("开发中...")
      return;
      this.reset();
      const id = row.id || this.ids
      getDetail(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改VIEW";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateDetail(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDetail(this.form).then(response => {
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
      alert("开发中");
      return;
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除VIEW编号为"' + ids + '"的数据项？').then(function() {
        return delDetail(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('system/detail/export', {
        ...this.queryParams
      }, `detail_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
