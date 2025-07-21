import type { CardData } from "../apis/type"
import { ref } from "vue"
import { addCard, deleteCard, getCardData, updateCard } from "../apis"

export function useCardMgr() {
  const cardMgrDialog = ref(false) // 卡号管理主dialog
  const cardEditDialog = ref(false) // 新增/编辑dialog
  const form = ref<CardData>({
    cardNumber: "",
    startDate: "",
    endDate: "",
    description: ""
  })
  const formRef = ref()
  const cardList = ref<CardData[]>([])
  const loading = ref(false)
  const isEdit = ref(false)

  const formRules = {
    cardNumber: [{ required: true, message: "请输入卡号", trigger: "blur" }],
    startDate: [{ required: true, message: "请选择开始时间", trigger: "change" }],
    endDate: [{ required: true, message: "请选择结束时间", trigger: "change" }]
  }

  function openDialog() {
    cardMgrDialog.value = true
    fetchCardList()
  }

  async function fetchCardList() {
    loading.value = true
    try {
      const res = await getCardData()
      cardList.value = res.data || []
    } finally {
      loading.value = false
    }
  }

  function handleEdit(data: CardData) {
    isEdit.value = true
    cardEditDialog.value = true
    form.value = {
      id: data.id,
      cardNumber: data.cardNumber,
      startDate: data.startDate,
      endDate: data.endDate,
      description: data.description
    }
  }

  function handleAdd() {
    isEdit.value = false
    cardEditDialog.value = true
    form.value = {
      cardNumber: "",
      startDate: "",
      endDate: "",
      description: ""
    }
  }

  async function handleSave() {
    await formRef.value?.validate?.()
    loading.value = true
    try {
      if (form.value.id === undefined) {
        console.log("添加卡号", form.value)
        await addCard(form.value)
      } else {
        console.log("编辑卡号", form.value)
        await updateCard(form.value.id, form.value)
      }
      fetchCardList()
      cardEditDialog.value = false
    } catch {
      ElMessage.error("操作失败")
    } finally {
      loading.value = false
    }
  }

  async function handleDelete(data: CardData) {
    ElMessageBox.confirm(`正在删除卡号：${data.cardNumber}，确认删除？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }).then(async () => {
      loading.value = true
      try {
        await deleteCard(data.id!)
        fetchCardList()
        ElMessage.success("删除成功")
      } catch {
        ElMessage.error("删除失败")
      } finally {
        loading.value = false
      }
    })
  }

  return {
    cardMgrDialog,
    cardEditDialog,
    form,
    formRef,
    cardList,
    loading,
    isEdit,
    formRules,
    openDialog,
    fetchCardList,
    handleEdit,
    handleAdd,
    handleSave,
    handleDelete
  }
}
