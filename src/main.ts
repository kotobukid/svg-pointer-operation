import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

document.body.addEventListener('touchmove', function(event) {
  event.preventDefault();
}, { passive: false });

new Vue({
  render: h => h(App),
}).$mount('#app')
