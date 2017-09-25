/*******************
Note

sended transaction is allow or deny

*******************/

class outerPolicy {
  constructor(data){
    this.number = data.number;
    this.devId = data.devId
    this.txType = data.txType;
    this.trgORop = data.trgORop;
    this.action = data.action;
  }

}

module.exports = outerPolicy
