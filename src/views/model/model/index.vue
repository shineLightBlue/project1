<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="模型状态" prop="status">
        <el-select v-model="queryParams.status" placeholder="请选择模型状态：1=启用，0=禁用" clearable>
          <el-option
            v-for="dict in dict.type.skip_status"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <!--      <el-form-item label="是否支持流式输出" prop="supportsStream">-->
      <!--        <el-select v-model="queryParams.supportsStream" placeholder="请选择是否支持流式输出" clearable>-->
      <!--          <el-option-->
      <!--            v-for="dict in dict.type.skip_status"-->
      <!--            :key="dict.value"-->
      <!--            :label="dict.label"-->
      <!--            :value="dict.value"-->
      <!--          />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="是否支持函数调用" prop="supportsFunctionCalling">-->
      <!--        <el-select v-model="queryParams.supportsFunctionCalling" placeholder="请选择是否支持函数调用" clearable>-->
      <!--          <el-option-->
      <!--            v-for="dict in dict.type.skip_status"-->
      <!--            :key="dict.value"-->
      <!--            :label="dict.label"-->
      <!--            :value="dict.value"-->
      <!--          />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="是否支持 JSON 输出模式" prop="supportsJsonOutput">-->
      <!--        <el-select v-model="queryParams.supportsJsonOutput" placeholder="请选择是否支持 JSON 输出模式" clearable>-->
      <!--          <el-option-->
      <!--            v-for="dict in dict.type.skip_status"-->
      <!--            :key="dict.value"-->
      <!--            :label="dict.label"-->
      <!--            :value="dict.value"-->
      <!--          />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
      <!--      <el-form-item label="是否支持批处理 API" prop="supportsBatchApi">-->
      <!--        <el-select v-model="queryParams.supportsBatchApi" placeholder="请选择是否支持批处理 API" clearable>-->
      <!--          <el-option-->
      <!--            v-for="dict in dict.type.skip_status"-->
      <!--            :key="dict.value"-->
      <!--            :label="dict.label"-->
      <!--            :value="dict.value"-->
      <!--          />-->
      <!--        </el-select>-->
      <!--      </el-form-item>-->
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
          v-hasPermi="['model:model:add']"
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
          v-hasPermi="['model:model:edit']"
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
          v-hasPermi="['model:model:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['model:model:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="scrollable-table-box">
      <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="主键ID" align="center" prop="id" />
        <el-table-column label="模型提供方" align="center" prop="provider" />
        <el-table-column label="模型实际调用名称" align="center" prop="modelName" />
        <el-table-column label="前端显示名称" align="center" prop="displayName" />
        <el-table-column label="模型描述信息" align="center" prop="description" />
        <!--      <el-table-column label="模型状态" align="center" prop="status">-->
        <!--        <template slot-scope="scope">-->
        <!--          <dict-tag :options="dict.type.skip_status" :value="scope.row.status"/>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="是否支持流式" align="center" prop="supportsStream">-->
        <!--        <template slot-scope="scope">-->
        <!--          <dict-tag :options="dict.type.skip_status" :value="scope.row.supportsStream"/>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="是否支持函数" align="center" prop="supportsFunctionCalling">-->
        <!--        <template slot-scope="scope">-->
        <!--          <dict-tag :options="dict.type.skip_status" :value="scope.row.supportsFunctionCalling"/>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="是否支持JSON输出" align="center" prop="supportsJsonOutput">-->
        <!--        <template slot-scope="scope">-->
        <!--          <dict-tag :options="dict.type.skip_status" :value="scope.row.supportsJsonOutput"/>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="是否支持批处理" align="center" prop="supportsBatchApi">-->
        <!--        <template slot-scope="scope">-->
        <!--          <dict-tag :options="dict.type.skip_status" :value="scope.row.supportsBatchApi"/>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="最大输入Token数" align="center" prop="maxInputTokens" />-->
        <!--      <el-table-column label="最大输出Token数" align="center" prop="maxOutputTokens" />-->
        <!--      <el-table-column label="Token总限制" align="center" prop="maxTotalTokens" />-->
        <!--      <el-table-column label="输入Token价格" align="center" prop="pricingInputToken" />-->
        <!--      <el-table-column label="输出Token价格" align="center" prop="pricingOutputToken" />-->
        <!--      <el-table-column label="模型延迟等级" align="center" prop="latencyLevel" />-->
        <!--      <el-table-column label="建议并发数" align="center" prop="suggestedConcurrency" />-->
        <!--      <el-table-column label="TPM 限制" align="center" prop="tpm" />-->
        <!--      <el-table-column label="默认温度参数" align="center" prop="defaultTemperature" />-->
        <!--      <el-table-column label="默认 Top-p 参数" align="center" prop="defaultTopP" />-->
        <!--      <el-table-column label="默认最大输出 Token" align="center" prop="defaultMaxTokens" />-->
        <el-table-column label="支持的会员等级" align="center" prop="vipLevel">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.user_level" :value="scope.row.vipLevel"/>
          </template>
        </el-table-column>
        <!--      <el-table-column label="额外扩展参数" align="center" prop="extraParams" />-->
        <!--      <el-table-column label="模型API Endpoint" align="center" prop="apiEndpoint" />-->
        <!--      <el-table-column label="模型API 版本" align="center" prop="apiVersion" />-->
        <!--      <el-table-column label="绑定的API Key 配置 ID" align="center" prop="apiKeyId" />-->
        <!--      <el-table-column label="当前剩余余额" align="center" prop="balance" />-->
        <!--      <el-table-column label="余额单位" align="center" prop="balanceUnit" />-->
        <!--      <el-table-column label="余额最近更新时间" align="center" prop="balanceLastUpdateTime" width="180">-->
        <!--        <template slot-scope="scope">-->
        <!--          <span>{{ parseTime(scope.row.balanceLastUpdateTime, '{y}-{m}-{d}') }}</span>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="余额供应商原始返回" align="center" prop="balanceRawJson" />-->
        <!--      <el-table-column label="创建时间" align="center" prop="createTime" width="180">-->
        <!--        <template slot-scope="scope">-->
        <!--          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <!--      <el-table-column label="更新时间" align="center" prop="updateTime" width="180">-->
        <!--        <template slot-scope="scope">-->
        <!--          <span>{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>-->
        <!--        </template>-->
        <!--      </el-table-column>-->
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['model:model:edit']"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['model:model:remove']"
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


    <!-- 添加或修改大模型配置对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="800px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="150px">
        <el-form-item label="模型提供方" prop="provider">
          <el-input v-model="form.provider" placeholder="请输入模型提供方" />
        </el-form-item>
        <el-form-item label="模型实际调用名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="请输入模型实际调用名称" />
        </el-form-item>
        <el-form-item label="前端显示名称" prop="displayName">
          <el-input v-model="form.displayName" placeholder="请输入前端显示名称，用于 UI 展示" />
        </el-form-item>
        <el-form-item label="模型描述信息" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" />
        </el-form-item>
        <!--        <el-form-item label="模型状态" prop="status">-->
        <!--          <el-select v-model="form.status" placeholder="请选择模型状态：1=启用，0=禁用">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--       </el-form-item>-->
        <!--<el-form-item label="模型状态：1=启用，0=禁用" prop="status">&ndash;&gt;-->
        <!--          <el-select v-model="form.status" placeholder="请选择模型状态：1=启用，0=禁用">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="是否支持流式输出" prop="supportsStream">-->
        <!--          <el-select v-model="form.supportsStream" placeholder="请选择是否支持流式输出">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="是否支持函数调用" prop="supportsFunctionCalling">-->
        <!--          <el-select v-model="form.supportsFunctionCalling" placeholder="请选择是否支持函数调用">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="是否支持JSON输出模式" prop="supportsJsonOutput">-->
        <!--          <el-select v-model="form.supportsJsonOutput" placeholder="请选择是否支持 JSON 输出模式">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="是否支持批处理API" prop="supportsBatchApi">-->
        <!--          <el-select v-model="form.supportsBatchApi" placeholder="请选择是否支持批处理 API">-->
        <!--            <el-option-->
        <!--              v-for="dict in dict.type.skip_status"-->
        <!--              :key="dict.value"-->
        <!--              :label="dict.label"-->
        <!--              :value="parseInt(dict.value)"-->
        <!--            ></el-option>-->
        <!--          </el-select>-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="最大输入Token" prop="maxInputTokens">-->
        <!--          <el-input v-model="form.maxInputTokens" placeholder="请输入最大输入Token数" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="最大输出Token" prop="maxOutputTokens">-->
        <!--          <el-input v-model="form.maxOutputTokens" placeholder="请输入最大输出Token数" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="Token 总限制" prop="maxTotalTokens">-->
        <!--          <el-input v-model="form.maxTotalTokens" placeholder="请输入输入+输出 Token 总限制" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="输入Token价格" prop="pricingInputToken">-->
        <!--          <el-input v-model="form.pricingInputToken" placeholder="请输入输入 Token 价格" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="输出Token价格" prop="pricingOutputToken">-->
        <!--          <el-input v-model="form.pricingOutputToken" placeholder="请输入输出 Token 价格" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="模型延迟等级" prop="latencyLevel">-->
        <!--          <el-input v-model="form.latencyLevel" placeholder="请输入模型延迟等级：1=低延迟、2=中等、3=较高 用于调度" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="建议并发数" prop="suggestedConcurrency">-->
        <!--          <el-input v-model="form.suggestedConcurrency" placeholder="请输入建议并发数，用于负载管理" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="TPM限制" prop="tpm">-->
        <!--          <el-input v-model="form.tpm" placeholder="请输入TPM 限制" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="最大输出Token" prop="defaultMaxTokens">-->
        <!--          <el-input v-model="form.defaultMaxTokens" placeholder="请输入默认最大输出 Token" />-->
        <!--        </el-form-item>-->
        <el-form-item label="支持的会员等级" prop="vipLevel">
          <el-select
            v-model="vipLevelArray"
            placeholder="请选择支持的会员等级：0=所有用户可用"
            multiple
            collapse-tags
          >
            <el-option
              v-for="dict in dict.type.user_level"
              :key="dict.value"
              :label="dict.label"
              :value="parseInt(dict.value)"
            ></el-option>
          </el-select>
        </el-form-item>
        <!--        <el-form-item label="API Endpoint" prop="apiEndpoint">-->
        <!--          <el-input v-model="form.apiEndpoint" type="textarea" placeholder="请输入内容" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="API 版本" prop="apiVersion">-->
        <!--          <el-input v-model="form.apiVersion" placeholder="请输入模型调用的 API 版本" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="绑定的APIKey" prop="apiKeyId">-->
        <!--          <el-input v-model="form.apiKeyId" placeholder="请输入绑定的 API Key 配置 ID" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="余额单位" prop="balanceUnit">-->
        <!--          <el-input v-model="form.balanceUnit" placeholder="请输入余额单位" />-->
        <!--        </el-form-item>-->
        <!--        <el-form-item label="余额最近更新时间" prop="balanceLastUpdateTime">-->
        <!--          <el-date-picker clearable-->
        <!--                          v-model="form.balanceLastUpdateTime"-->
        <!--                          type="date"-->
        <!--                          value-format="yyyy-MM-dd"-->
        <!--                          placeholder="请选择余额最近更新时间">-->
        <!--          </el-date-picker>-->
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
import { listModel, getModel, delModel, addModel, updateModel } from "@/api/model/model";

export default {
  name: "Model",
  dicts: ['skip_status', 'user_level'],
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
      // 大模型配置表格数据
      modelList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        status: null,
        supportsStream: null,
        supportsFunctionCalling: null,
        supportsJsonOutput: null,
        supportsBatchApi: null,
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
  },
  computed: {
    vipLevelArray: {
      get() {
        return this.parseVipLevelToArray(this.form.vipLevel);
      },
      set(value) {
        this.form.vipLevel = this.formatVipLevelString(value);
      }
    }
  },
  methods: {
    /** 查询大模型配置列表 */
    getList() {
      this.loading = true;
      listModel(this.queryParams).then(response => {
        this.modelList = response.rows;
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
        provider: null,
        modelName: null,
        displayName: null,
        description: null,
        status: null,
        supportsStream: null,
        supportsFunctionCalling: null,
        supportsJsonOutput: null,
        supportsBatchApi: null,
        maxInputTokens: null,
        maxOutputTokens: null,
        maxTotalTokens: null,
        pricingInputToken: null,
        pricingOutputToken: null,
        latencyLevel: null,
        suggestedConcurrency: null,
        tpm: null,
        hardRateLimitRpmType: null,
        defaultTemperature: null,
        defaultTopP: null,
        defaultMaxTokens: null,
        vipLevel: "",
        extraParams: null,
        apiEndpoint: null,
        apiVersion: null,
        apiKeyId: null,
        balance: null,
        balanceUnit: null,
        balanceLastUpdateTime: null,
        balanceRawJson: null,
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
      this.title = "添加大模型配置";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getModel(id).then(response => {
        this.form = response.data;
        this.form.vipLevel = this.formatVipLevelString(this.form.vipLevel);
        this.open = true;
        this.title = "修改大模型配置";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateModel(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addModel(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除大模型配置编号为"' + ids + '"的数据项？').then(function() {
        return delModel(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('model/model/export', {
        ...this.queryParams
      }, `model_${new Date().getTime()}.xlsx`)
    },
    parseVipLevelToArray(value) {
      if (value === null || typeof value === "undefined" || value === "") return [];
      if (Array.isArray(value)) {
        return value
          .map(item => Number(item))
          .filter(item => !Number.isNaN(item));
      }
      return String(value)
        .split(",")
        .map(item => item.trim())
        .filter(item => item !== "")
        .map(item => Number(item))
        .filter(item => !Number.isNaN(item));
    },
    formatVipLevelString(value) {
      if (value === null || typeof value === "undefined" || value === "") return "";
      if (Array.isArray(value)) return value.length ? value.join(",") : "";
      return String(value);
    }
  }
};

</script>

<style scoped>
.scrollable-table-box {
  max-height: calc(100vh - 250px);
  overflow-y: auto;
}
.scrollable-table-box .el-table {
  margin-bottom: 0;
}
</style>
