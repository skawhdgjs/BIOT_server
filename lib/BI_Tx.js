'use strict'

/*****************
Note

Transaction is base definition of this project
Transaction is communicate format between devcie(=client) and server

*****************/


class Transaction{

  /*****************
  *@constructor  Transaction
  *****************/
  constructor(data){



     this.devId = data.devId;
     this.txType = data.txType;
     this.trgORop = data.trgORop;
     this.time = Date.now();
     this.content = data.content;

  }
  /*****************
  *return date format
  *@method getTime
  *****************/
  getTime(){
    return new Date(this.time).toISOString().replace(/T/, ' ').replace(/\..+/, '');
  }
  /*****************
  *return serialize this object
  *@method ser
  *****************/
  ser(){
     return JSON.stringify(this);
  }
  /*****************
  *return this to JSON object
  *@method parse
  *****************/
  parse(jsonData){
    return JSON.parse(jsonData);
  }

}


module.exports = Transaction
