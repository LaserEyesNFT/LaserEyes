<template>
  <div>
    <div id='nft'>
      <!-- <div id='tid'>#{{clubData.tid == 0 ? 'id' : clubData.tid}}</div> -->
      <div id='tid'>&nbsp;</div>
      <el-tooltip effect="dark" :content="clubData.bio" placement="top">
        <img id='img' :src='"https://ipfs.io/ipfs/"+(clubData.cid.length>0 ? clubData.cid : "QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep")' />
      </el-tooltip>
      <el-tooltip effect="dark" content="I am administrator" placement="top" v-if='bAdmin'>
        <i class="el-icon-s-custom admin"></i>
      </el-tooltip>
      <div id='name'>{{clubData.name}}</div>
      <div id='actbtns' v-if='act'>
        <el-button v-if='act==2||act==3' type="success" round size='mini' @click.stop='h(true, $event)'>{{act==2?'Accept':'Apply'}}</el-button>
        <el-button v-if='(act==1)||(act==2)' type="warning" round size='mini' @click.stop="h(false, $event)">{{act==1 ? "Cancel" : "Decline"}}</el-button>
      </div>
      <el-button id='edit' v-if='bEdit' type="text" icon="el-icon-more" @click="edit"></el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClubItem',
  props: ['clubData', 'act', 'bEdit', 'bAdmin'],
  methods: {
    h(v, e) {
      this.$emit('click', v)
    },
    edit() {
      this.$emit('edit')
    }
  },
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#nft {
  border: 2px solid gold;/* #ccc;*/
  border-radius: 8px;
  width: 168px;
  line-height: 18px;
  text-align: center;
  position: relative;
}
#img {
  width: 168px;
  height: 168px;
  border-radius: 84px;
}
#tid {
  height: 0px;
}
#name {
  font-size: 16px;
  margin: 6px auto;
}
#actbtns {
  margin-bottom: 6px;
}
#edit {
  position: absolute;
  right: 6px;
  top: -8px;
  transform: scale(1.5);
}
.admin {
  position: absolute;
  right: 8px;
  top: 8px;
}

</style>
