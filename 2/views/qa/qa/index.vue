<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="语种" prop="languageCode">
        <el-select v-model="queryParams.languageCode" placeholder="请选择语种" clearable>
          <el-option
            v-for="dict in dict.type.language_code"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="产品名称" prop="productName">
        <el-select
          v-model="queryParams.productId"
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
          v-hasPermi="['qa:qa:add']"
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
          v-hasPermi="['qa:qa:edit']"
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
          v-hasPermi="['qa:qa:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['qa:qa:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="scrollable-table-box">
      <el-table v-loading="loading" :data="qaList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
<!--      <el-table-column label="${comment}" align="center" prop="id" />-->
      <el-table-column label="语种" align="center" prop="languageCode">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.language_code" :value="scope.row.languageCode"/>
        </template>
      </el-table-column>
      <el-table-column         label="产品名称"
                               align="center"
                               prop="productId"
                               :formatter="formatProductName" />

      <el-table-column label="问题 Q" align="center" prop="question" />
      <el-table-column label="回答 A" align="center" prop="answer" />
      <el-table-column label="排序" align="center" prop="sort" />
      <el-table-column label="1=启用 0=禁用" align="center" prop="status">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.yes_or_no" :value="scope.row.status"/>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['qa:qa:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['qa:qa:remove']"
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

    <!-- 添加或修改qa对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="产品" prop="productId">
          <el-select v-model="form.productId" placeholder="请选择产品" filterable>
            <el-option
              v-for="item in productList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="语种" prop="languageCode">
          <el-select v-model="form.languageCode" placeholder="请选择语种，例如 zh, en">
            <el-option
              v-for="dict in dict.type.language_code"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="问题 Q" prop="question">
          <el-input v-model="form.question" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="回答 A" prop="answer">
          <el-input v-model="form.answer" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input v-model="form.sort" placeholder="请输入排序字段，越小越靠前" />
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
import { listQa, getQa, delQa, addQa, updateQa } from "@/api/qa/qa";
import { listProduct } from "@/api/firmware/firmware";

export default {
  name: "Qa",
  dicts: ['language_code', 'yes_or_no'],
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
      // qa表格数据
      qaList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        productId: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        languageCode: [
          { required: true, message: "语种，例如 zh, en不能为空", trigger: "change" }
        ],
        productId: [
          { required: true, message: "产品ID不能为空", trigger: "change" }
        ],
        question: [
          { required: true, message: "问题 Q不能为空", trigger: "blur" }
        ],
        answer: [
          { required: true, message: "回答 A不能为空", trigger: "blur" }
        ],
        sort: [
          { required: true, message: "排序字段，越小越靠前不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
    this.getProductList();
  },
  methods: {
    /** 查询qa列表 */
    getList() {
      this.loading = true;
      listQa(this.queryParams).then(response => {
        this.qaList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        languageCode: null,
        productId: null,
        question: null,
        answer: null,
        sort: null,
        status: null,
        createTime: null,
        updateTime: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    formatProductName(row) {
      const product = this.productList.find(item => item.id === row.productId)
      return product ? product.name : ''
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
      this.title = "添加qa";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getQa(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改qa";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateQa(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addQa(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除qa编号为"' + ids + '"的数据项？').then(function() {
        return delQa(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('qa/qa/export', {
        ...this.queryParams
      }, `qa_${new Date().getTime()}.xlsx`)
    }
  }
};

</script>

<style scoped>
.scrollable-table-box {
  max-height: calc(100vh - 240px);
  overflow-y: auto;
}
.scrollable-table-box .el-table {
  margin-bottom: 0;
}
</style>
