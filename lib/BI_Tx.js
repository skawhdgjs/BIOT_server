'use strict'



class Transaction{


  constructor(data){



     this.devId = data.devId;
     this.txType = data.txType;
     this.trgORop = data.trgORop;
     this.time = Date.now();
     this.content = data.content;

  }

  getTime(){
    return new Date(this.time).toISOString().replace(/T/, ' ').replace(/\..+/, '');
  }

  ser(){
     return JSON.stringify(this);
  }

  parse(jsonData){
    return JSON.parse(jsonData);
  }

}


module.exports = Transaction
