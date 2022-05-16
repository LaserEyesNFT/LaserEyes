<template>
  <div id='aboutpage'>
    <MenuBar menu='about'></MenuBar>

    <div id='main'>
      <div>
        <img id='img' src='./assets/about.png' width="256" height="256" />
      </div>
      <el-collapse id='coll' v-model="activeNames">
        <el-collapse-item name="1">
          <template slot="title">
            <span class='colTitle'>Abstract</span>
          </template>
          <div>1. Laser eyes NFT project is the first social NFT project build on <a class="mylink" href="https://www.stacks.co/" target="_blank">Stacks</a>, secured by Bitcoin.</div>
          <div>2. There are total 6400 laser eyes NFTs, 1 account can only 1 laser eyes NFT.</div>
          <div>3. Mint fee is 30 STX(half used to reward 20 random holders, each get 0.75 STX).</div>
          <div>4. Each time a NFT is updated(i.e., image or bio get updated by its owner), will reward 4 STX to random 20 holders(each get 0.2 STX).</div>
          <div>5. Each time a NFT is minted, the owner will also get 800 $LASER(designed to be used in the future).</div>
        </el-collapse-item>

        <el-collapse-item name="2">
          <template slot="title">
            <span class='colTitle'>Chatroom</span>
          </template>
          <div>1. Any laser eyes member can chat here for free.</div>
          <div>2. To save blockchain space, contract only saves latest 100000 messages.</div>
        </el-collapse-item>

        <el-collapse-item name="3">
          <template slot="title">
            <span class='colTitle'>Clubs</span>
          </template>
          <div>1. There are at most 99 clubs, create fee is 20 STX(half used to reward 20 random holders, each get 0.5 STX). </div>
          <div>2. Each club can own at most 100 members, each member can join at most 5 clubs.</div>
          <div>3. Club administrator can invite members, accept/decline members' apply, kick out members, publish notice, launch vote.</div>
          <div>4. Members can apply to join club, accept/decline club's invite, launch vote at 2 STX(half used to reward 20 random holders, each get 0.05 STX).</div>
          <div>5. Club members can chat for free(to save blockchain space, please only chat when need).</div>
          <div>6. 1 member can only own 1 club, and can only transfer to members in this club who doesn't owns club yet.</div>
        </el-collapse-item>

        <el-collapse-item name="4">
          <template slot="title">
            <span class='colTitle'>Marketplace</span>
          </template>
          <div>1. Seller fee is 2%, half used to reward random 20 holders.</div>
          <div>2. Each account makes at most 5 non-expired bids simultaneously, bid deposit is the highest bid.</div>
          <div>3. Laser eyes NFT can only be traded through this marketplace, while p2p transfer is still available and free. DO NOT trade it anywhere else, otherwise you'll lost it forever.</div>
        </el-collapse-item>

        <el-collapse-item name="5">
          <template slot="title">
            <span class='colTitle'>Likes</span>
          </template>
          <div>1. Members can give likes to other members, cost 0.5 STX per like, and cannot cancel like. </div>
          <div>2. When A gives like to B, A will cost 0.5 STX. B get 0.1 STX, 0.2 STX used to reward 20 random holders.</div>
          <div>3. If liked count >= 10, will shows in the card; otherwise will only shows in the detail dialog.</div>
          <div>4. Member's liked count will be an important factor for his vote weight in the DAO.</div>
        </el-collapse-item>

        <el-collapse-item name="6">
          <template slot="title">
            <span class='colTitle'>PS</span>
          </template>
          <div>1. If the NFT's image not contains laser eyes, it might be blocked to show.</div>
          <div>2. If the NFT's image file size exceed 500K, it might be blocked to show.</div>
          <div>3. If the NFT's image looks not friendly obviously, it might be blocked to show.</div>
        </el-collapse-item>

        <el-collapse-item name="7">
          <template slot="title">
            <span class='colTitle'>Links</span>
          </template>
          <div>
            <div><a class="mylink" href="https://github.com/LaserEyesNFT/LaserEyes" target="_blank">Github</a></div>
            <div><a class="mylink" href="https://www.reddit.com/r/LaserEyesNFT" target="_blank">Reddit</a></div>
            <div style="margin-top:16px"> Contracts:</div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x0f53235526b6497cd69e9e74a4cfba62824517692e9968314aabf6d1245c7cff?chain=mainnet" target="_blank">Laser token contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x494a5458ed315c7b168edc8fdaa4fb136c3922399c3a7538f3d2f2181e2c752a?chain=mainnet" target="_blank">Laser eyes NFT contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x5a9eec6cc42a6d0354350b9c8e921699cbcdcce2c5abf467a13b2813b9bbdaea?chain=mainnet" target="_blank">Laser eyes NFT marketplace contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x0b068b2b5be8164f3df49b098bd52ece77868f5db0742fbd9b028f3e73fd18b4?chain=mainnet" target="_blank">Startup contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0xb22fa498bbceca74efcba957de1cc310da3084a72d24180d8fb5a3c788fca4b7?chain=mainnet" target="_blank">Like contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x1f62d9d7c72f4e0f06a2eef612f6c20bfb582b7d215a21044ceafa09eb09a889?chain=mainnet" target="_blank">Like startup contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x56d1af58d4b5ff53825ad676d7457157799f47702ff79b15cbe711324d317380?chain=mainnet" target="_blank">Laser eyes club contract</a></div>
            <div><a class="mylink" href="https://explorer.stacks.co/txid/0x19ba9e2bc29eaf9fb0c880755a3ae049b58f211f62c83cf54fa0de001945ed04?chain=mainnet" target="_blank">Laser eyes chatroom contract</a></div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script>
import MenuBar from './components/MenuBar'

export default {
  name: 'AboutPage',
  components: {
    MenuBar: MenuBar,
  },
  data () {
    return {
      activeNames: ['1'],
    }
  },
  async mounted() {
    // pass
  },
  methods: {
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.err {
  font-size: 16px;
  margin-bottom: 16px;
}
#main {
  margin: 92px 168px 32px 168px;
  text-align: center;
}
#brief {
  margin-top: 40px;
  font-size: 30px;
}
#brief>span {
  margin-left: 20px;
  margin-right: 20px
}
.title {
  color: #ccc;
}

#coll {
  text-align: left;
  padding: 0px 10px;
  width: 800px;
  margin: 30px auto 0 auto;
  background: white;
}
.mylink {
  /* font-weight: bold; */
  /* text-decoration: none; */
  text-decoration: underline;
  color: black;
}
.colTitle {
  font-size: 16px;
}
.sec {
  margin-left: 18px;
}

</style>
