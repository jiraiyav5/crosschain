const Web3 = require('web3')
const fs = require('fs')
const BigNumber = require('bignumber.js')

const endpoint = 'https://mainnet.infura.io/v3/d85eb9c1150649e69461ec8c18d2c8a1'

const contract = '0x2CFa849e8506910b2564aFE5BdEF33Ba66C730Aa'

function sleep(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms)
  })
}

function getPastLogs(web3, option) {
  return new Promise(function (resolve, reject) {
    web3.eth.getPastLogs(option, function (error, result) {
      if (error) {
        return reject(error)
      }
      resolve(result)
    })
  })
}

function ConvertToTable(data) {
  data = data.toString();
  let table = new Array();
  let rows = new Array();
  rows = data.split("\n");
  for (let i = 0; i < rows.length; i++) {
    if(rows[i] == '') {
      continue
    }
    table.push(rows[i].split(","));
  }
  return table
}

function getFileLogs(filename) {
  if (!fs.existsSync(filename)) {
    fs.writeFileSync(filename,
      'block,sender,receiver,token,send_amount,re_amount\n',
      {
        flag: 'w+'
      })
  }

  const data = fs.readFileSync(filename)
  const table = ConvertToTable(data)
  if (table[0][0] == 'block') {
    return table.slice(1)
  }
  return table
}

function writeLogs(filename, rows) {
  let res = ''
  usdt_total = BigNumber(0)
  gene_total = 0
  etp_total = 0
  dna_total = 0
  for (const row of rows) {
    res += row.blockNumber + ','
    //res += row.transactionIndex + ','
    res += row.sender + ','
    res += row.receiver + ','
    //res += row.token + ''
    //console.log(row.token.toUpperCase(row.token))
    if(row.token.toUpperCase() == '0x2CFa849e8506910b2564aFE5BdEF33Ba66C730Aa'.toUpperCase())
      {
        res += 'GENE' + ','
        gene_total += (row.receipts/1000000000000000000)
      }
      else if ( row.token.toUpperCase() == '0x623761F60D677addBD5A07385e037105A13201EF'.toUpperCase())
        {
          res += 'USDT' +','
          usdt_total = BigNumber(usdt_total).plus(BigNumber(row.receipts).div(BigNumber(1000000)))
        }
      else
        res += row.token + ','
    res += row.amount.toString() + ','
    res += BigNumber(row.receipts).toString() + '\n'
  }
  res += 'ETP_TOTAL' + ',' + etp_total + '\n' + 'GENE_TOTAL' + ','  + gene_total + '\n' + 'USDT_TOTAL' + ',' + usdt_total +'\n'  + 'DNA_TOTAL' + ',' + dna_total+'\n'
  const data = Buffer.from(res)
  fs.writeFileSync(filename, data, { flag: 'a+' })
}

function writeJson(filename, rows) {
  let res = ''
  let usdt_str = ''
  let gene_str = ''
  let etp_str = ''
  let dna_str = ''
  for (const row of rows) {
   
    //res += row.transactionIndex + ','
    length = rows.length - 1
   // res += row.receiver + ','
    //res += row.token + ''
    //console.log(row.token.toUpperCase(row.token))
    if(row.token.toUpperCase() == '0x2CFa849e8506910b2564aFE5BdEF33Ba66C730Aa'.toUpperCase())
      {
        gene_str += '\"' + row.receiver + '\"'+ ':'
        gene_str += '\"' + row.receipts.toString() + '\"' + ','

      }
      else if ( row.token.toUpperCase() == '0x623761F60D677addBD5A07385e037105A13201EF'.toUpperCase())
        {
          usdt_str += '\"' + row.receiver + '\"'+ ':'
          usdt_str += '\"' + row.receipts.toString() + '000000000000' + '\"' + ','

        }
        else if ( row.token.toUpperCase() == '0xb1dF7CE84253ffcd01D92fA6662e761f86b61982'.toUpperCase())
        {
          dna_str +=  '\"' + row.receiver + '\"'+ ':'
          dna_str += '\"' + row.receipts.toString() + '\"' +','
        }
  }
  console.log(usdt_str)
  res += '{'
  if(etp_str)
    etp_str_new = '\"ETP\":{' +etp_str.substring(0,etp_str.length-1) +'}'
  if(gene_str)
    gene_str_new =  '\"GENE\":{' + gene_str.substring(0, gene_str.length-1) + '}'
  if(usdt_str)
    usdt_str_new = '\"USDT\":{' + usdt_str.substring(0,usdt_str.length-1) +'}'
  if(dna_str)
    dna_str_new = '\"DNA\":{' + dna_str.substring(0,dna_str.length-1) + '}'
  
  if(etp_str)
    res += etp_str_new + ','
  if(gene_str)
    res += gene_str_new + ','
  if(usdt_str)
    res += usdt_str_new +','
  if(dna_str)
    res += dna_str_new + ','
  console.log(res)
  res = res.substring(0,res.length-1)
  res += '}'
  
  const data = Buffer.from(res)
  fs.writeFileSync(filename, data, { flag: 'a+' })
}

async function main() {
  //const web3 = new Web3("http://10.10.10.248:9933")
  const web3 = new Web3("https://vm.mvs.org/mainnet/fce97a7e-8c50-4ab8-aeb2-89d3bc1d4cd2")

  const filename = './gene.csv'
  let rows = getFileLogs(filename)
  let last_block_height = rows.length > 0 ? rows[rows.length - 1][0] : 179982
  //rows.length=179972
  console.log('start', rows.length, last_block_height)
  while (true) {
    const options = {
      address: contract,
      topics: ["0x8cb56ef8789c978dad33bb5ae2b714fa3660c067eea9e64bf074a59c0b44f86c"],
      fromBlock: last_block_height,
    }
    const logs = await getPastLogs(web3, options)
    console.log("wait for PastLogs")
    const new_rows = []
    for (const log of logs) {
      if (rows.length > 0) {
        const last_row = rows[rows.length - 1]
        if (last_row[0] > log.blockNumber) {
          continue
        }

        if (last_row[0] == log.blockNumber) {
          if (last_row[1] >= log.transactionIndex) {
            continue
          }
        }
      }
      console.log(log)
      const evt = web3.eth.abi.decodeLog(require('./crosschain.json').inputs, log.data, log.topics.slice(1))
      console.log(evt)
      evt.blockNumber = log.blockNumber
      evt.transactionIndex = log.transactionIndex
      new_rows.push(evt)
    }

    if (new_rows.length == 0) {
      await sleep(2000)
      continue
    }

    rows = rows.concat(new_rows)
    writeLogs(filename, new_rows)
    writeJson('./result.json', new_rows)
    last_block_height = new_rows[new_rows.length - 1].blockNumber
  }
}


main()
