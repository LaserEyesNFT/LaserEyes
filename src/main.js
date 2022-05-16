// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import MainPage from './MainPage'
// import ElementUI from 'element-ui'
// import '../node_modules/element-ui/lib/theme-chalk/index.css'

Vue.config.productionTip = false
// Vue.use(ElementUI)

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { MainPage },
  template: '<MainPage/>'
})
