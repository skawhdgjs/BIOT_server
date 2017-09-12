var aes256 = require('aes256');


class CDipher{
    constructor(key){
        this.key = key;
    }


    //get serlized Data
    cipher(Tx){

      return aes256.encrypt(this.key, Tx );
    }


    decipher(Tx){

      return aes256.decrypt(this.key , Tx);

    }

}

module.exports = CDipher
