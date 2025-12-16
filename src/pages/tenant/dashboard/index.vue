<script lang="ts" setup>
import ProjectCard from "./components/ProjectCard.vue"
import SectionBar from "./components/SectionBar.vue"
import TenantCard from "./components/TenantCard.vue"

const projectCount = ref(3)

interface Project {
  id: number
  name: string
  code: string
  status: "正常" | "告警"
  statusClass?: string // 'alert' for warning/danger
  location: string
  modelCount: number
  network: string
  totalDevices: number
  onlineDevices: number
  onlineClass?: string
  traffic: string
  health: number
  healthClass?: string // 'warn' etc.
  lastUpdated: string
}

// --- Data ---

const projects = ref<Project[]>([
  {
    id: 1,
    name: "测试项目1",
    code: "PROJ-DH01",
    status: "正常",
    location: "上海",
    modelCount: 2,
    network: "4G/Sat",
    totalDevices: 128,
    onlineDevices: 126,
    onlineClass: "c-green",
    traffic: "4.2G",
    health: 98,
    lastUpdated: "刚刚"
  },
  {
    id: 2,
    name: "测试项目2",
    code: "PROJ-PAC02",
    status: "告警",
    statusClass: "alert",
    location: "太平洋",
    modelCount: 2,
    network: "Sat Only",
    totalDevices: 45,
    onlineDevices: 42,
    onlineClass: "c-warning",
    traffic: "120M",
    health: 85,
    healthClass: "warn",
    lastUpdated: "5分钟前"
  },
  {
    id: 3,
    name: "测试项目3",
    code: "PROJ-CJ03",
    status: "正常",
    location: "江苏",
    modelCount: 1,
    network: "4G",
    totalDevices: 210,
    onlineDevices: 210,
    onlineClass: "c-green",
    traffic: "8.5G",
    health: 100,
    lastUpdated: "10分钟前"
  }
])

const router = useRouter()

function goToProject() {
  router.push(`/console/${router.currentRoute.value.params.tenantIdentifier}/project/123231`)
}
</script>

<template>
  <div>
    <TenantCard />

    <!-- <div class="kpi-row">
        <div v-for="(kpi, idx) in kpis" :key="idx" class="kpi-card">
          <div class="kpi-header">
            <span class="kpi-label">{{ kpi.label }}</span>
            <i class="kpi-icon" :class="[kpi.icon]" />
          </div>
          <div class="kpi-main">
            <span class="kpi-val" :class="kpi.valueClass">{{ kpi.value }}</span>
            <span v-if="kpi.sub" class="kpi-sub" :class="kpi.subClass">{{ kpi.sub }}</span>
          </div>
        </div>
      </div> -->

    <SectionBar title="项目列表" :count="projectCount" />

    <div class="grid-view">
      <ProjectCard
        v-for="p in projects"
        :key="p.id"
        :name="p.name"
        :code="p.code"
        :status="p.status"
        :status-class="p.statusClass"
        :health="p.health"
        :total-devices="p.totalDevices"
        :online-devices="p.onlineDevices"
        :online-class="p.onlineClass"
        :last-updated="p.lastUpdated"
        @click="goToProject()"
      >
        <template #tags>
          <span class="pc-tag"><i class="fas fa-map-marker-alt" /> {{ p.location }}</span>
          <span class="pc-tag"><i class="fas fa-cubes" /> {{ p.modelCount }} 型号</span>
          <span class="pc-tag"><i class="fas fa-network-wired" /> {{ p.network }}</span>
        </template>
      </ProjectCard>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.tenant-card {
  margin-bottom: 20px;
}

.section-bar {
  margin-bottom: 20px;
}

// --- KPI Cards ---
.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
  .kpi-card {
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    height: 110px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .kpi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      .kpi-label {
        font-size: 12px;
        color: var(--text-sub);
        font-weight: 600;
      }
      .kpi-icon {
        color: var(--text-sub);
        opacity: 0.5;
        font-size: 16px;
      }
    }
    .kpi-main {
      display: flex;
      align-items: baseline;
      gap: 8px;
      .kpi-val {
        font-size: 30px;
        font-weight: 700;
        letter-spacing: -1px;
      }
      .kpi-sub {
        font-size: 13px;
        font-weight: 500;
      }
    }
  }
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;

  .pc-tag {
    font-size: 11px;
    padding: 4px 8px;
    background: #f8fafc;
    border-radius: 4px;
    color: var(--text-sub);
    border: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 5px;
    i {
      color: var(--text-sub);
    }
  }
}

// Mobile
@media (max-width: 900px) {
  .tenant-card {
    margin-bottom: 10px;
  }
  .section-bar {
    margin-bottom: 10px;
  }
  .grid-view {
    gap: 10px;
  }
  .kpi-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
}
</style>
