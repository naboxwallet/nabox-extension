<template>
  <div class="home">
    <HelloWorld msg="Welcome to Your Vue.js App" />
    <button @click="toAbout">关于</button>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from "@/components/HelloWorld.vue";

export default {
  name: "Home",
  components: {
    HelloWorld
  },
  methods: {
    toAbout() {
      this.$router.push("/about");
    }
  }
};
</script>
