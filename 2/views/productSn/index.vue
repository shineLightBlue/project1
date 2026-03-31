<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-form-item label="产品名称" prop="productName">
        <el-select
          v-model="queryParams.productName"
          placeholder="请选择产品名称"
          filterable
          clearable
        >
          <el-option
            v-for="item in productList"
            :key="item.id"
            :label="item.name"
            :value="item.name"
          ></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="SN信息" prop="productSn">
        <el-input
          v-model="queryParams.productSn"
          placeholder="请输入SN信息"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['productSn:productSn:add']"
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
          v-hasPermi="['productSn:productSn:edit']"
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
          v-hasPermi="['productSn:productSn:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['productSn:productSn:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="scrollable-table-box">
      <el-table v-loading="loading" :data="productSnList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="主键id" align="center" prop="id" />
      <el-table-column label="SN信息" align="center" prop="productSn" />
      <el-table-column label="产品名称" align="center" prop="productName" />
<!--      <el-table-column label="添加方式" align="center" prop="addType" />-->
      <el-table-column label="添加方式" align="center" prop="addType">
        <template #default="{ row }">
          <span v-if="row.addType == 2">手动录入</span>
          <span v-else-if="row.addType == 3">扫码录入</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="添加部门" align="center" prop="addDept" />
      <el-table-column label="PID" align="center" prop="productPid" />
      <el-table-column label="VID" align="center" prop="productVid" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['productSn:productSn:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['productSn:productSn:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
      </el-table>
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改productSn对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="产品名称" prop="productName">
          <el-select v-model="form.productName" placeholder="请选择产品名称" filterable>
            <el-option
              v-for="item in productList"
              :key="item.name"
              :label="item.name"
              :value="item.name"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="SN信息" prop="productSn">
          <el-input v-model="form.productSn" placeholder="请输入SN信息" />
        </el-form-item>
<!--        <el-form-item label="产品名称" prop="productId">-->
<!--          <el-input v-model="form.productName" placeholder="请输入产品名称" />-->
<!--        </el-form-item>-->

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listProductSn, getProductSn, delProductSn, addProductSn, updateProductSn } from "@/api/productSn/productSn";
import { listProduct } from '@/api/firmware/firmware'

export default {
  name: "ProductSn",
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
      // productSn表格数据
      productSnList: [],
      productList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        productSn: null,
        productName: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
    this.getProductList();
  },
  methods: {
    /** 查询productSn列表 */
    getList() {
      this.loading = true;
      listProductSn(this.queryParams).then(response => {
        this.productSnList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    getProductList() {
      listProduct().then(res => {
        // 假设返回数据结构为 { data: [{id: 1, name: '产品A'}, ...] }
        this.productList = res.data
        console.log(res.data)
      }).catch(() => {
        this.$message.error('获取产品列表失败')
      })
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delFlag: null,
        productSn: null,
        productName: null,
        addType: null,
        addDept: null,
        styleName: null,
        productPid: null,
        productVid: null
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
      this.title = "添加productSn";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getProductSn(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改productSn";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateProductSn(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addProductSn(this.form).then(response => {
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
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除productSn编号为"' + ids + '"的数据项？').then(function() {
        return delProductSn(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('productSn/productSn/export', {
        ...this.queryParams
      }, `productSn_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.scrollable-table-box {
  max-height: calc(100vh - 230px);
  overflow-y: auto;
}
.scrollable-table-box .el-table {
  margin-bottom: 0;
}
</style>