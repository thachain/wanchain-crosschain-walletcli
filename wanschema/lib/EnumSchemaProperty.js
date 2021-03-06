let UintProperty = require('./NormalSchemaProperty.js').UintProperty;
let FunctionCell = require('../../stepcell/index.js').FunctionCell;
module.exports = class EnumSchemaProperty extends UintProperty
{
    constructor(name,description,message,Enums){
        super(name,description,message,1,Enums.length);
        this.Enums = Enums;
        this.beginCell = new FunctionCell(true,function(self,obj){
            for(var i = 0;i<obj.length;++i){
                console.log(i+1,obj[i]);
            }
        },this.Enums);
    }
}
