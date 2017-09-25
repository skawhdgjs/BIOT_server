/********************
Note

Block object

block is important object
this obejct compose on

1.innerPolicy
2.outerPolicy
3.header
4.transaction

********************/
const bh = require('./BI_BlkHeader')
const inp = require('./BI_innerPolicy')
const otp = require('./BI_outerPolicy')
const tx = require('./BI_Tx')
const crypto = require('crypto-js')
const Trie = require('merkle-tree-gen')
const async = require('async')
const _ = require('lodash')
const genesisParam = require('./genesis.json')


class Block{

  /***********************
  *  create block section
  *
  *  usage : when create block
  *  call : new block(data)
  *
  *  sequence:
  *  1.insert transaction
  *  2.insert innerPolicy
  *  3.insert outerPolicy
  *  4.make header
  *  5.make txTrie
  *  6.make and insert blockHV
  *
  *  data composition
  *  Transactions : Transactions what is occured between previous block and this block
  *  innerPolicy : innerPolicy array
  *  outerPolicy : outerpolicy array
  *  header :
  *     id : block id
  *     minerId : miner id what create this
  *     NoT : number of Transactions
  *     prvBlockHV : previous Block hash value
  *@constructor Block
  *@param {object} data
  ***********************/
  constructor(data){
    const self = this

    this.innerPolicy = []
    this.outerPolicy = []
    this.Transactions = []

    this._inBlockchain = false
    this.txTrie ={}

    //dataTransaction put here
    if(Array.isArray(data.Transactions)){
        _.forEach(data.Transactions , function(tx){
           self.Transactions.push(tx)
        })
    }

    //innerpolicy, outerpolicy
    if(Array.isArray(data.innerPolicy) && Array.isArray(data.outerPolicy)){
      this.innerPolicy = data.innerPolicy;
      this.outerPolicy = data.outerPolicy;
    }

    var headerData = {
       id : data.id,
       MinerId : data.MinerId,
       NoT : data.Transactions.length,
       prvBlockHV : data.prvBlockHV
    }


    //from database
    if(data.rootTxTrie !== undefined && data.txTrie !== undefined && data.time !== undefined){
       console.log('[block][create] from db')
       self.txTrie = data.txTrie
       headerData.txTrie = data.rootTxTrie
       headerData.time = data.time
       self.header = new bh(headerData)

    }else{
      //not genesisblock
      if(data.prvBlockHV !== "0"){
        self.genTxTrie(function(err, result){
            headerData.txTrie = self.txTrie.root
            self.header = new bh(headerData);
        })

      }else{
        //genesisblock
        console.log('[block][create] genesisblock step')
        self._inBlockchain = true
        headerData.txTrie = 'null'
        self.txTrie = {root : 'null'}
        self.header = new bh(headerData);
      }
    }

      if(data.BlockHV !== undefined){
        self.header.setBlockHV(data.BlockHV)
      }else{
        self.header.setBlockHV(crypto.SHA256(this.header + this.outerPolicy + this.innerPolicy + this.Transactions + this.txTrie + this.header.txTrie).toString())
        //header.BlockHV  = crypto.SHA256(this.header + this.outerPolicy + this.innerPolicy + this.Transactions).toString();
      }

      console.log('[block][create] create new block')

  }

  /*return block hash */
  hash(){
    return this.header.hash()
  }

  isGenesis(){
    return this.header.isGenesis()
  }


/***********************
 *validate block section
 *
 *usage : check when need to validate block
 *call : object.vaildate(blockchain, function(errors){})
 *sequence :
 *
 *1.header check
 *
 *2.transaction trie check
 *2.1 generateTxTrie
 *2.2 validateTxTrie
 *
 *3. outerpolicy check
 *
 *4. innerpolicy check
 *
 *@method validate
 *@param {Array} blockchain
 *@param {function} cb
************************/

  validate(blockchain, cb){
    const self = this
      var errors = []

      async.series([

        //generate TransactionTrie
        function gen(cb){
          //console.log('validate 1')
          self.genTxTrie(cb)
        },

        function val(cb){
          self.header.validate(blockchain,cb)
        },

        function verify(cb){
          //console.log('validate 3')
          //1
          if(!self.validateTxTrie()){
            //errors.push('invaild TxTire')
            return cb(self.header.Id + ':invalid TxTrie')
          }
/* Not used anymore because of encryted transaction
          //2
          var txErrors = self.validateTransaction()
          if(txErrors !== ''){
            return cb(self.header.Id + ':invalid tx')
          }
*/
          //3
          var outErrors = self.outvalidate()
          if(outErrors !== ''){
            return cb(self.header.Id + ':invalid outer')
          }

          //4
          var innErrors = self.innvalidate()
          if(innErrors !== ''){
            return cb(self.header.Id + ':invalid inner')
          }

          cb(null, 'validate 3')
        }
      ],function(err, result){
         if(err)
          cb(err,null)
         else
          cb(null, result)
      })
  }


  /**********************
   * Generate transaction trie. The tx trie must be generated before the transaction trie can
   * be validated with `validateTransactionTrie`
   * - source :  etherium-js
   * @method genTxTrie
   * @param {Function} cb the callback
   **********************/
  genTxTrie(cb){

    const self = this

    if(self.Transactions.length !== 0 ){
      Trie.fromArray({array : self.Transactions}, function(err, result){
        if(err){
          console.log(err)
          cb('[block] falid generate Transaction Tire')
        }else{

        console.log('[block] sucess generate Transaction Trie')
        self.txTrie = result
        return cb(null, 'validate genTxtrie')
       }
      })
    }else{

      console.log('[block] sucess generate Transaction Trie when no input')
      self.txTrie = { root : 'null'}
      cb(null, 'validate genTxtrie')
    }

  }


  /********************
  *check  trascation Trie hash value , have make After genTxTrie
  *@method validateTxTrie
  *@param {function} cb
  *@return {bool}
  ********************/
  validateTxTrie(cb){
    const self = this

    var txT = self.header.txTrie.toString('hex')

    if(self.Transactions.length){
      return txT === self.txTrie.root.toString('hex')
    }else{
      return true
    }
  }

  /********************
  *validate trascation , It have to match format
  *not use anymore because of encrypt
  *@method validateTransaction
  *@return {Array} errors
  ********************/
  validateTransaction(){
    const self = this

    var errors = []

    self.Transactions.forEach(function(tx, i){
       var error = self.txvalidate(tx)
       if(error){
         errors.push(error + ' at tx' + i)
       }
    })

    return self.arrayToString(errors)
  }

  /********************
  *it is used in validateTransaction, validate each trascation
  *@method txvalidate
  *@param {object} tx
  *@return {Array} errors
  ********************/
   txvalidate(tx){
      const errors = [];

      if(!(tx.txType == 1 || tx.txType == 2 || tx.txType ==3 || tx.txType == 4)){
          errors.push(['undefined txType ' + tx.txType])
      }

      return errors.join(' ')
   }

   /********************
   *validte outerpolicy , It have to match format
   *@method outvalidate
   *@param {object} outerPolicy
   *@return {Array} errors
   ********************/
   outvalidate(outerPolicy){
     const self = this;
     const errors = [];

     self.outerPolicy.forEach(function(outp, i){
          if(outp.number == null || outp.devId == null || outp.txType == null || outp.trgORop == null || outp.action == null){
            errors.push('invalid outerpolicy ' + i)
          }
     })

     return self.arrayToString(errors)
   }
   /********************
   *validte innerpolicy , It have to match format
   *@method innvalidate
   *@param {object} innerPolicy
   *@return {Array} errors
   ********************/
   innvalidate(innerPolicy){
     const self = this;
     const errors = []

     self.innerPolicy.forEach(function(innp, i){
       if(innp.number == null || innp.policyType == null || innp.action == null){
         errors.push('invalid innerpolicy'+i)
       }
     })

     return self.arrayToString(errors)
   }
   
   /********************
   *Array transform string
   *@method arrayToString
   *@param {Array} array
   *@return {String} errors
   ********************/
   arrayToString(array) {
     try {
       return array.reduce(function (str, err) {
         if (str) {
           str += ' '
         }
         return str + err
       })
     } catch (e) {
       return ''
     }
   }
}




module.exports = Block;
