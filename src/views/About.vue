<template>
  <div class="about">
    <h1>This is an about page desu~~~~</h1>
    <pre style="background-color:#c0c0c0; text-align:left">
      {{ userFormatted }}
    </pre>
  </div>
</template>


<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

import { createDecorator } from 'vue-class-component';

export const Meta = createDecorator((options, key) => {
  if (options.methods != null) {
    options.metaInfo = options.methods[key];
  }
});

@Component({
})
export default class About extends Vue {
  protected user: any = {};

  public async mounted() {
    this.user = (await axios.get(process.env.VUE_APP_SOME_USER_API_ENDPOINT)).data.result;
  }

  public get userFormatted() {
    return JSON.stringify(this.user, null, 2);
  }

  @Meta
  public mymetaInfo() {

    // tslint:disable-next-line
    console.log(this.user);

    return {
      title: 'yeeee',
      meta: [
        { vmid: 'og:title', property: 'og:title', content: this.user.nickname + ' - hogehoge' },
        { vmid: 'og:type', property: 'og:type', content: 'article' },
        // { vmid: 'og:image', property: 'og:image', content: this.currentMediaUrl },
        { vmid: 'og:description', property: 'og:description', content: this.user.nickname + ' - hogehoge' },
        { vmid: 'og:url', property: 'og:url', content: `http://localhost:3000/about?hoge` },
        { vmid: 'og:site_name', property: 'og:site_name', content: 'sitename' },
        { vmid: 'og:locale', property: 'og:locale', content: 'ja_JP' },
      ],
    };
  }
}
</script>
