declare module "*.vue" {
  import Vue from "vue";
  export default Vue;

  module "vue/types/options" {
    interface ComponentOptions<V extends Vue> {
      layout?: string;
      // metaInfo?: any;
    }
  }
}
