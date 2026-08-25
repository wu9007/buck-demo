<template>
  <section class="console-page face-archive-page">
    <header class="console-page__header">
      <h1>人脸档案</h1>
      <p>示例业务列表页，复用 Buck HTTP、Element Plus 和 console token。</p>
    </header>

    <el-card class="console-card" shadow="never">
      <form @submit.prevent="load">
        <BrickFilterToolbar field-min-width="180px">
          <el-input v-model="filters.keyword" clearable placeholder="请输入姓名或编号" />
          <el-select v-model="filters.status" clearable placeholder="请选择状态">
            <el-option
              v-for="option in statusOptions"
              :key="String(option.value)"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-date-picker
            v-model="filters.createdRange"
            class="brick-filter-toolbar__field--range"
            type="daterange"
            value-format="YYYY-MM-DD"
            start-placeholder="创建起始日期"
            end-placeholder="创建结束日期"
            clearable
          />

          <template #actions>
            <BrickActionBar>
              <template #secondary>
                <el-button native-type="button" @click="reset">重置</el-button>
              </template>
              <template #primary>
                <el-button type="primary" native-type="submit">查询</el-button>
              </template>
            </BrickActionBar>
          </template>
        </BrickFilterToolbar>
      </form>

      <el-table :data="records" row-key="id">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ENABLED' ? 'success' : 'info'">
              {{ optionLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" />
      </el-table>

      <el-pagination
        v-model:current-page="page.pageNo"
        v-model:page-size="page.pageSize"
        layout="prev, pager, next, sizes, total"
        :total="page.total"
        @current-change="load"
        @size-change="load"
      />
    </el-card>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import { request } from '@wildbuck/core-api-frontend';
import { createOptionRequest, loadBrickOptions } from '@wildbuck/core-option-frontend';
import { BrickActionBar, BrickFilterToolbar } from '@wildbuck/core-ui-frontend/patterns';

const filters = reactive({
  keyword: '',
  status: '',
  createdRange: [],
});
const page = reactive({
  pageNo: 1,
  pageSize: 20,
  total: 0,
});
const records = ref([]);
const statusOptions = ref([]);

async function loadOptions() {
  const payload = await loadBrickOptions([
    createOptionRequest('face_archive_status')
  ]);
  statusOptions.value = payload.face_archive_status || [];
}

async function load() {
  const params = new URLSearchParams({
    pageNo: String(page.pageNo),
    pageSize: String(page.pageSize),
  });
  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.status) params.set('status', filters.status);
  if (filters.createdRange?.[0]) params.set('createdFrom', filters.createdRange[0]);
  if (filters.createdRange?.[1]) params.set('createdTo', filters.createdRange[1]);

  const payload = await request(`/face-archives?${params.toString()}`);
  records.value = payload.records || [];
  page.total = payload.total || 0;
}

function reset() {
  filters.keyword = '';
  filters.status = '';
  filters.createdRange = [];
  page.pageNo = 1;
  void load();
}

function optionLabel(value) {
  return statusOptions.value.find((option) => option.value === value)?.label || value;
}

onMounted(async () => {
  await loadOptions();
  await load();
});
</script>

<style scoped>
.el-pagination {
  margin-top: var(--console-space-4);
  justify-content: flex-end;
}
</style>
