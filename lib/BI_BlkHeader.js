/************************
Note

make block header object
block header include
Id, MinerId, NumberOfTransaciton, previous block hash value, transaction Trie, time
this obejct have validate function

*************************/

const _ = require('lodash')

class BlkHeader {
  /************************
  *create block header object
  *data composition
  *Id : block Id
  *MinerId : minder Id what create this
  *NumofTransaction : how many Transaction include
  *txTire : merkle tree of Transaction
  *time : created time
  *@constructor BlkHeader
  *@param {object} data
  *************************/
  constructor(data){

    this.Id = data.id;
    this.MinerId = data.MinerId;

    this.NumOfTransaction = data.NoT;
    this.prvBlockHV = data.prvBlockHV;
    //this.BlockHV = data.BlockHV;
    this.txTrie = data.txTrie;

    if(data.time !== undefined){

      this.time = data.time
    }else
      this.time = Date.now();

  }
  /********************
  *setting block hash valude
  *It is used for when create block and then create hash value finally this value insert from this function
  *@method setBlockHV
  *@param {string} blockHv
  ********************/
  setBlockHV(blockHV){
    this.BlockHV = blockHV
  }
  /********************
  *return block hash value
  *@method hash
  *@return {string} blockHV
  ********************/
  hash(){
    return this.BlockHV
  }

  /********************
  *check this block is whether genesis
  *genesis block prvBlockHV setting to 0
  *@method isGenesis
  *@return {bool}
  ********************/
  isGenesis(){
    return this.prvBlockHV  === "0"
  }

  /********************
  *validte block header using blockchain
  *1. check if parent block exists
  *2. check create time
  *3. check Id sequence
  *@method validate
  *@param {Array} blockchain
  *@param {function} cb
  ********************/
  validate(blockchain, cb){
    const self = this


    //if genesis Block no need to validate
    if(self.isGenesis()){
      return cb(null, 'genesis validate')
    }

    //find parent block
    //1. create_time check
    //2. seq_id check
    var parent;

    blockchain.forEach(function(v){
       if(v.header.BlockHV == self.prvBlockHV){
           console.log('[block header] parent find : ' + v.header.Id)
           parent = v
       }
    })


    if(parent === undefined){
      return cb(this.Id +': could not find parent block', null)
    }else{

      if(Number(self.time) <= Number(parent.header.time)){
        console.log('[block header][this time]' + self.time)
        console.log('[block header][parent time]' + parent.header.time)
        return cb(this.Id + ': invalid timestamp', null)
      }

      if(self.id <= parent.header.id){
        return cb(this.Id + ': invalid id', null)
      }

      return cb(null, 'header validate')
    }
  }

}


module.exports = BlkHeader;
