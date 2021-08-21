<template lang="pug">
  #app
    svg(width="480" height="600")
      rect(x="0" y="0" width="480" height="600" fill="pink")
      circle(cx="240" cy="300" r="100" stroke="black" stroke-width="1" fill="transparent")
</template>

<script lang="ts">
import {Component, Vue} from 'vue-property-decorator';
import HelloWorld from './components/HelloWorld.vue';

@Component({
  components: {
    HelloWorld,
  },
})
export default class App extends Vue {
}
</script>

<style lang="less">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
