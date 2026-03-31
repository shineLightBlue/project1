<template>

  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-form-item label="消息标题" prop="title">
        <el-input
          v-model="queryParams.title"
          clearable
          @keyup.enter.native="handleQuery"
        />
      </el-form-item>
      <el-form-item label="语种" prop="languageCode">
        <el-select v-model="queryParams.languageCode" placeholder="请选择" clearable>
          <el-option
            v-for="dict in dict.type.language_code"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="用户类型" prop="userLevel">
        <el-select v-model="queryParams.userLevel" placeholder="请选择" clearable>
          <el-option
            v-for="dict in dict.type.user_level"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="平台" prop="platform">
        <el-select v-model="queryParams.platform" placeholder="请选择" clearable>
          <el-option
            v-for="dict in dict.type.platform"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="消息类型" prop="messageType">
        <el-select v-model="queryParams.messageType" placeholder="请选择" clearable>
          <el-option
            v-for="dict in dict.type.message_type"
            :key="dict.value"
            :label="dict.label"
            :value="dict.value"
          />
        </el-select>
      </el-form-item>
<!--      <el-form-item label="推送状态" prop="pushStatus">-->
<!--        <el-select v-model="queryParams.pushStatus" placeholder="请选择" clearable>-->
<!--          <el-option-->
<!--            v-for="dict in dict.type.push_status"-->
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
          v-hasPermi="['message:message:add']"
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
          v-hasPermi="['message:message:edit']"
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
          v-hasPermi="['message:message:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['message:message:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>
    <div class="message-table-box">
      <el-table v-loading="loading" :data="messageList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="消息标题" align="center" prop="title" />
      <el-table-column label="消息类型" align="center" prop="messageType">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.message_type || []" :value="scope.row.messageType" />
        </template>
      </el-table-column>
      <el-table-column label="消息内容" align="center">
        <template slot-scope="scope">
          <!-- Tooltip 预览整段富文本 -->
          <el-tooltip
            effect="light"
            placement="top"
            :open-delay="300"
          >
            <!-- tooltip 显示内容（富文本） -->
            <div slot="content" v-html="scope.row.content" style="max-width:400px;"></div>
            <!-- 表格里显示摘要 -->
            <span class="ellipsis-text">
        {{ getSummary(scope.row.content) }}
      </span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="详情跳转链接" align="center">
        <template slot-scope="scope">
          <div v-if="scope.row.detailUrl">
            <a :href="scope.row.detailUrl" target="_blank" rel="noreferrer">
              {{ scope.row.detailUrl }}
            </a>
          </div>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="语种" align="center" prop="languageCode">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.language_code" :value="scope.row.languageCode"/>
        </template>
      </el-table-column>
      <el-table-column label="用户等级" align="center" prop="userLevel">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.user_level" :value="scope.row.userLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="平台" align="center" prop="platform">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.platform" :value="scope.row.platform"/>
        </template>
      </el-table-column>
      <el-table-column label="推送时间" align="center" prop="pushTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.pushTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="过期时间" align="center" prop="expireTime" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.expireTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="推送状态" align="center" prop="pushStatus">
        <template slot-scope="scope">
          <span>{{ getPushStatusLabel(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启用状态" align="center" prop="status">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === '1' ? 'success' : 'info'">
            {{ scope.row.status === '1' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="启用开关" align="center" prop="status">
        <template slot-scope="scope">
          <el-switch
            v-model="scope.row.status"
            active-value="1"
            inactive-value="0"
            @change="changeStatus(scope.row)"
          ></el-switch>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.updateBy || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作时间" align="center" width="180">
        <template slot-scope="scope">
          <span>
            {{ scope.row.updateTime ? parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') : '-' }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['message:message:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['message:message:remove']"
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
    <!-- 添加或修改message对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1000px" append-to-body>
      <!-- 共用字段 -->
      <el-form label-width="100px" style="margin-bottom: 20px; padding: 15px; background: #f5f7fa; border-radius: 4px;">
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="消息类型" required>
              <el-select v-model="sharedFields.messageType" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.message_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="用户等级" required>
              <el-select v-model="sharedFields.userLevel" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.user_level"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="平台" required>
              <el-select v-model="sharedFields.platform" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.platform"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="详情链接">
              <el-input v-model="sharedFields.detailUrl" placeholder="请输入详情跳转链接" clearable />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="推送时间">
              <el-date-picker
                v-model="sharedFields.pushTime"
                type="datetime"
                placeholder="选择推送时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="过期时间">
              <el-date-picker
                v-model="sharedFields.expireTime"
                type="datetime"
                placeholder="选择过期时间"
                format="yyyy-MM-dd HH:mm:ss"
                value-format="yyyy-MM-dd HH:mm:ss"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 多语言标签页 -->
      <el-tabs v-model="activeLangTab">
        <el-tab-pane
          v-for="lang in dict.type.language_code"
          :key="lang.value"
          :label="lang.label"
          :name="lang.value"
        >
          <el-form v-if="messageListByLang[lang.value]" ref="langForm" :model="messageListByLang[lang.value]" label-width="100px">
            <el-form-item label="消息标题" :required="lang.value === 'zh' || lang.value === 'en'">
              <el-input
                v-model="messageListByLang[lang.value].title"
                maxlength="200"
                show-word-limit
                placeholder="请输入消息标题"
              />
            </el-form-item>
            <el-form-item label="消息内容" :required="lang.value === 'zh' || lang.value === 'en'">
              <el-input
                v-model="messageListByLang[lang.value].content"
                type="textarea"
                maxlength="2000"
                show-word-limit
                :rows="6"
                placeholder="请输入消息内容"
              />
            </el-form-item>
          </el-form>
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
import { listMessage, getMessage, delMessage, addMessage, updateMessage, updateMessageStatus, addMessageBatch, saveMessageBatch } from "@/api/message/message";

export default {
  name: "Message",
  dicts: ['platform', 'language_code', 'user_level', 'message_type', 'push_status'],
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
      // message表格数据
      messageList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        title: null,
        languageCode: 'zh',  // 默认过滤中文
        userLevel: null,
        platform: null,
        messageType: null,
        pushStatus: null,
      },
      // 当前激活的语言标签
      activeLangTab: 'zh',
      // 多语言消息列表
      messageListByLang: {},
      // 共用字段
      sharedFields: {
        messageType: null,
        userLevel: null,
        platform: null,
        detailUrl: null,
        pushTime: null,
        expireTime: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        title: [
          { required: true, message: "内容不能为空", trigger: "blur" }
        ],
        messageType: [
          { required: true, message: "请选择消息类型", trigger: "change" }
        ],
        content: [
          { required: true, message: "内容不能为空", trigger: "blur" }
        ],
        languageCode: [
          { required: true, message: "内容不能为空", trigger: "change" }
        ],
        userLevel: [
          { required: true, message: "内容不能为空", trigger: "change" }
        ],
        platform: [
          { required: true, message: "内容不能为空", trigger: "change" }
        ],
        pushStatus: [
          { required: true, message: "请选择推送状态", trigger: "change" }
        ],
        detailUrl: [
          { required: true, message: "内容不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    changeStatus(row, newStatus) {
      // 备份旧值，以便失败时回滚
      const oldStatus = row.status;
      // 乐观更新 UI
      row.status = newStatus;
      // 标记请求中，禁用开关
      this.$set(row, "_statusLoading", true);

      const payload = {
        id: row.id
      };
      updateMessageStatus(payload)
        .then((res) => {
          // 这里根据你的后端返回结构判断是否成功
          // 例如如果后端 API 返回 { code: 200, msg: '成功' }：
          if (res && res.code === 200) {
            this.$modal.msgSuccess("状态更新成功");
            this.getList();
            }
        })
        .catch((err) => {
          // 回滚 UI
          row.status = oldStatus;
          this.$modal.msgError("状态更新失败，请重试");
          console.error("changeStatus error:", err);
        })
        .finally(() => {
          // 解除禁用
          this.$set(row, "_statusLoading", false);
        });
    },
    /** 查询message列表 */
    getList() {
      this.loading = true;
      listMessage(this.queryParams).then(response => {
        let rows = Array.isArray(response.rows) ? response.rows.slice() : [];
        rows.sort((a, b) => {
          const aTime = a && a.pushTime ? new Date(a.pushTime).getTime() : 0;
          const bTime = b && b.pushTime ? new Date(b.pushTime).getTime() : 0;
          return bTime - aTime;
        });
        if (this.queryParams.pushStatus !== null && this.queryParams.pushStatus !== "" && typeof this.queryParams.pushStatus !== "undefined") {
          const selectedLabel = this.getDictLabelByValue(this.dict.type.push_status || [], this.queryParams.pushStatus);
          rows = rows.filter(row => {
            const label = this.getPushStatusLabel(row);
            return selectedLabel ? label === selectedLabel : false;
          });
        }
        this.messageList = rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 截取一段摘要
    getSummary(html) {
      if (!html) return '';
      // 去掉 HTML 标签
      const text = html.replace(/<[^>]+>/g, '');
      return text.length > 50 ? text.substring(0, 50) + '...' : text;
    },
    getPushStatusLabel(row) {
      const pushTime = this.getPushTimestamp(row && row.pushTime);
      if (!pushTime) return '-';
      return pushTime > Date.now() ? '未推送' : '已推送';
    },
    getPushTimestamp(value) {
      if (!value && value !== 0) return null;
      if (typeof value === "number") {
        return value < 1000000000000 ? value * 1000 : value;
      }
      if (typeof value === "string") {
        const numeric = Number(value);
        if (!Number.isNaN(numeric)) {
          return numeric < 1000000000000 ? numeric * 1000 : numeric;
        }
        const normalized = value.replace(/-/g, "/");
        const time = new Date(normalized).getTime();
        return Number.isNaN(time) ? null : time;
      }
      return null;
    },
    getDictLabelByValue(options, value) {
      const found = options.find(item => String(item.value) === String(value));
      return found ? found.label : "";
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
        title: null,
        messageType: null,
        content: null,
        languageCode: null,
        userLevel: null,
        platform: null,
        detailUrl: null,
        pushStatus: null,
        pushTime: null,
        createTime: null,
        status: null,
        expireTime: null,
        operName: null,
        operTime: null,
      };
      this.sharedFields = {
        messageType: null,
        userLevel: null,
        platform: null,
        detailUrl: null,
        pushTime: null,
        expireTime: null
      };
      this.messageListByLang = {};
      this.activeLangTab = 'zh';
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
      // 初始化共用字段
      this.sharedFields = {
        messageType: null,
        userLevel: null,
        platform: null,
        detailUrl: null,
        pushTime: null,
        expireTime: null
      };
      // 初始化多语言消息列表
      this.messageListByLang = this.dict.type.language_code.reduce((acc, lang) => {
        acc[lang.value] = {
          languageCode: lang.value,
          title: '',
          content: ''
        };
        return acc;
      }, {});
      this.activeLangTab = 'zh';
      this.open = true;
      this.title = "添加消息";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids[0];
      
      // 查询该消息的所有语言版本
      // 通过 title 来查找同一消息的不同语言版本（假设标题在不同语言版本中有关联）
      // 更好的做法是在数据库中添加一个 message_group_id 字段来关联不同语言版本
      // 这里先简单处理：查询列表，筛选出相同共用字段的消息
      getMessage(id).then(response => {
        const currentMsg = response.data;
        
        // 设置共用字段
        this.sharedFields = {
          messageType: currentMsg.messageType,
          userLevel: currentMsg.userLevel,
          platform: currentMsg.platform,
          detailUrl: currentMsg.detailUrl,
          pushTime: currentMsg.pushTime,
          expireTime: currentMsg.expireTime
        };
        
        // 查询所有语言版本（通过相同的推送时间和用户等级来匹配）
        listMessage({
          userLevel: currentMsg.userLevel,
          platform: currentMsg.platform,
          pushTime: currentMsg.pushTime,
          pageNum: 1,
          pageSize: 100
        }).then(listRes => {
          if (listRes.rows && listRes.rows.length > 0) {
            // 找出所有相关的语言版本
            const relatedMessages = listRes.rows.filter(m => 
              m.userLevel === currentMsg.userLevel &&
              m.platform === currentMsg.platform &&
              m.pushTime === currentMsg.pushTime &&
              m.expireTime === currentMsg.expireTime
            );
            
            // 初始化所有语言版本
            this.messageListByLang = this.dict.type.language_code.reduce((acc, lang) => {
              const existingMsg = relatedMessages.find(m => m.languageCode === lang.value);
              acc[lang.value] = existingMsg ? {
                id: existingMsg.id,
                languageCode: lang.value,
                title: existingMsg.title,
                content: existingMsg.content
              } : {
                languageCode: lang.value,
                title: '',
                content: ''
              };
              return acc;
            }, {});
          } else {
            // 如果查询失败，只初始化当前语言版本
            this.messageListByLang = this.dict.type.language_code.reduce((acc, lang) => {
              acc[lang.value] = {
                languageCode: lang.value,
                title: lang.value === currentMsg.languageCode ? currentMsg.title : '',
                content: lang.value === currentMsg.languageCode ? currentMsg.content : ''
              };
              return acc;
            }, {});
            if (this.messageListByLang[currentMsg.languageCode]) {
              this.messageListByLang[currentMsg.languageCode].id = currentMsg.id;
            }
          }
          
          this.activeLangTab = 'zh';
          this.open = true;
          this.title = "修改消息";
        });
      });
    },

    /** 提交按钮 */
    submitForm() {
      // 验证共用字段
      if (!this.sharedFields.messageType) {
        this.$modal.msgError('请选择消息类型');
        return;
      }
      if (!this.sharedFields.userLevel) {
        this.$modal.msgError('请选择用户等级');
        return;
      }
      if (!this.sharedFields.platform) {
        this.$modal.msgError('请选择平台');
        return;
      }
      
      // 验证中文和英文必填
      const zhMsg = this.messageListByLang['zh'];
      const enMsg = this.messageListByLang['en'];
      
      if (!zhMsg || !zhMsg.title || !zhMsg.content) {
        this.$modal.msgError('中文消息标题和内容为必填项');
        this.activeLangTab = 'zh';
        return;
      }
      
      if (!enMsg || !enMsg.title || !enMsg.content) {
        this.$modal.msgError('英文消息标题和内容为必填项');
        this.activeLangTab = 'en';
        return;
      }
      
      // 组装完整的消息数据（包含共用字段）
      const messagesData = Object.values(this.messageListByLang).map(m => ({
        ...m,
        ...this.sharedFields
      }));
      
      this.$modal.confirm('是否确认提交该消息？').then(() => {
        // 后端会自动判断哪些需要新增，哪些需要更新
        saveMessageBatch(messagesData).then(() => {
          this.$modal.msgSuccess("操作成功");
          this.open = false;
          this.getList();
        }).catch(error => {
          console.error('保存失败:', error);
          this.$modal.msgError("保存失败，请重试");
        });
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除message编号为"' + ids + '"的数据项？').then(function() {
        return delMessage(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('message/message/export', {
        ...this.queryParams
      }, `message_${new Date().getTime()}.xlsx`)
    }
  }
};

</script>
<style>
.ellipsis-text {
  display: inline-block;
  max-width: 200px;           /* 列宽可调 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.message-table-box {
  max-height: calc(100vh - 260px);
  overflow-y: auto;
}
.message-table-box .el-table {
  margin-bottom: 0;
}
</style>
