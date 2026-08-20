export const MATCH_STATE = Object.freeze({
  PRE_ROUND:'pre-round',
  LIVE:'live',
  SUDDEN_DEATH:'sudden-death',
  ROUND_BREAK:'round-break',
  MATCH_OVER:'match-over'
});

export class MatchManager {
  constructor(options={}){
    this.killsToWin=options.killsToWin??12;
    this.roundSeconds=options.roundSeconds??90;
    this.roundsToWin=options.roundsToWin??5;
    this.maxRounds=options.maxRounds??9;
    this.preRoundSeconds=options.preRoundSeconds??5;
    this.breakSeconds=options.breakSeconds??10;
    this.state=MATCH_STATE.PRE_ROUND;
    this.roundNumber=1;
    this.roundWins={blue:0,red:0};
    this.roundKills={blue:0,red:0};
    this.timer=this.preRoundSeconds;
    this.roundSideFlip=false;
    this.winner=null;
    this.lastRoundWinner=null;
    this.onRoundStart=options.onRoundStart||(()=>{});
    this.onRoundEnd=options.onRoundEnd||(()=>{});
    this.onMatchEnd=options.onMatchEnd||(()=>{});
  }
  isFrozen(){return this.state===MATCH_STATE.PRE_ROUND||this.state===MATCH_STATE.ROUND_BREAK||this.state===MATCH_STATE.MATCH_OVER;}
  isCombatLive(){return this.state===MATCH_STATE.LIVE||this.state===MATCH_STATE.SUDDEN_DEATH;}
  update(dt){
    if(this.state===MATCH_STATE.MATCH_OVER)return;
    this.timer=Math.max(0,this.timer-dt);
    if(this.state===MATCH_STATE.PRE_ROUND&&this.timer<=0){this.state=MATCH_STATE.LIVE;this.timer=this.roundSeconds;this.onRoundStart(this.snapshot());return;}
    if(this.state===MATCH_STATE.LIVE&&this.timer<=0){
      if(this.roundKills.blue===this.roundKills.red){this.state=MATCH_STATE.SUDDEN_DEATH;this.timer=Infinity;}
      else this.finishRound(this.roundKills.blue>this.roundKills.red?'blue':'red','time');
      return;
    }
    if(this.state===MATCH_STATE.ROUND_BREAK&&this.timer<=0)this.startNextRound();
  }
  registerKill(team){
    if(!this.isCombatLive()||!['blue','red'].includes(team))return false;
    this.roundKills[team]+=1;
    if(this.state===MATCH_STATE.SUDDEN_DEATH){this.finishRound(team,'sudden-death');return true;}
    if(this.roundKills[team]>=this.killsToWin){this.finishRound(team,'kill-limit');return true;}
    return true;
  }
  finishRound(team,reason='score'){
    if(!this.isCombatLive())return;
    this.lastRoundWinner=team;this.roundWins[team]+=1;
    this.onRoundEnd({team,reason,...this.snapshot()});
    if(this.roundWins[team]>=this.roundsToWin||this.roundNumber>=this.maxRounds){
      this.state=MATCH_STATE.MATCH_OVER;this.winner=team;this.timer=0;this.onMatchEnd(this.snapshot());return;
    }
    this.state=MATCH_STATE.ROUND_BREAK;this.timer=this.breakSeconds;
  }
  startNextRound(){
    this.roundNumber+=1;this.roundKills={blue:0,red:0};this.roundSideFlip=!this.roundSideFlip;
    this.state=MATCH_STATE.PRE_ROUND;this.timer=this.preRoundSeconds;this.onRoundStart({...this.snapshot(),preparing:true});
  }
  resetMatch(){
    this.state=MATCH_STATE.PRE_ROUND;this.roundNumber=1;this.roundWins={blue:0,red:0};this.roundKills={blue:0,red:0};this.timer=this.preRoundSeconds;this.roundSideFlip=false;this.winner=null;this.lastRoundWinner=null;
  }
  snapshot(){return{state:this.state,roundNumber:this.roundNumber,roundWins:{...this.roundWins},roundKills:{...this.roundKills},timer:this.timer,roundSideFlip:this.roundSideFlip,winner:this.winner,lastRoundWinner:this.lastRoundWinner};}
}
