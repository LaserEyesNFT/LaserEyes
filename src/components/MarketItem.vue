<template>
  <div>
    <div id='nft'>
      <div id='tid'>#{{nftData.tid == 0 ? 'id' : nftData.tid}}</div>
      <el-tooltip effect="dark" :content="nftData.bio" placement="top">
        <div>
          <img id='img' :src='"https://ipfs.io/ipfs/"+(nftData.cid.length>0 ? nftData.cid : "QmeiJEqLynPN8c13ZQKdo8VMyK62whnn1DWQrEF6dZTzep")' />
          <img v-if="bsold" id='so' src="../assets/so.png" alt="">
        </div>
      </el-tooltip>
      <span id='heart' v-if="nftData['h'] && nftData['h']>=5">
        <img src="../assets/heart.png" width="16" height="16" />
        <label id='h'>{{nftData['h']}}</label>
      </span>
      <div id='name'>{{nftData.name}}</div>
      <div id='price'>{{nftData.price/1000000}} STX</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MarketItem',
  props: ['nftData', 'bsold'],
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#nft {
  border: 1px solid #ccc;
  border-radius: 8px;
  width: 168px;
  height: 250px;
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
  font-size: 14px;
  color: #999;
  margin: 4px auto;
}
#name {
  font-size: 16px;
  margin-top: 4px;
}
#price {
  margin-top: 6px;
  font-size: 18px;
  color: #c00;
}
#so {
  position: absolute;
  top: 60px;
  left: -10px;
}
#heart {
  position: absolute;
  top: 5px;
  left: 5px;
}
#h {
  vertical-align: top;
  margin-left: -2px;
}

</style>
