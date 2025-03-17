import "reflect-metadata";

import { createApp } from "vue";
import { router } from "@gepick/client/router";
import { pinia } from "@gepick/client/store";
import Gepick from "@gepick/client/kona.vue";
import './setImmediate';

import "@gepick/client/global.scss";
import "ant-design-vue/dist/reset.css";

const app = createApp(Gepick);

app.use(router).use(pinia);
app.mount("#app");
