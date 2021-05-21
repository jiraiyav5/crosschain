var xlsx2json = require("node-xlsx");
var fs = require("fs");

var list = xlsx2json.parse("./genecopy.csv" );
// 一般读取到的数据为[[{data: []}],[{data: []}]]格式
// 具体情况自己打印观察一下 console.log(data)
// 我这里只做遍历list[0].data的遍历，具体情况具体处理
console.log(list)
var data = [...(list[0].data)];
console.log(data)
var arr = [];
for (let i = 1 ; i < data.length; i++) {
    const param = {
       // 这里对数据进行处理，具体情况具体处理，相应值赋给相应字段
    };
    arr.push(param);
}
// 将数组转换成JSON格式并写入文件
var dataJson = JSON.stringify(arr);
fs.writeFileSync('./result.json',dataJson);
