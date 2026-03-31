<template>
  <div class="admin-page-container">
    <!-- 搜索区域 -->
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="90px" class="admin-search-form">
         <el-form-item label="模板名称" prop="templateName">
        <el-input
          v-model="queryParams.templateName"
          placeholder="请输入模板名称"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="模板分类" prop="categoryCode">
         <el-select v-model="queryParams.categoryCode" placeholder="请选择模板" clearable style="width: 150px">
        <el-option
      v-for="item in cnTemplateCategoryList"
      :key="item.dictCode"
      :label="item.dictLabel"
      :value="item.dictValue"
      :disabled="item.status !== '0'"
    >
      <template #default>
        <img :src="item.cssClass" alt="" style="width: 18px; height: 18px; margin-right: 6px; vertical-align: middle;" />
        {{ item.dictLabel }}
      </template>
    </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
         <el-select v-model="queryParams.status" placeholder="请选择模板" clearable style="width: 150px">
          <el-option label="全部" value="" />
          <el-option label="上架" value="1" />
          <el-option label="下架" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>
     <el-row>
   <el-button type="primary" @click="handleAdd" v-hasPermi="['system::summaryTemplate:add']">新增模板</el-button>
     </el-row>
    <el-row :gutter="10" class="admin-toolbar">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <!-- 数据表格 -->
    <div class="admin-table-wrapper">
      <el-table 
        v-loading="loading" 
        :data="summaryRecord" 
        stripe 
        @cell-dblclick="handleCellDblClick"
        class="admin-table"
        :max-height="tableMaxHeight"
        border
      >
        <el-table-column label="模板名称" align="center" prop="templateName" width="200" />
        <el-table-column label="模板分类" align="center" prop="categoryName" width="150" />
        <el-table-column label="模板编码" align="center" prop="templateCode" width="150" />
        <el-table-column label="预览提示词" align="center" prop="previewPrompt" width="150">
          <template slot-scope="scope">
            <span class="ellipsis-cell" :title="scope.row.previewPrompt">{{ scope.row.previewPrompt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="模型提示词" align="center" prop="modelPrompt" width="150">
          <template slot-scope="scope">
            <span class="ellipsis-cell" :title="scope.row.modelPrompt">{{ scope.row.modelPrompt }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="150" />
         <el-table-column label="图片" align="center" prop="iconUrl" width="100">
        <template slot-scope="scope">
          <image-preview :src="scope.row.iconUrl" :width="50" :height="50"/>
        </template>
      </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" align="center" prop="updateTime" width="160">
          <template slot-scope="scope">
            <span v-if="scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}') }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作人" align="center" prop="createdBy" width="100"  />
         <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            v-if="scope.row.status=='上架'"
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="delist(scope.row)"
            v-hasPermi="['system:summaryTemplate:delist']"
          >下架</el-button>
          <template v-else>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="list(scope.row)"
              v-hasPermi="['system:summaryTemplate:list']"
            >上架</el-button>
          </template>
           <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:summaryTemplate:edit']"
            >编辑</el-button>
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
    <el-dialog :visible.sync="open" width="600px" append-to-body>
  <el-tabs v-model="activeLangTab" @tab-click="handleTabClick">
    <el-tab-pane
      v-for="lang in languageOptions"
      :key="lang.dictCode"
      :label="lang.dictLabel"
      :name="lang.dictValue"
    >
      <div v-for="item in templateList.filter(t => t.langCode === lang.dictValue)" :key="item.langCode">
        <el-form :model="item" label-width="100px">
          <el-form-item label="模板名称">
            <el-input v-model="item.templateName" />
          </el-form-item>
          <el-form-item label="模板分类">
               <el-select  v-model="item.categoryName" placeholder="请选择模板"  @change="handleCategoryChange(item)">
                <el-option
                  v-for="item in templateCategoryList"
                  :key="item.dictCode"
                  :label="item.dictLabel"
                  :value="item.dictLabel"
                  :disabled="item.status == 1"
                >
                  <template #default>
                    <img :src="item.cssClass" alt="icon" style="width:18px;height:18px;margin-right:6px;vertical-align:middle;" />
                    {{ item.dictLabel }}
                  </template>
                </el-option>
              </el-select>
          </el-form-item>
            <el-form-item label="模板编码">
              <el-input v-model="sharedTemplateCode" placeholder="请输入模板编码" />
            </el-form-item>
          <!-- <el-form-item label="预览提示词">
            <el-input v-model="item.previewPrompt" />
          </el-form-item>
           <el-form-item label="模型提示词">
            <el-input v-model="item.modelPrompt" />
          </el-form-item> -->
          
          <el-form-item label="预览提示词">
            <el-input
              type="textarea"
              v-model="item.previewPrompt"
              :autosize="{ minRows: 3, maxRows: 8 }"
              placeholder="请输入预览提示词"
            />
          </el-form-item>
          <el-form-item label="模型提示词">
            <el-input
              type="textarea"
              v-model="sharedModelPrompt"
              :autosize="{ minRows: 3, maxRows: 8 }"
              placeholder="请输入模型提示词"
            />
          </el-form-item>
          <el-form-item label="图片" prop="iconUrl">
            <image-upload v-model="sharedIconUrl" :limit="1"/>
          </el-form-item>
          <el-form-item label="会员类型">
            <el-checkbox-group v-model="sharedRightsLevel" @change="handleRightsLevelChange">
              <el-checkbox
                v-for="type in rightLevelOptions"
                :key="type.dictValue"
                :label="type.dictValue"
              >
                {{ type.dictLabel }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </el-form>
      </div>
    </el-tab-pane>
    </el-tabs>
    <div slot="footer" class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
     </div>
</el-dialog>
  </div>
</template>

<script>
import { listSummaryTemplate,updateSummaryTemplate,updateSummaryTemplateBatch,addSummaryTemplateBatch,listTemplateCategory,getInfoList } from "@/api/system/fileManage";
import { getDicts } from "@/api/system/dict/data";
import { MessageBox, Message } from 'element-ui'
export default {
  name: "FileManage",
  data() {
    return {
        sharedTemplateCode: '',
      sharedRightsLevel: [],
      sharedModelPrompt: '',
      sharedIconUrl: '',
      currentLang:'zh',
      activeLangTab: 'zh',
      // 加载状态
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 文件列表
      summaryRecord: [],
      templateCategoryList:[],
      cnTemplateCategoryList:[],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        templateName: null,
        categoryCode: null,
        status:null,
        langCode:'zh'
      },
      // 语言选项（从字典获取）
      languageOptions: [],
      // 表格最大高度
      tableMaxHeight: 600,
      // 模型列表
      modelList: [],
           // 表单校验
            rules: {
              templateName: [
                { required: true, message: "模板名称不能为空", trigger: "blur" }
              ],
              categoryName: [
                { required: true, message: "模板分类不能为空", trigger: "change" }
              ]
            },
      // 表单参数
      form: {},
      open:false,
      title:'编辑模板',
      templateList: [],
      languageCodeList:[]
    };
  },
  created() {
    this.getList();
    this.loadLanguageDict()
    this.updateTableHeight();
    this.getTemplateCategory()
    this.loadRightLevelDict()
    window.addEventListener('resize', this.updateTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
  },
  computed: {
    calculatedTableHeight() {
      const searchHeight = this.showSearch ? 100 : 0;
      const toolbarHeight = 50;
      const paginationHeight = 60;
      return window.innerHeight - 200 - searchHeight - toolbarHeight - paginationHeight;
    }
  },
  methods: {
        handleRightsLevelChange(val) {
          // 规则：2->2,3；4->4,5；2,4->2,3,4,5
          // 如果2没选，3也不能有；如果4没选，5也不能有
          let expanded = [];
          if (Array.isArray(val)) {
            // 先判断2和4是否被选中
            const has2 = val.includes('2');
            const has4 = val.includes('4');
            val.forEach(v => {
              if (v === '2') {
                expanded.push('2', '3');
              } else if (v === '4') {
                expanded.push('4', '5');
              } else if (v !== '3' && v !== '5') {
                // 3和5只能由2和4带出，不能单独选
                expanded.push(v);
              }
            });
            // 去重
            expanded = [...new Set(expanded)];
            // 如果2没选，移除3
            if (!has2) {
              expanded = expanded.filter(x => x !== '3');
            }
            // 如果4没选，移除5
            if (!has4) {
              expanded = expanded.filter(x => x !== '5');
            }
          }
          this.sharedRightsLevel = expanded;
          this.templateList.forEach(t => t.rightsLevel = [...expanded]);
        },
    handleAdd() {
      // 多语言支持
      this.sharedRightsLevel = [];
      this.sharedModelPrompt = '';
      this.sharedIconUrl = '';
        this.sharedTemplateCode = '';
      this.templateList = this.languageOptions.map(lang => ({
        langCode: lang.dictValue,
        templateName: '',
        categoryName: '',
        categoryCode: '',
        rightsLevel: []
      }));
      this.title = '新增模板';
      this.open = true;
      this.isAdd = true;
    },
    handleCategoryChange(item) {
    const selected = this.templateCategoryList.find(cat => cat.dictLabel === item.categoryName);
    item.categoryCode = selected ? selected.dictValue : '';
    },
    async handleTabClick(tab, event) {
      this.currentLang = tab.name;
      this.templateCategoryList = (await listTemplateCategory(this.currentLang)).data  || [];
    },
     /** 获取模板分类 */
    getTemplateCategory(){
            listTemplateCategory('zh').then((res)=>{
                this.cnTemplateCategoryList = res.data || [];
                this.templateCategoryList = res.data || [];
            })
    },
      /** 修改按钮操作 */
    handleUpdate(row) {
      this.isAdd = false;
      this.title = '修改模板';
      getInfoList(row.templateCode).then(response => {
        const list = (response.data || [])
        // 取第一个语言的 rightsLevel 赋值给公共字段，字符串转数组
        const firstRightsLevel = list[0]?.rightsLevel;
        if (typeof firstRightsLevel === 'string') {
          this.sharedRightsLevel = firstRightsLevel ? firstRightsLevel.split(',') : [];
        } else if (Array.isArray(firstRightsLevel)) {
          this.sharedRightsLevel = [...firstRightsLevel];
        } else {
          this.sharedRightsLevel = [];
        }
        this.sharedModelPrompt = list[0]?.modelPrompt || '';
        this.sharedIconUrl = list[0]?.iconUrl || '';
        this.sharedTemplateCode = list[0]?.templateCode || '';
        // 同步所有 item 的 rightsLevel
        this.templateList = list
        this.open = true;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
    },
      /** 提交按钮 */
    submitForm() {
      // 提交前同步公共 rightsLevel 到所有 item
      const submitList = this.templateList.map(item => ({
        ...item,
        rightsLevel: Array.isArray(this.sharedRightsLevel) ? this.sharedRightsLevel.join(',') : (this.sharedRightsLevel || ''),
        modelPrompt: this.sharedModelPrompt,
        iconUrl: this.sharedIconUrl
          ,templateCode: this.sharedTemplateCode
      }));
        // 校验：模板编码必填
        if (!this.sharedTemplateCode || !this.sharedTemplateCode.trim()) {
          this.$modal.msgError("模板编码不能为空");
          return;
        }
      // 校验：必须有一项模板名称和模板分类都不为空
      const hasValid = submitList.some(item => item.templateName && item.categoryName);
      if (!hasValid) {
        this.$modal.msgError("请至少填写一项的模板名称和模板分类");
        return;
      }
      if (this.isAdd) {
        addSummaryTemplateBatch(submitList).then(response => {
          this.$modal.msgSuccess("新增成功");
          this.open = false;
          this.getList();
        });
      } else {
        updateSummaryTemplateBatch(submitList).then(response => {
          this.$modal.msgSuccess("修改成功");
          this.open = false;
          this.getList();
        });
      }
    },
    delist(row){
    MessageBox.confirm(
        '下架后用户端的入口不再显示此模板',
        '是否下架？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      .then(() => {
        updateSummaryTemplate({
          id:row.id,
          status:0
        }).then(response => {
          Message.success('下架成功')
          this.getList()
        });
      })
      .catch(() => {
        // 取消
      })
    },
    list(row){
         MessageBox.confirm('是否上架？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      .then(() => {
        updateSummaryTemplate({
          id:row.id,
          status:1
        }).then(response => {
          Message.success('上架成功')
          this.getList()
        });
      })
      .catch(() => {
        // 取消
      })
    },
    /** 更新表格高度 */
    updateTableHeight() {
      this.$nextTick(() => {
        this.tableMaxHeight = this.calculatedTableHeight;
      });
    },
    /** 查询文件列表 */
    getList() {
      this.loading = true;
      // 转换存储状态查询参数
      listSummaryTemplate(this.queryParams).then(response => {
        this.summaryRecord = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
       /** 加载语言字典数据 */
    loadLanguageDict() {
      getDicts('language_code').then(response => {
        this.languageOptions = response.data || [];
        this.languageCodeList = response.data.map(item=>item.dictValue)
      }).catch(() => {
        this.languageOptions = [];
      });
    },
    loadRightLevelDict(){
      getDicts('rights_level').then(response => {
        this.rightLevelOptions = response.data || [];
      }).catch(() => {
        this.rightLevelOptions = [];
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
      this.handleQuery();
    },
    /** 格式化时长 */
    formatDuration(seconds) {
      if (!seconds) return '0';
      return seconds.toString();
    },
    /** 格式化文件大小 */
    formatFileSize(size) {
      if (!size) return '0';
      return size.toFixed(2);
    },
    /** 双击单元格 */
    handleCellDblClick(row, column, cell, event) {
      // 可以在这里添加双击查看详情的逻辑
    },
  }
};
</script>

<style scoped>
.admin-page-container {
  padding: 20px;
}

.admin-table-wrapper {
  overflow-x: auto;
}
.dialog-footer {
  text-align: center;
}
.ellipsis-cell {
  display: inline-block;
  max-width: 130px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}
</style>


