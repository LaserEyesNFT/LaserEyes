<template>
  <div>
    <MenuBar menu='clubs'></MenuBar>
    <div id='main'>
      <div id='selfArea' v-if='bSignedIn' v-loading='bLoadingSelf'>
        <!-- tabs -->
        <el-tabs id='tabs' v-model="curTab" @tab-click="onClickTab">
          <el-tab-pane label="My clubs"  class="tp" name="myclubs">
            <div class='myclubsdiv'>
              <div class='contentTip' v-if='!bLoadingSelf && myJoinCtidList.length==0'>
                <div>Empty</div>
              </div>
              <button v-for="index of myClubList.length" :key="index" class='member' @click="onClickMyClub(index)">
                <ClubItem :clubData='myClubList[index-1]' :bAdmin='myTid>0 && myClubList[index-1].adminTid==myTid' />
              </button>
              <div id='createBtn'>
                <el-button v-if='!bLoadingSelf && myTid > 0 && myCtid == 0 && clubList.length<50' type="primary" round @click="onClickCreateClub">Create club ({{mintPrice/1000000}} STX)</el-button>
              </div>
            </div>
          </el-tab-pane>
          <el-tab-pane :label='"My apply" + (bLoadingSelf?"":"("+myApplyCtidList.length+")")' class="tp" name="apply" v-loading='myApplyCtidList.length>0&&reqApplyFlag==1'>
            <div class='myclubsdiv'>
              <div class='contentTip' v-if='!bLoadingSelf && myApplyCtidList.length==0'>Empty</div>
              <button v-for="index of applyClubDataList.length" :key="index" class='member' @click="onClickMyApplyClub(index)">
                <ClubItem :clubData='applyClubDataList[index-1]' :act=1 @click="onClickCancelApply(index, $event)" />
              </button>
            </div>
          </el-tab-pane>
          <el-tab-pane :label='"Be invited" + (bLoadingSelf?"":"("+myInvitedCitdList.length+")")' class="tp" name="invited" v-loading='myInvitedCitdList.length>0&&reqInvitedFlag==1'>
            <div class='myclubsdiv'>
              <div class='contentTip' v-if='!bLoadingSelf && myInvitedCitdList.length==0'>Empty</div>
              <button v-for="index of invitedClubDataList.length" :key="index" class='member' @click="onClickMyInvitedClub(index)">
                <ClubItem :clubData='invitedClubDataList[index-1]' :act=2 @click="onClickInvited(index, $event)" />
              </button>
            </div>
          </el-tab-pane>
          <el-tab-pane :label='"Events" + (bLoadingSelf?"":"("+myEventCount+")")' class="tp" name="events" v-loading='myEventCount>0&&reqEventFlag==1'>
            <div class='contentTip' v-if='!bLoadingSelf && myEventCount==0'>Empty</div>
            <el-table
              v-if='eventDataList.length > 0'
              id='eventPanel'
              stripe
              border
              size='small'
              max-height="260"
              :data="eventDataList">
              <el-table-column label="Time" width="190">
                <template slot-scope="scope">
                  {{ scope.row.timeStr }}
                </template>
              </el-table-column>
              <el-table-column
                label="Content">
                <template slot-scope="scope">
                  {{ scope.row.content }}
                </template>
              </el-table-column>
            </el-table>
            <div id='eventTip' v-if='myEventCount>25'>(Only show latest 25 events.)</div>
          </el-tab-pane>
        </el-tabs>
        <el-divider></el-divider>
      </div>

      <!-- <el-button type="primary" round @click="test">Test</el-button> -->

      <div id='allArea' v-loading='bLoadingAll'>
        <div v-if='bSignedIn' id='allclubstitle'>All clubs:</div>
        <div class='contentTip' v-if='!bLoadingAll && clubList.length==0'>Empty</div>
        <div id='allclubssep' v-if='!bLoadingAll&&clubList.length>0'></div>
        <button v-for="index of clubList.length" :key="index" class='member' @click="onClickBelowClub(index)">
          <ClubItem :clubData='clubList[index-1]' :bAdmin='myTid>0 && clubList[index-1].adminTid==myTid' />
        </button>
      </div>

      <!-- create clubs dialog -->
      <el-dialog :center='true' title='Create club' :visible.sync="bCreateFlag" width='800px'>
        <el-form id='nftForm' ref="form" :model="createClubData" label-width="80px">
          <el-form-item label="Name">
            <el-input v-model="createClubData.name" @input='onChangeName' :maxlength='maxNameLen' :placeholder='"Max " + maxNameLen + " characters"'>
              <label slot="suffix" class='exceedTip' v-if='nameExceedTip.length>0'>{{nameExceedTip}}</label>
            </el-input>
          </el-form-item>

          <el-form-item label="Logo CID">
            <el-input v-model="createClubData.cid" maxlength=64 placeholder='IPFS content id, like QmdUXVtRxKhdVhjPXCUxZGyXNHn5e2oS6pt8enPXo7X4Hk'></el-input>
            <div class='tipFormItem'>
              Step 1: compress your club logo
              <el-link class='elink' type="primary" href='https://tinypng.com/' target="_blank">here</el-link>
              (the smaller size it is, the quicker it shows).
            </div>
            <div class='tipFormItem'>
              Step 2: upload compressed picture to
              <el-link class='elink' type="primary" href='https://app.pinata.cloud/pinmanager' target="_blank">Pinta</el-link>(or others)
              , copy generated CID to upper input box.
            </div>
            <div class='tipFormItem'>
              Wait several seconds, the image will show in the preview area below.
            </div>
          </el-form-item>

          <el-form-item label="Bio">
            <el-input type="textarea" @input='onChangeBio' :maxlength='maxBioLen' v-model="createClubData.bio" :placeholder='"Hover mouse on image to show, max " + maxBioLen + " characters"'>
            </el-input>
            <div class='exceedTip' v-if='bioExceedTip.length>0'>{{bioExceedTip}}</div>
          </el-form-item>
          <el-form-item label="Preview">
            <ClubItem :clubData='createClubData' />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :disabled='(nameExceedTip.length>0 || bioExceedTip.length>0 || createClubData.cid.trim().length<40)' @click="onClickEditNft">{{ 'Create (' + this.mintPrice/1000000 + ' STX)' }}</el-button>
            <el-button @click="onClickCancelEditNft">Cancel</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>
    </div>
  </div>
</template>

<script>
import MenuBar from './components/MenuBar'
import ClubItem from './components/ClubItem'
import { getAppDetails, userSession, getAddress, getNetwork, getContractInfo } from './stacks/auth'
import { buffer2Str, getLocalTime, tipError, parseRspArray, checkImgExists, getIpfsUrl } from './utils/utils'
import { callReadOnlyFunction, listCV, PostConditionMode, FungibleConditionCode, makeStandardSTXPostCondition, cvToValue, stringAsciiCV, bufferCVFromString, uintCV, someCV, standardPrincipalCV } from '@stacks/transactions'
import { openContractCall } from '@stacks/connect';
import BigNumCC from 'bn.js';
import Vue from 'vue'

const { contractAddress, contractName, clubContractName }  = getContractInfo();
const senderAddress = contractAddress;
const network = getNetwork();

export default {
  name: 'ClubsPage',
  components: {
    MenuBar: MenuBar,
    ClubItem: ClubItem,
  },
  data () {
    return {
      bSignedIn: userSession.isUserSignedIn(),
      //
      curTab: 'myclubs',
      bLoadingSelf: false,
      myTid: 0,
      myCtid: 0,
      myApplyCtidList: [],
      myInvitedCitdList: [],
      myJoinCtidList: [],
      myEventCount: 0,
      myBalance: 0,
      mintPrice: 20000000,
      myClubList: [],
      //
      bLoadingAll: false,
      clubList: [],
      //
      bCreateFlag: false,
      maxNameLen: 25,
      maxBioLen: 80,
      nameExceedTip: '',
      bioExceedTip: '',
      createClubData: {
        name: '',
        cid: '',
        bio: '',
      },
      reqApplyFlag: 0,
      applyClubDataList: {},
      reqInvitedFlag: 0,
      invitedClubDataList: {},
      reqEventFlag: 0,
      eventDataList: [],
      POW8:   BigInt(100000000),
      POW12:  BigInt(1000000000000),
      POW16:  BigInt(10000000000000000),
      POW20:  BigInt(100000000000000000000),
      //
      TipBalanceUnenough: 'Balance not enough',
      CidInvalid: 'CID invalid',
    }
  },
  async mounted() {
    if (this.bSignedIn) {
      this.loadSelf()
    }
    this.loadAllClubs()
  },
  methods: {
    async loadSelf() {
      this.bLoadingSelf = true
      const functionName = 'get_member_cb';
      const options = {
        contractAddress,
        contractName: clubContractName,
        functionName,
        functionArgs: [standardPrincipalCV(getAddress())],
        network,
        senderAddress,
      };
      const summaryRsp = await callReadOnlyFunction(options);
      // console.log('___summaryRsp: ', summaryRsp)
      this.myTid = cvToValue(summaryRsp.data.tid)
      this.myCtid = cvToValue(summaryRsp.data.ctid)
      this.myApplyCtidList = parseRspArray(summaryRsp.data.apply)
      this.myInvitedCitdList = parseRspArray(summaryRsp.data.invited)
      this.myJoinCtidList = parseRspArray(summaryRsp.data.joins)
      this.myEventCount = cvToValue(summaryRsp.data.event_count)
      this.myBalance = cvToValue(summaryRsp.data.balance)
      //
      // console.log('____loadSelf', {
      //   myTid: this.myTid,
      //   myCtid: this.myCtid,
      //   myApplyCtidList: this.myApplyCtidList,
      //   myInvitedCitdList: this.myInvitedCitdList,
      //   myJoinCtidList: this.myJoinCtidList,
      //   myEventCount: this.myEventCount,
      //   myBalance: this.myBalance,
      // })
      //
      if (this.myJoinCtidList.length > 0) {
        this.loadSelfClubs()
      } else {
        this.bLoadingSelf = false
      }
    },
    async loadSelfClubs() {
      const outThis = this
      this.loadClubsSummary(this.myJoinCtidList, null, function(resultList) {
        outThis.myClubList = resultList
        // console.log('___resultList: ', resultList)
        if (outThis.myClubList.length > 1) {
          outThis.myClubList.sort(function(a, b) {
            if (a.adminTid == outThis.myTid || b.adminTid == outThis.myTid) {
              return a.adminTid == outThis.myTid ? -1 : 1
            }
            return a.ctid < b.ctid ? -1 : 1
          })
          Vue.set(outThis.myClubList, 0, outThis.myClubList[0])
          outThis.myJoinCtidList = []
          for (let v of outThis.myClubList) {
            outThis.myJoinCtidList.push(v.ctid)
          }
        }
        outThis.bLoadingSelf = false
      })
    },
    async loadAllClubs() {
      let outThis = this
      this.loadClubsPage(1, function() {
        // console.log('___finish: ', outThis.clubList.length)
        if (outThis.clubList.length >= 25) {
          outThis.loadClubsPage(2, function() {
            if (outThis.clubList.length >= 50) {
              outThis.loadClubsPage(3)
              setTimeout(() => {
                outThis.loadClubsPage(4)
              }, 500);
            }
          })
        }
      })
    },
    async loadClubsPage(pageIndex, callback) {
      let ctidList = []
      for (let index = 1; index <= 25; index++) {
        ctidList.push((pageIndex-1)*25 + index)
      }
      let outThis = this
      this.loadClubsSummary(
        ctidList,
        function() {
          outThis.bLoadingAll = true
        },
        function(resultList) {
          outThis.bLoadingAll = false
          for (const v of resultList) {
            outThis.clubList.push(v)
          }
          //
          if (callback) {
            callback()
          }
        }
      )
    },
    onClickCreateClub() {
      if (this.myBalance <= this.mintPrice) {
        tipError(this, this.TipBalanceUnenough)
        return
      }
      if (this.myTid == 0 || this.myCtid > 0) {
        return
      }
      if (this.myJoinCtidList.length >= 5) {
        tipError(this, 'join too many clubs, need exit 1 to create.')
        return
      }
      this.bCreateFlag = true
    },
    /// create clubs
    onChangeName() {
      const trimName = this.createClubData.name.trim()
      let buffLen = 0
      if (trimName.length > 8) {
        buffLen = bufferCVFromString(trimName).buffer.byteLength
      }
      this.nameExceedTip = buffLen > this.maxNameLen ? (buffLen + '/' + this.maxNameLen) : ''
    },
    onChangeBio() {
      const trimBio = this.createClubData.bio.trim()
      let buffLen = 0
      if (trimBio.length > 8) {
        buffLen = bufferCVFromString(trimBio).buffer.byteLength
      }
      this.bioExceedTip = buffLen > this.maxBioLen ? (buffLen + '/' + this.maxBioLen) : ''
    },
    async onClickEditNft() {
      if (!checkImgExists(getIpfsUrl(this.createClubData.cid))) {
        tipError(this, this.CidInvalid)
        return
      }
      const nameCv = bufferCVFromString(this.createClubData.name)
      const cidCv = stringAsciiCV(this.createClubData.cid)
      const bioCv = bufferCVFromString(this.createClubData.bio)
      let functionArgs = [nameCv, cidCv, bioCv]
      let functionName = 'create_club'
      let playerAddr = getAddress()
      const standardSTXPostCondition = makeStandardSTXPostCondition(
        playerAddr,
        FungibleConditionCode.LessEqual,
        new BigNumCC(this.mintPrice),
      );
      let outThis = this
      const options = {
        contractAddress,
        contractName: clubContractName,
        functionName,
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [standardSTXPostCondition],
        onFinish: data => {
          outThis.doNotify('Create club')
        },
      };
      openContractCall(options)
    },
    onClickCancelEditNft() {
      this.bCreateFlag = false
    },
    //
    onClickMyClub(index) {
      this.openClub(this.myJoinCtidList[index-1])
    },
    onClickMyApplyClub(index) {
      this.openClub(this.myApplyCtidList[index-1])
    },
    onClickMyInvitedClub(index) {
      this.openClub(this.myInvitedCitdList[index-1])
    },
    onClickBelowClub(index) {
      this.openClub(index)
    },
    openClub(ctid) {
      if (ctid) {
        window.open('club.html?id='+ctid, '_blank').focus();
      }
    },
    /// tab
    onClickTab(tab, event) {
      if (this.curTab == 'myclubs') {
        // pass
      } else if (this.curTab == 'apply') {
        if (this.myApplyCtidList.length <= 0) {
          this.reqApplyFlag = 2
        } else if (this.reqApplyFlag == 0) {
          this.reqApplyList()
        }
      } else if (this.curTab == 'invited') {
        if (this.myInvitedCitdList.length <= 0) {
          this.reqInvitedFlag = 2
        } else if (this.reqInvitedFlag == 0) {
          this.reqInvitedList()
        }
      } else if (this.curTab == 'events') {
        if (this.myEventCount <= 0) {
          this.reqEventFlag = 2
        } else if (this.reqEventFlag == 0) {
          this.reqEventList()
        }
      } else {
        console.assert(false)
      }
    },
    // apply tab
    async reqApplyList() {
      let outThis = this
      this.loadClubsSummary(
        this.myApplyCtidList,
        function() {
          outThis.reqApplyFlag = 1
        },
        function(resultList) {
          // console.log('___reqApplyList_resultList: ', resultList)
          outThis.reqApplyFlag = 2
          outThis.applyClubDataList = resultList
          if (outThis.applyClubDataList.length > 0) {
            Vue.set(outThis.applyClubDataList, 0, outThis.applyClubDataList[0])
          }
        }
      )
    },
    onClickCancelApply(index) {
      // console.log('___onClickCancelApply: ', index)
      const ctid = this.myApplyCtidList[index-1]
      let functionArgs = [uintCV(ctid)]
      this.callPublic('member_cancel_apply', functionArgs, 'Cancel apply')
    },
    // Be invited tab
    async reqInvitedList() {
      let outThis = this
      // console.log('___this.myInvitedCitdList: ', this.myInvitedCitdList)
      this.loadClubsSummary(
        this.myInvitedCitdList,
        function() {
          outThis.reqInvitedFlag = 1
        },
        function(resultList) {
          // console.log('___reqInvitedList_resultList: ', resultList)
          outThis.reqInvitedFlag = 2
          outThis.invitedClubDataList = resultList
          if (outThis.invitedClubDataList.length > 0) {
            Vue.set(outThis.invitedClubDataList, 0, outThis.invitedClubDataList[0])
          }
        }
      )
    },
    onClickInvited(index, bAccept) {
      // console.log('___onClickInvited: ', index, bAccept)
      const ctid = this.myInvitedCitdList[index-1]
      let functionArgs = [uintCV(ctid)]
      this.callPublic(bAccept ? 'accept_club_invite' : 'decline_club_invite', functionArgs, bAccept ? 'Accept invite' : 'Decline invite')
    },
    // event
    async reqEventList() {
      if (this.myEventCount <= 0) {
        return
      }
      this.reqEventFlag = 1
      //
      let eventInfoCvList = listCV()
      eventInfoCvList.list = []
      let eventDataList = []
      //
      {
        let ll = listCV()
        ll.list = []
        for (let i = 0; i < 25; i++) {
          const v = this.myEventCount - i
          if (v > 0) {
            ll.list.push(uintCV(this.myTid + 10000 * v))
          } else {
            break
          }
        }
        //
        const functionName = 'get_member_events';
        const options = {
          contractAddress,
          contractName: clubContractName,
          functionName,
          functionArgs: [ll],
          network,
          senderAddress,
        };
        const summaryRsp = await callReadOnlyFunction(options);
        // console.log('___get_member_events_summaryRsp: ', summaryRsp)
        for (const v of summaryRsp.list) {
          const initStr = v.value.toString(10)
          let vv = BigInt(initStr)
          const param2 =  Math.floor(Number(vv / this.POW20))
          vv = BigInt(initStr.substr(param2.toString().length))
          const param1 =  Math.floor(Number(vv / this.POW16))
          vv = BigInt(vv.toString().substr(param1.toString().length))
          const eventType =  Math.floor(Number(vv / this.POW12))
          const stamp = Number(vv%this.POW12)
          eventDataList.push({
            timeStr: getLocalTime(stamp),
            eventType: eventType,
            // tid: param1,
            // ctid: param2,
          })
          eventInfoCvList.list.push(uintCV(param2))
        }
        // console.log('___eventDataList: ', eventDataList)
      }
      // 获取club 名字
      {
        const functionName = 'get_clubs_name';
        const options = {
          contractAddress,
          contractName: clubContractName,
          functionName,
          functionArgs: [eventInfoCvList],
          network,
          senderAddress,
        };
        const summaryRsp = await callReadOnlyFunction(options);
        const summaryValue = cvToValue(summaryRsp)
        // console.log('___get_events_info_summaryValue: ', summaryValue)
        if (summaryValue.length != eventDataList.length) {
          tipError(this, 'length not equal')
          return
        }
        for (let i = 0; i < summaryValue.length; i++) {
          const item = summaryValue[i]
          const clubName = buffer2Str(item.value)
          const evtInfo = eventDataList[i]
          let content = ''
          if (evtInfo.eventType == 2001) {
            content = 'Club "' + clubName + '" accepts your apply.'
          } else if (evtInfo.eventType == 2002) {
            content = 'Club "' + clubName + '" declines your apply.'
          } else if (evtInfo.eventType == 2004) {
            content = 'Club "' + clubName + '" deletes you.'
          }
          eventDataList[i].content = content
        }
      }
      this.eventDataList = eventDataList
      if (this.eventDataList.length > 0) {
        Vue.set(this.eventDataList, 0, this.eventDataList[0])
      }
      this.reqEventFlag = 2
    },
    /// common
    createLoading(tips) {
      return this.$loading({
        lock: true,
        text: tips,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.05)'
      });
    },
    doNotify(title) {
      this.$notify({
        title: title,
        message: 'Transaction has been sent, wait a while to be finished.',
        duration: 8000,
      });
    },
    async loadClubsSummary(ctidList, preReqCallback, postReqCallback) {
      if (!ctidList || ctidList.length <= 0 || !postReqCallback) {
        return
      }
      let ll = listCV()
      ll.list = []
      for (const ctid of ctidList) {
        ll.list.push(uintCV(ctid))
      }
      const functionName = 'get_clubs_summary';
      const options = {
        contractAddress,
        contractName: clubContractName,
        functionName,
        functionArgs: [ll],
        network,
        senderAddress,
      };
      if (preReqCallback) {
        preReqCallback()
      }
      const summaryRsp = await callReadOnlyFunction(options);
      const summaryValue = cvToValue(summaryRsp)
      // console.log('___loadClubsSummary: ', summaryValue)
      const resultList = []
      for (let i = 0; i < summaryValue.length; i++) {
        const v = summaryValue[i]
        if (v.value) {
          const vv = v.value.value
          const clubData = {
            ctid: ctidList[i],
            name: buffer2Str(vv.name),
            bio: buffer2Str(vv.bio),
            cid: vv.cid.value,
            adminTid: vv.ud.value % 10000,
          }
          resultList.push(clubData)
        }
      }

      // setTimeout(() => {
      //   postReqCallback(resultList)
      // }, 2000);
      postReqCallback(resultList)
    },
    callPublic(functionName, functionArgs, tip) {
      let outThis = this
      const options = {
        contractAddress,
        contractName: clubContractName,
        functionName,
        functionArgs,
        network,
        appDetails: getAppDetails(),
        postConditions: [],
        onFinish: data => {
          outThis.doNotify(tip)
        },
      };
      openContractCall(options)
    },
  },
}

</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#nftForm {
  width: 700px;
  margin: auto;
  text-align: center;
}

.subTitle {
  font-size: 32px;
  font-weight: bold;
}
.subTitle2 {
  margin-bottom: 16px;
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
.member {
  display: inline-block;
  margin-right: 16px;
  border: none;
  background: white;
}

#main {
  margin: 92px 128px 32px 128px;
  text-align: center;
}
/* #tabs {
  margin-bottom: 36px;
} */
.tp {
  min-height: 150px; /* 189px;*/
}
.contentTip {
  margin-top: 32px;
  text-align: center;
}
#createBtn {
  margin-top: 16px;
  text-align: center;
}
.myclubsdiv {
  margin-top: 16px;
  text-align: left;
  padding: auto;
}
#allclubssep {
  height: 16px;
}
#eventTip {
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}
#allArea {
  text-align: left;
  min-height: 500px;
}
#eventPanel {
  padding: 0;
  width: 700px;
  margin: auto;
}
#allclubstitle {
  font-size: 18px;
  font-weight: bold;
}

</style>
