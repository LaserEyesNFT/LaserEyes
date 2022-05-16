<template>
  <div id='header'>
    <a class="menua topleft" href="./">
      <img id='logo' src="../assets/logo.png" />
      <span id='title'>Laser eyes</span>
      <img id='leye' src="../assets/dot.png" />
    </a>
    <div class='topright'>
        <a :style='{"fontWeight":(menu=="mine"?"bold":"normal")}' class='menua' target="_blank" href="mine.html">Mine</a>
        <a :style='{"fontWeight":(menu=="chatroom"?"bold":"normal")}' class='menua' target="_blank" href="chatroom.html">Chatroom</a>
        <a :style='{"fontWeight":(menu=="clubs"?"bold":"normal")}' class='menua' target="_blank" href="clubs.html">Clubs</a>
        <a :style='{"fontWeight":(menu=="market"?"bold":"normal")}' class='menua' target="_blank" href="market.html">Marketplace</a>
        <a :style='{"fontWeight":(menu=="about"?"bold":"normal")}' class='menua' target="_blank" href="about.html">About</a>
        <el-button type="primary" round @click="onClickLoginIn" v-if='!bSignedIn'>Sign in</el-button>
        <el-button type="info" round @click="onClickLoginOut" v-if='bSignedIn'>Sign out</el-button>
    </div>
  </div>
</template>

<script>
import { userSession, loginIn, loginOut } from '../stacks/auth'

export default {
  name: 'MenuBar',
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
    }
  },
  props: ['menu'],
  async mounted() {
    // pass
  },
  methods: {
    onClickLoginIn() {
      loginIn()
    },
    onClickLoginOut() {
      loginOut()
    }
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#header {
  width: 100%;
  height: 60px;
  position: fixed;
  top: 0;
  background: white;
  border-bottom: 1px solid #eee;
  z-index: 100;
}
.topleft, .topright {
  padding-top: 12px;
}

#leye {
  position: absolute;
  left: 4px;
  top: 0px;
  animation: hoverImgAnim 10s infinite;
}
@keyframes hoverImgAnim {
  50% {transform: rotate(90deg);}
}

#logo {
  margin-left: 16px;
  width: 40px;
  height: 40px;
}
#title {
  font-size: 26px;
  vertical-align: top;
  display: inline-block;
  margin-left: 1px;
  margin-top: 8px;
}
.menua {
  color: black;
  font-size: 20px;
  text-decoration: none;
  margin-right: 20px;
  display: inline-block;
}
.topright {
  float: right;
  margin-right: 16px;
}

</style>
