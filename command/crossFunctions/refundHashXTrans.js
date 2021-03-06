let prompt = require('../../Prompt/newPrompt.js');
let SchemaFactory = require('../../schema/SchemaFactory.js');
let FunctionCell = require('../../stepcell/index.js').FunctionCell;
let DebugLog = require('../../logger/DebugLog.js');
let config = require('../../config');
module.exports = function (sendTransaction) {
    //first : get transaction from database
    let chainType = (sendTransaction.sendServer.chainType == 'ETH') ? 'WAN' : 'ETH';
    let crossType = (sendTransaction.sendServer.chainType == 'ETH') ? 'WETH2ETH' : 'ETH2WETH';
    let FeeGroup = SchemaFactory.FeeGroup();
    let submitSendGroup = SchemaFactory.submitSendGroup();
    let sendSchema = [
        SchemaFactory.crossTransOptionalSchama(chainType),
        FeeGroup[1],
        FeeGroup[2],
        //submitSendGroup[0],
        submitSendGroup[1]
    ]
    prompt.get(sendSchema, function (err, result,self) {
        if(!err)
        {
            DebugLog.debug(result);
            let index = self.parent.index;
            let transResult = result;

            if (crossType === 'ETH2WETH') {
                transResult.tokenAddress = config.wanchainHtlcAddr;
            } else if (crossType === 'WETH2ETH') {
                transResult.tokenAddress = config.originalChainHtlc;
            }

            DebugLog.debug(transResult);

            self.parent.insertChild(index,new FunctionCell(false,function(self) {
                sendTransaction.createRefundFromLockTransaction(transResult.lockTxHash,transResult.tokenAddress,null,null,
                    null,transResult.gas,transResult.gasPrice,crossType);

                let topics = sendTransaction.trans.Contract.getLockEvent();
                sendTransaction.sendServer.sendMessage('monitorLog',transResult.tokenAddress, topics, function (err, result) {
                    DebugLog.debug(err);
                    DebugLog.debug(result);
                    if (!err) {
                        self.stepNext();
                    }else{
                        console.error(err);
                        process.exit();
                    }
                });
                sendTransaction.sendServer.sendMessage('getScEvent',transResult.tokenAddress, topics, function (err, result) {
					// console.log(result);
                    if (!err && result.length) {
                        DebugLog.debug(result);
                        self.stepNext();
                        //transResult.tokenAddress = result;
                    }
                    else if (err) {
                        console.error(err);
                        process.exit();
                    }

                });
            }));

            index++;
            self.parent.insertChild(index,new FunctionCell(false,function(self){
/*
                let hashtrans = new transactionClass(web3,lockTrans.crossAdress,transResult.tokenAddress,null,null,
                    null,transResult.gas,new GWeiAmount(transResult.gasPrice),crossType);
                hashtrans.setKey(lockTrans.x);
                sendTransaction.trans = hashtrans;
*/
                sendTransaction.sendRefundTrans(transResult.password,function (err,result) {
                    if(!err){
                        console.log(result);
                    }else if (err) {
                        console.error(err);
                        process.exit();
                    }
                    self.stepNext();
                });
            }));
            //waiting for event
            self.stepNext();

        }
    });

}
