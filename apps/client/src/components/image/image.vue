<script setup lang="ts">
import { CloseOutlined } from "@ant-design/icons-vue"

interface Props {
  src: string
}

const props = defineProps<Props>()
const visible = defineModel({ default: false })

function handleImageDownload() {
  fetch(props.src, {
    mode: 'cors',
  })
    .then(async (res) => {
      const blob = await res.blob();

      return blob;
    })
    .then((blob) => {
      // 创建隐藏的可下载链接
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = URL.createObjectURL(blob);
      // 保存下来的文件名
      a.download = `${new Date().getTime()}.${blob.type.replace('image/', '')}`;

      a.click();
    });
}

function handleImageHidden() {
  visible.value = false;
}
</script>

<template>
  <div v-if="visible" class="image-preview">
    <div class="preview-header">
      <slot name="header"></slot>
      <CloseOutlined class="close-icon" :style="{ fontSize: '22px', color: '#fff' }" @click="handleImageHidden">
      </CloseOutlined>
    </div>

    <div class="image-content">
      <img :src="src" draggable="false" />
    </div>
    <div class="slot-content">
      <slot>
      </slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.image-preview {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;

  background-color: rgba(0, 0, 0, 0.45);

  display: flex;
  justify-content: center;
  align-items: center;
  gap: 100px;
  z-index: 10;

  .preview-header {
    position: absolute;
    width: 100%;
    padding-top: 20px;
    padding-right: 20px;
    display: flex;
    justify-content: flex-end;
    gap: 30px;
    top:0;
    .close-icon {
      cursor: pointer;
    }
  }

  .image-content {
    width: 450px;
    height: 670px;

    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  }

}
</style>
