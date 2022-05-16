<template>
  <div>
    <MenuBar menu='mine'></MenuBar>
    <div id='main'>
      <div v-if='!bSignedIn'>
        Please sign in: <p />
        <el-button type="primary" round @click="onClickLoginIn">Sign in</el-button>
      </div>
      <div id='content' v-if='bSignedIn' v-loading='bInResolve'>
        <div v-if='!bInResolve'>
          <!-- tip when there's no nft -->
          <div v-if='nftData.tid==0 && !bMintFlag && !bUpdateFlag'>
            <div class='subTitle'>{{bHasMintFlag ? "Mint is pending, please wait a while..." : "Not has laser eyes nft yet"}}</div>
            <el-button v-if='!bHasMintFlag' type="primary" round @click="onClickMint">Mint</el-button>
          </div>

          <!-- tip when there're nfts -->
          <div v-if='nftData.tid!=0 && !bMintFlag && !bUpdateFlag'>
            <div class='subTitle'>My laser eyes</div>
            <NftItem id='nftItem' :nftData='nftData' />
            <el-button v-if='nftData.h>0' id='heart' type="text" @click="onClickHeart">
              <img src="./assets/heart.png" width="16" height="16" />
              <label id='h'>{{nftData.h}}</label>
            </el-button>
            <el-descriptions id='descArea' title="" :column="1" border>
              <el-descriptions-item>
                <template slot="label">ID</template>
                #{{nftData.tid}}
              </el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">Name</template>
                {{nftData.name}}
              </el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">Minor name</template>
                {{nftData.minorName}}
              </el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">Bio</template>
                {{nftData.bio}}
              </el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">Register at</template>
                {{createTimeStr}}
              </el-descriptions-item>
              <el-descriptions-item>
                <template slot="label">Cid</template>
                {{nftData.cid}}
              </el-descriptions-item>
              <!-- <el-descriptions-item>
                <template slot="label">$LASER</template>
                {{nftData.laser}}
              </el-descriptions-item> -->
            </el-descriptions>
            <el-button :disabled='!bOwn' class='actBtn' type="primary" round @click="onClickUpdate">Update</el-button>
            <el-button :disabled='!bOwn' class='actBtn' type="primary" round @click="onClickTransfer">Transfer</el-button>
            <el-button :disabled='!bOwn' class='actBtn' type="danger" round @click="onClickBurn">Burn</el-button>
            <div id='listTip' v-if="!bOwn">Cannot modify when listed in marketplace.</div>
          </div>

          <!-- create/edit nft -->
          <el-form id='nftForm' v-if='bMintFlag || bUpdateFlag' ref="form" :model="nftData" label-width="120px">
            <div class='subTitle'>{{ bMintFlag ? 'Mint laser eyes nft, hold to earn' : 'Update laser eyes nft' }}</div>
            <div class='subTitle2'>{{ bMintFlag ? "(Each account can only own one)" : " " }}</div>
            <el-form-item label="Name">
              <el-input v-model="nftData.name" :disabled='bUpdateFlag' @input='onChangeName' style="color:red" :maxlength='maxNameLen' :placeholder='"Globally unique, max " + maxNameLen + " characters"'>
                <label slot="suffix" class='exceedTip' v-if='nameExceedTip.length>0'>{{nameExceedTip}}</label>
              </el-input>
            </el-form-item>
            <el-form-item label="Minor name">
              <el-input v-model="nftData.minorName" :disabled='bUpdateFlag' @input='onChangeMinorName' :maxlength='maxNameLen' :placeholder='bMintFlag ? "Optional name to preserve, can be empty, otherwise must include or included by name." : ""'>
                <label slot="suffix" class='exceedTip' v-if='minorNameExceedTip.length>0'>{{minorNameExceedTip}}</label>
              </el-input>
            </el-form-item>

            <el-form-item label="Image CID">
              <el-input v-model="nftData.cid" maxlength=64 placeholder='IPFS content id, like QmdUXVtRxKhdVhjPXCUxZGyXNHn5e2oS6pt8enPXo7X4Hk'></el-input>
              <div class='tipFormItem'>
                Step 1: add laser eyes for your picture
                <el-link class='elink' type="primary" href='https://memed.io/laser-eyes-meme-maker' target="_blank">here</el-link>
                or
                <el-link class='elink' type="primary" href='https://cryptolasereyes.com' target="_blank">here</el-link>.
              </div>
              <div class='tipFormItem'>
                Step 2: compress generated picture
                <el-link class='elink' type="primary" href='https://tinypng.com/' target="_blank">here</el-link>
                (the smaller size it is, the quicker it shows).
              </div>
              <div class='tipFormItem'>
                Step 3: upload compressed picture to
                <el-link class='elink' type="primary" href='https://app.pinata.cloud/pinmanager' target="_blank">Pinta</el-link>(or others)
                , copy generated CID to upper input box.
              </div>
              <div class='tipFormItem'>
                Wait several seconds, the image will show in the preview area below.
              </div>
            </el-form-item>
            <el-form-item label="Bio">
              <el-input type="textarea" @input='onChangeBio' :maxlength='maxBioLen' v-model="nftData.bio" :placeholder='"Hover mouse on image to show, max " + maxBioLen + " characters"'>
              </el-input>
              <div class='exceedTip' v-if='bioExceedTip.length>0'>{{bioExceedTip}}</div>
              <!-- <label slot="suffix" class='exceedTip' v-if='bioExceedTip.length>0'>{{bioExceedTip}}</label> -->
            </el-form-item>
            <el-form-item label="Preview">
              <NftItem :nftData='nftData' />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :disabled='(nftData.name.trim().length==0 || nftData.cid.trim().length<40)' @click="onClickEditNft">{{ bMintFlag ? 'Mint (' + this.mintPrice/1000000 + ' STX)' : 'Update (' + this.updatePrice/1000000 + ' STX)' }}</el-button>
              <el-button @click="onClickCancelEditNft">Cancel</el-button>
            </el-form-item>
          </el-form>
        </div>  <!-- !bInResolve -->
      </div>
    </div>
  </div>
</template>

<script>
import MenuBar from './components/MenuBar'
import NftItem from './components/NftItem'
import { authenticate, getAppDetails, userSession, getAddress, getNetwork, getContractInfo, loginIn } from './stacks/auth'
import { checkImgExists, getIpfsUrl, buffer2Str, getLocalTime, tipError } from './utils/utils'
import { callReadOnlyFunction, makeContractNonFungiblePostCondition, createAssetInfo, contractPrincipalCV, FungibleConditionCode, NonFungibleConditionCode, makeStandardSTXPostCondition, makeStandardNonFungiblePostCondition, makeContractSTXPostCondition, noneCV, cvToValue, stringAsciiCV, bufferCVFromString, tupleCV,  uintCV, trueCV, falseCV, someCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import BigNumCC from 'bn.js';
import Vue from 'vue'

const { contractAddress, contractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'MinePage',
  components: {
    MenuBar: MenuBar,
    NftItem: NftItem,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      //
      lastMintId: 0,
      mintPrice: 0,
      updatePrice: 0,
      maxNameLen: 25,
      maxBioLen: 80,
      //
      bInResolve: false,
      bMintFlag: false,
      bUpdateFlag: false,
      nameExceedTip: '',
      minorNameExceedTip: '',
      bioExceedTip: '',
      bHasMintFlag: false,
      createTimeStr: '',
      bOwn: false,
      // create/edit
      nftData: {
        tid: 0,
        // laser: 0,
        bh: 0,
        name: '',
        minorName: '',
        cid: '',
        bio: '',
      },
      originNftData: {
        tid: 0,
        // laser: 0,
        bh: 0,
        name: '',
        minorName: '',
        cid: '',
        bio: '',
      },
    }
  },
  async mounted() {
    if (this.bSignedIn) {
      this.loadSummary()
    }
  },
  methods: {
    onClickLoginIn() {
      loginIn()
    },
    async loadSummary() {
      this.bInResolve = true
      const functionName = 'get_player_summary';
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs: [standardPrincipalCV(getAddress())],
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      this.bInResolve = false
      let serverData = cvToValue(summaryRsp)
      // console.log('___serverData: ', serverData)
      this.lastMintId = serverData.last_id.value
      this.mintPrice = serverData.mp.value
      this.updatePrice = serverData.ucbp.value
      let nftData = this.nftData
      nftData.tid = serverData.tid.value
      this.createTimeStr = serverData.time.value ? getLocalTime(serverData.time.value.value) : ''
      this.bOwn = serverData.bown.value
      // nftData.laser = serverData.laser_count.value
      if (serverData.meta.value) {
        let mv = serverData.meta.value.value
        nftData.bh = mv.ud.value % 1000000
        nftData.h = Math.floor(mv.ud.value / 1000000) % 10000
        nftData.name = buffer2Str(mv.name)
        nftData.minorName = buffer2Str(mv.minor_name)
        nftData.cid = mv.cid.value
        nftData.bio = buffer2Str(mv.bio)
      } else {
        nftData.bh = 0
        nftData.h = 0
        nftData.name = ''
        nftData.minorName = ''
        nftData.cid = ''
        nftData.bio = ''
      }
      this.originNftData = { ... nftData }
      //
      var url = window.location.href
      var paramName = url.split("act=")[1]
      if (paramName == 'mint' && nftData.cid=='') {
        this.showMintUI()
      } else {
        this.bMintFlag = false
      }
    },
    getUrlActParam() {
      var url = window.location.href
      var paramName = url.split("act=")[1]
      return paramName
    },
    onClickMint() {
      this.showMintUI()
    },
    showMintUI() {
      this.bMintFlag = true
    },
    onClickUpdate() {
      this.bUpdateFlag = true
    },
    onClickTransfer() {
      let outThis = this
      this.$prompt('Input receiver address(must not own laser eyes nft)', 'Transfer',
      {
        confirmButtonText: 'Ok',
        cancelButtonText: 'Cancel',
      }).then(({ value }) => {
        outThis.startTransfer(value)
      }).catch(() => {
        // pass
      });
    },
    startTransfer(receiverAddress) {
      receiverAddress = receiverAddress.trim()
      if (receiverAddress.length == 0) {
        return
      }
      const functionArgs = [
        uintCV(this.nftData.tid),
        standardPrincipalCV(getAddress()),
        standardPrincipalCV(receiverAddress),
      ]

      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(this.nftData.tid);
      const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);
      const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
        getAddress(),
        NonFungibleConditionCode.DoesNotOwn,
        nonFungibleAssetInfo,
        tokenAssetName
      );

      let outThis = this
      const options = {
        contractAddress,
        contractName,
        functionName: 'transfer',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardNonFungiblePostCondition],
        onFinish: data => {
          outThis.doNotify('Transfer')
        },
      };
      openContractCall(options)
    },
    async onClickEditNft() {
      // mint时，检查名字
      if (this.bMintFlag) {
        const name = this.nftData.name.trim()
        const minorName = this.nftData.minorName.trim()
        let msg = ''
        if (name.length == 0) {
          msg = 'please enter name!'
        } else {
          const lowerName = name.toLowerCase()
          const lowerMinorName = minorName.toLowerCase()
          if (minorName.length > 0 && !(lowerMinorName.includes(lowerName) || lowerName.includes(lowerMinorName))) {
            msg = 'minor name should include or included by name!'
          } else if (bufferCVFromString(lowerName).buffer.byteLength > this.maxNameLen) {
            msg = 'name too long!'
          } else if (bufferCVFromString(lowerMinorName).buffer.byteLength > this.maxNameLen) {
            msg = 'minor name too long!'
          }
        }
        if (msg.length > 0) {
          this.$message({message: msg, type: 'error'});
          return
        }
        this.nftData.name = name
        this.nftData.minorName = minorName
      }

      const loading = this.$loading({
        lock: true,
        text: 'Loading',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });
      const cid = this.nftData.cid.trim()
      if (cid.length < 40 || !checkImgExists(getIpfsUrl(cid))) {
        this.$message({  message: "invalid cid, image not exist", type: 'error' });
        loading.close()
        return
      }
      this.nftData.cid = cid

      const bio = this.nftData.bio.trim()
      if (bufferCVFromString(bio).buffer.byteLength > this.maxBioLen) {
        this.$message({message: "Bio too long!", type: 'error' });
        loading.close()
        return
      }
      this.nftData.bio = bio
      const bPreCheckResult = await this.actPreCheck(this.bMintFlag)
      loading.close()
      if (!bPreCheckResult) {
        return
      }
      this.readyMintOrUpdate()
    },
    async readyMintOrUpdate() {
      const cidCv = stringAsciiCV(this.nftData.cid)
      const bioCv = bufferCVFromString(this.nftData.bio)
      let functionArgs = null
      let functionName = null
      let playerAddr = getAddress()
      const standardSTXPostCondition = makeStandardSTXPostCondition(
        playerAddr,
        FungibleConditionCode.LessEqual,
        new BigNumCC((this.bMintFlag ? this.mintPrice : this.updatePrice)),
      );

      if (this.bMintFlag) {
        // console.log('___bPreCheckResult:', bPreCheckResult)
        functionName = 'mint'
        const nameCv = bufferCVFromString(this.nftData.name)
        const minorNameCv = bufferCVFromString(this.nftData.minorName)
        functionArgs = [nameCv, minorNameCv, cidCv, bioCv]
      } else {
        functionName = 'update'
        functionArgs = [cidCv, bioCv]
      }

      let outThis = this
      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardSTXPostCondition],
        onFinish: data => {
          if (outThis.bMintFlag) {
            outThis.bHasMintFlag = true
          }
          outThis.doNotify((outThis.bMintFlag ? 'Mint' : 'Update'))
        },
      };
      openContractCall(options)
    },
    async actPreCheck(bMint) {
      const functionName = 'get_pre_act_info';
      const functionArgs = [
        standardPrincipalCV(getAddress()),
        bufferCVFromString(bMint ? this.nftData.name.trim().toLowerCase() : ''),
        bufferCVFromString(bMint ? this.nftData.minorName.trim().toLowerCase() : ''),
      ]

      const options = {
        contractAddress,
        contractName,
        functionName,
        functionArgs,
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      this.bHasInit = true
      let serverData = cvToValue(summaryRsp)
      // console.log('___serverData: ', serverData)
      let errMsg = null
      if (bMint) {
        if (serverData.own.value) {
          errMsg = 'Current account already own one Laser eyes nft!'
        } else if (!serverData.name.value) {
          errMsg = 'Name ' + this.nftData.name + ' has already been taken!'
        } else if (!serverData.minor_name.value) {
          errMsg = 'Minor name ' + this.nftData.minorName + ' has already been taken!'
        }
      }
      if (!errMsg) {
        const needBalance = bMint ? this.mintPrice : this.updatePrice;
        if (serverData.balance.value <= needBalance) {
          errMsg = 'balance not enough'
        }
      }
      if (errMsg) {
        this.$message({message: errMsg, type: 'error'});
        return false
      }
      return true
    },
    onClickCancelEditNft() {
      if (this.bMintFlag && (this.nftData.name.length > 0 || this.nftData.bio.length > 0) && !this.bHasMintFlag) {
        let outThis = this
        this.$confirm('Are you sure want to cancel?', 'tips', {
          confirmButtonText: 'Ok',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }).then(() => {
          outThis.nftData = {... outThis.originNftData}
          outThis.bMintFlag = false
          outThis.bUpdateFlag = false
        }).catch(() => {
          // pass
        });
      } else {
        this.bMintFlag = false
        this.bUpdateFlag = false
        this.nftData = {... this.originNftData}
      }
    },
    onClickBurn() {
      let outThis = this
      this.$confirm("Can't get it back any more after burn! Are you sure?", 'Warnings', {
          confirmButtonText: "Burn",
          cancelButtonText: 'Cancel',
          type: 'warning',
          // center: true,
        }).then(() => {
          outThis.doBurn()
        }).catch(() => {
        });
    },
    async doBurn() {
      const functionArgs = [
        uintCV(this.nftData.tid),
      ]

      const assetName = 'LaserEyes';
      const tokenAssetName = uintCV(this.nftData.tid);
      const nonFungibleAssetInfo = createAssetInfo(contractAddress, contractName, assetName);
      const standardNonFungiblePostCondition = makeStandardNonFungiblePostCondition(
        getAddress(),
        NonFungibleConditionCode.DoesNotOwn,
        nonFungibleAssetInfo,
        tokenAssetName
      );

      let outThis = this
      const options = {
        contractAddress,
        contractName,
        functionName: 'burn',
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardNonFungiblePostCondition],
        onFinish: data => {
          outThis.doNotify('Burn')
        },
      };
      openContractCall(options)
    },
    onChangeName() {
      const trimName = this.nftData.name.trim()
      let buffLen = 0
      if (trimName.length > 8) {
        buffLen = bufferCVFromString(trimName).buffer.byteLength
      }
      this.nameExceedTip = buffLen > this.maxNameLen ? (buffLen + '/' + this.maxNameLen) : ''
    },
    onChangeMinorName() {
      const trimName = this.nftData.minorName.trim()
      let buffLen = 0
      if (trimName.length > 8) {
        buffLen = bufferCVFromString(trimName).buffer.byteLength
      }
      this.minorNameExceedTip = buffLen > this.maxNameLen ? (buffLen + '/' + this.maxNameLen) : ''
    },
    onChangeBio() {
      const trimBio = this.nftData.bio.trim()
      let buffLen = 0
      if (trimBio.length > 8) {
        buffLen = bufferCVFromString(trimBio).buffer.byteLength
      }
      this.bioExceedTip = buffLen > this.maxBioLen ? (buffLen + '/' + this.maxBioLen) : ''
    },
    doNotify(title) {
      this.$notify({
        title: title,
        message: 'Transaction has been sent, wait a while to be finished.',
        duration: 8000,
      });
    },
    onClickHeart() {
      this.$message({message: 'like records coming soon', type: 'info'});
    },
    ///
    test() {
    }
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#main {
  margin: 92px 128px 32px 128px;
  text-align: center;
}

#content {
  min-height: 400px;
}

#nftForm {
  width: 760px;
  margin: auto;
}

.subTitle {
  font-size: 32px;
  font-weight: bold;
}
.subTitle2 {
  margin-bottom: 16px;
}

#nftItem {
  width: 168px;
  margin: 16px auto;
}

#descArea {
  padding-top: 16px;
  width: 800px;
  margin: auto;
}

.actBtn {
  margin-top: 16px;
}
.tipFormItem {
  text-align: left;
  line-height: 18px;
  margin-top: 2px;
}
.elink {
  vertical-align: top;
}
.exceedTip {
  color: red;
  text-align: left;
  line-height: 18px;
}
#listTip {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}
#heart {
  margin-top: -16px;
  text-align: center;
  color: black;
}
#h {
  vertical-align: top;
  margin-left: -2px;
}

</style>
