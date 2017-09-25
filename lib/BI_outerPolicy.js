/*******************
Note

sended transaction is allow or deny

*******************/

class outerPolicy {

  /******************
  *create outerPolicy object
  *data composition
  *number : outerPolicy index , automatically generate
  *devId : deviceId, setting devcie config, not need to send
  *txType : transactionType , 1: operation, 2: access, 3:monitor, 4:remove
  *action : allow or deny
  *@constructor outerPolicy
  *@param {object} data
  ******************/
  constructor(data){
    this.number = data.number;
    this.devId = data.devId
    this.txType = data.txType;
    this.trgORop = data.trgORop;
    this.action = data.action;
  }

}

module.exports = outerPolicy
