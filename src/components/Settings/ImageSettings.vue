<template>
  <div>
    <div class="text-h4 q-mb-md">
      Output Image settings
    </div>
    Dimension
    <div class="q-gutter-md row items-start">
      <q-input
        v-model.number="dimensions.width"
        label="Width"
        type="number"
        style="max-width: 200px"
      >
        <template v-slot:append>
          px
        </template>
      </q-input>
      <span style="padding-top: 25px">X</span>
      <q-input
        v-model.number="dimensions.height"
        label="Height"
        type="number"
        style="max-width: 200px"
      >
        <template v-slot:append>
          px
        </template>
      </q-input>
    </div>
    <br>
    Background color

    <div class="q-gutter-md row items-start">
      <q-input
        v-model="backgroundColor.value"
        label="BackgroundColor"
        :rules="['anyColor']"
        class="my-input"
      >
        <template v-slot:append>
          <q-icon
            name="colorize"
            class="cursor-pointer"
          >
            <q-popup-proxy
              transition-show="scale"
              transition-hide="scale"
            >
              <q-color v-model="backgroundColor.value" />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
      <q-input
        v-model.number="alpha.value"
        label="Alpha"
        type="number"
        max="1"
        min="0"
        step="0.1"
      />
    </div>
  </div>
</template>

<script>
const { ipcRenderer } = require('electron');

const channelPrefix = 'image.';

export default {
  name: 'ImageSettings',
  data() {
    return {
      dimensions: {
        enabled: true,
        width: 1000,
        height: 1000,
      },
      backgroundColor: {
        enabled: true,
        value: '#ffffff',
      },
      alpha: {
        enabled: true,
        value: 0.0,
      },
    };
  },
  watch: {
    'dimensions.width': {
      handler(after) {
        ipcRenderer.invoke(`${channelPrefix}width.set`, after);
      },
      deep: true,
    },
    'dimensions.height': {
      handler(after) {
        ipcRenderer.send(`${channelPrefix}height`, after);
      },
      deep: true,
    },
    'backgroundColor.value': {
      handler(after) {
        ipcRenderer.send(`${channelPrefix}color`, after);
      },
      deep: true,
    },
    'alpha.value': {
      handler(after) {
        ipcRenderer.send(`${channelPrefix}alpha`, after);
      },
      deep: true,
    },
  },
  async mounted() {
    this.dimensions.width = await ipcRenderer.invoke(`${channelPrefix}width.get`);
    ipcRenderer.invoke(`${channelPrefix}height`).then((result) => {
      this.dimensions.height = result;
    });
    ipcRenderer.invoke(`${channelPrefix}color`).then((result) => {
      this.backgroundColor.value = result;
    });
    ipcRenderer.invoke(`${channelPrefix}alpha`).then((result) => {
      this.alpha.value = result;
    });
  },
};
</script>

<style scoped>

</style>
