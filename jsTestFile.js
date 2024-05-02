const capFirstLetter = str => str.charAt(0).toUpperCase() + str.slice(1);

const populateWeatherData = data => {
   const weatherContainer = document.querySelector('.weather__container');
   weatherContainer.innerText = `${data.location}: ${data.temperature} C°, ${data.description}`;
}

const changeBg = desc => {
   desc = desc.toLowerCase();
   if (desc.includes('rain')) document.body.style.backgroundColor = '#345';
   else if (desc.includes('cloud')) document.body.style.backgroundColor = '#767A85';
   else if (desc.includes('sun')) document.body.style.backgroundColor = '#99CEEB';
   else if (desc.includes('haze')) document.body.style.backgroundColor = '#929296';
   else if (desc.includes('snow')) document.body.style.backgroundColor = '#fcedfb';
   else document.body.style.backgroundColor = '#fff';
}

const getWeatherData = () => {
   const apiKey = '95a1c911b963af6987e120314c49c593';
   const location = document.querySelector('.location').value.trim();
   if (!location) {
      alert('No location provided');
      return;
   }
   const apiURL = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}`;
   let weatherData = []
   let weatherObj = {}
   fetch(apiURL)
      .then(res => {
         if (!res.ok) throw new Error('Network response was not ok');
         return res.json()
      }).then(data => {
         weatherData.push(capFirstLetter(location));
         weatherData.push(Math.round(data.main.temp - 273));
         weatherData.push(capFirstLetter(data.weather[0].description));
         let headers = ['location', 'temperature', 'description']
         for (let i = 0; i < weatherData.length; i++) weatherObj[headers[i]] = weatherData[i];
         populateWeatherData(weatherObj);
         changeBg(weatherObj.description);
      }).catch(err => {
         console.error(`Error fetching data: ${err.message}`);
         alert('An error occured try again.')
      })
}


const numbers = [1, 2, 3, 4, 5];

// Use for...of loop to iterate over the array
for (const number of numbers) {
   console.log(number);
}
const person = {
   name: 'John',
   age: 30,
};

console.log(person instanceof Object); // true, person is an instance of Object

// Delete a property from the object
delete person.age;
console.log(person); // { name: 'John' }

// Check the type of a variable
const value = 42;
console.log(typeof value); // number

// Check the type of an object
console.log(typeof person); // object








const { app, BrowserWindow } = require('electron');
const path = require('path');

const isDeveloper = true;

const createWindow = () => {
   const window = new BrowserWindow({
      // fullscreen: true,
      width: 1600,
      height: 900,
      minWidth: 800,
      minHeight: 450,
      webPreferences: {
         nodeIntegration: true,
         contextIsolation: false,
      }
   });
   window.setMenuBarVisibility(false);
   if (isDeveloper) window.webContents.openDevTools();
   window.loadFile(path.join(__dirname, '../pages/dashboard.html'));
}

app.whenReady().then(() => {
   createWindow();
   app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
   });
});

app.on('window-all-closed', () => {
   if (process.platform !== 'darwin') app.quit();
});

const fs = require('fs');
const path = require('path');
const dgram = require('dgram');
const server = dgram.createSocket('udp4');
// server information
const HOST = '127.0.0.1';
const PORT = 9996;

const arithmetic = require('./alu');
const systemCall = require('../os');
const { splitInstruction } = require('../utils');
const {
   INSTRUCTION_MAP,
   REGISTERS,
   JUMP,
   NOA
} = require('../constants');

module.exports = (instruction, registers, memory, stack) => {
   const [opcode, rd, rs, high8, high10] = splitInstruction(instruction);
   const namedOpcode = INSTRUCTION_MAP[opcode];
   const jumpAddress = registers[REGISTERS[high8 & 0b11]];
   const jumpOffset = (instruction >> 4);

   switch (namedOpcode) {
      case 'CAL':
         stack.push(registers.IP);
         registers.IP = registers[REGISTERS[rd]];
         return false;

      case 'JCP':
         switch (high8 >> 2) {
            case JUMP.EQ:
               if (registers[REGISTERS[rd]] === registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.NEQ:
               if (registers[REGISTERS[rd]] !== registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.LT:
               if (registers[REGISTERS[rd]] < registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.GT:
               if (registers[REGISTERS[rd]] > registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.LTE:
               if (registers[REGISTERS[rd]] <= registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.GTE:
               if (registers[REGISTERS[rd]] >= registers[REGISTERS[rs]]) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.ZER:
               if (registers[REGISTERS[rd]] === 0) {
                  registers.IP = jumpAddress;
               }
               break;
            case JUMP.NZE:
               if (registers[REGISTERS[rd]] !== 0) {
                  registers.IP = jumpAddress;
               }
               break;
            default:
         }
         return false;
      case 'JMP':
         registers.IP += -(jumpOffset & 0x800) | (jumpOffset & ~0x800);
         return false;
      case 'JMR':
         registers.IP = registers[REGISTERS[rd]];
         return false;


      case 'MVR':
         registers[REGISTERS[rd]] = ((registers[REGISTERS[rs]] << 16) >> 16) + ((high8 << 24) >> 24);
         return false;

      case 'MVV':
         switch (high10 & 3) {
            case 0: // MVI
               registers[REGISTERS[rd]] = high8;
               return false;
            case 1: // ADI
               registers[REGISTERS[rd]] = ((registers[REGISTERS[rd]] << 16) >> 16) + ((high8 << 24) >> 24);
               return false;
            case 2: // MUI
               registers[REGISTERS[rd]] = high8 << 8;
               return false;
            case 3: // AUI
               registers[REGISTERS[rd]] += (high8 << 8);
               return false;
            default:
               break;
         }
         break;
      case 'LDR':
         registers[REGISTERS[rd]] = memory[((registers[REGISTERS[rs]] << 16) + ((high8 << 24) >> 8)) >>> 16];
         break;
      case 'LDA':
         registers[REGISTERS[rd]] = memory[high10];
         return false;
      case 'STA':
         memory[high10] = registers[REGISTERS[rd]];
         return false;
      case 'STR':
         memory[((registers[REGISTERS[rd]] << 16) + ((high8 << 24) >> 8)) >>> 16] = registers[REGISTERS[rs]];
         return false;

      case 'ATH':
         arithmetic(registers, rs, rd, high8);
         return false;

      case 'PSH':
         stack.push(registers[REGISTERS[rs]]);
         return false;
      case 'POP':
         registers[REGISTERS[rd]] = stack.pop();
         return false;

      case 'NOA':
         switch ((instruction & 0xF0) >> 4) {
            case NOA.NOP:
               return false;
            case NOA.RET:
               registers.IP = stack.pop();
               return false;
            case NOA.SYS:
               systemCall(registers, memory);
               return false;
            case NOA.HLT:
               return true;
            default:
            // Unsupported type
         }
         break;

      default:
         throw new Error(`Unknown opcode ${opcode}. Exiting...`);
   }
}

// operation ids
const HANDSHAKE = 0;
const SUBSCRIBE_UPDATE = 1;
const SUBSCRIBE_SPOT = 2;
const DISMISS = 3;



// set local time and date
const prefs = { hour: '2-digit', minute: '2-digit' }
let dateContainer = document.querySelector('.local__date');
let timeContainer = document.querySelector('.local__time');

const raw = new Date();
let date = `${raw.getMonth() + 1}/${raw.getDate()}/${raw.getFullYear()}`;
let time = new Date().toLocaleTimeString('en-US', prefs);
dateContainer.innerHTML = date;
timeContainer.innerHTML = time.replace(/^0+/, '');

setInterval(function () {
   const raw = new Date();
   let date = `${raw.getMonth() + 1}/${raw.getDate()}/${raw.getFullYear()}`;
   let time = new Date().toLocaleTimeString('en-US', prefs);
   dateContainer.innerHTML = date;
   timeContainer.innerHTML = time.replace(/^0+/, '');
}, 1000);



const HEADERS_PATH = path.join(__dirname, '../constants', 'headers.txt');
const HEADERS = fs.readFileSync(HEADERS_PATH, 'utf-8');
let RECORDING = false;
let RACE_DATA = '';

// recording functions
const startRecording = () => {
   // return if already recording
   if (RECORDING) return;
   console.log('Started recording');
   RECORDING = true;
}

const pauseRecording = () => {
   // return if not already recording
   if (!RECORDING) return;
   console.log('Paused recording');
   RECORDING = false;
}
const {
   REGISTERS,
   ARITHMETIC
} = require('../constants');

const decodeAluArguments = (high8, rs, rd) => {
   const arithmeticOperation = (high8 & 0b00001111);
   const resultMode = (high8 & 0b00010000) >> 4;
   const shiftAmount = (high8 & 0b11100000) >> 5;
   const resultRegister = (resultMode === ARITHMETIC.DESTINATION_MODE)
      ? rd
      : rs;
   return [
      arithmeticOperation,
      resultRegister,
      shiftAmount
   ];
}

const result = new Uint16Array(1);

module.exports = (registers, rs, rd, high8) => {
   const [
      arithmeticOperation,
      resultRegister,
      shiftAmount
   ] = decodeAluArguments(high8, rs, rd);

   switch (arithmeticOperation) {
      case ARITHMETIC.ADD:
         result[0] = registers[REGISTERS[rd]] + registers[REGISTERS[rs]];
         break;
      case ARITHMETIC.SUB:
         result[0] = registers[REGISTERS[rd]] - registers[REGISTERS[rs]];
         break;
      case ARITHMETIC.MUL:
         result[0] = registers[REGISTERS[rd]] * registers[REGISTERS[rs]];
         break;
      case ARITHMETIC.DIV:
         result[0] = Math.floor(registers[REGISTERS[rd]] / registers[REGISTERS[rs]]);
         break;
      case ARITHMETIC.INC:
         registers[REGISTERS[rd]]++;
         return;
      case ARITHMETIC.DEC:
         registers[REGISTERS[rd]]--;
         return;

      case ARITHMETIC.LSF:
         result[0] = registers[REGISTERS[rd]] << shiftAmount;
         break;
      case ARITHMETIC.RSF:
         result[0] = registers[REGISTERS[rd]] >> shiftAmount;
         break;
      case ARITHMETIC.AND:
         result[0] = registers[REGISTERS[rs]] & registers[REGISTERS[rd]];
         break;
      case ARITHMETIC.OR:
         result[0] = registers[REGISTERS[rs]] | registers[REGISTERS[rd]];
         break;
      case ARITHMETIC.XOR:
         result[0] = registers[REGISTERS[rs]] ^ registers[REGISTERS[rd]];
         break;
      case ARITHMETIC.NOT:
         result[0] = ~registers[REGISTERS[rs]];
         break;
   }

   registers[REGISTERS[resultRegister]] = result[0];
};
const stopRecording = () => {
   // return if not already recording
   if (!RECORDING) return;
   console.log('Stopped recording');
   RECORDING = false;

   const fileName = String(Date.now());
   const filePath = path.join(__dirname, '../data', `${fileName}.csv`);
   fs.writeFileSync(filePath, HEADERS + RACE_DATA, {
      encoding: 'utf-8',
      flag: 'w'
   });

   RACE_DATA = '';
}

const colors = require('colors/safe');
const { readFile, writeFile, stat } = require('fs');
const fs = require('bluebird').promisifyAll({ readFile, writeFile, stat });

const {
   DESTINATION_SHIFT,
   SOURCE_SHIFT,
   ADDRESS_SHIFT,
   LONG_ADDRESS_SHIFT
} = require('./constants');

const leftPad = (str, pad = 4, padWith = '0') =>
   (str.length < pad)
      ? Array.apply(null, { length: pad - str.length })
         .reduce((padding) => padding + padWith, '') + str
      : str;

const arrayAsHex = (arr, startingOffset = 0, ip = -1) => {
   let s = `${leftPad(startingOffset.toString(16))}\t`;
   for (let i = 0; i < arr.length; i++) {
      const fourBitsPadded = leftPad(arr[i].toString(16), 4);

      let cf = x => x;
      if (i === ip) cf = colors.yellow;
      s += cf(fourBitsPadded) + ' ';

      //  if (((i + 1) % 16 === 0)) s += `\n${leftPad((startingOffset + i + 1).toString(16))}\t`;
   }
   return s;
};
const convertUint8ArrayToUint16Array = (u8) => {
   const u16 = new Uint16Array(u8.length / 2);
   u8.forEach((_, i) => {
      if (i % 2 !== 0) {
         u16[(i - 1) / 2] = u8[i - 1] | (u8[i] << 8);
      }
   });
   return u16;
};
const splitInstruction = (instruction) => [
   (instruction & 0b0000000000001111),
   (instruction & 0b0000000000110000) >> DESTINATION_SHIFT,
   (instruction & 0b0000000011000000) >> SOURCE_SHIFT,
   (instruction & 0b1111111100000000) >> ADDRESS_SHIFT,
   (instruction & 0b1111111111000000) >> LONG_ADDRESS_SHIFT
];

module.exports = {
   leftPad,
   arrayAsHex,
   convertUint8ArrayToUint16Array,
   splitInstruction,

   fs
};

// utility functions
// const readString = (buffer, start, length) => {
//    let string = buffer.toString('binary', start, start + length);
//    let tokens = string.split('%');
//    return tokens[0];
// }

const send = operation => {
   let message = new Buffer.alloc(12);
   message.writeInt32LE(1, 0);
   message.writeInt32LE(1, 4);
   message.writeInt32LE(operation, 8);
   server.send(message, 0, message.length, PORT, HOST);
}

const startSession = () => {
   send(HANDSHAKE);
   send(SUBSCRIBE_UPDATE);
}

const stopSession = () => {
   send(DISMISS);
}

const requestSessionInfo = () => {
}

const createMemory = require('./create-memory');
const registers = require('./registers');
const instructions = require('./instructions');

class CPU {
   constructor(memory, interuptVectorAddress = 0x1000) {
      this.memory = memory;

      this.registers = createMemory(registers.length * 2);
      this.registerMap = registers.reduce((map, name, i) => {
         map[name] = i * 2;
         return map;
      }, {});

      this.interuptVectorAddress = interuptVectorAddress;
      this.isInInteruptHandler = false;
      this.setRegister('im', 0xffff);

      this.setRegister('sp', 0xffff - 1);
      this.setRegister('fp', 0xffff - 1);

      this.stackFrameSize = 0;
   }

   debug() {
      registers.forEach(name => {
         console.log(`${name}: 0x${this.getRegister(name).toString(16).padStart(4, '0')}`);
      });
      console.log();
   }

   viewMemoryAt(address, n = 8) {
      // 0x0f01: 0x04 0x05 0xA3 0xFE 0x13 0x0D 0x44 0x0F ...
      const nextNBytes = Array.from({ length: n }, (_, i) =>
         this.memory.getUint8(address + i)
      ).map(v => `0x${v.toString(16).padStart(2, '0')}`);

      console.log(`0x${address.toString(16).padStart(4, '0')}: ${nextNBytes.join(' ')}`);
   }

   getRegister(name) {
      if (!(name in this.registerMap)) {
         throw new Error(`getRegister: No such register '${name}'`);
      }
      return this.registers.getUint16(this.registerMap[name]);
   }

   setRegister(name, value) {
      if (!(name in this.registerMap)) {
         throw new Error(`setRegister: No such register '${name}'`);
      }
      return this.registers.setUint16(this.registerMap[name], value);
   }

   fetch() {
      const nextInstructionAddress = this.getRegister('ip');
      const instruction = this.memory.getUint8(nextInstructionAddress);
      this.setRegister('ip', nextInstructionAddress + 1);
      return instruction;
   }

   fetch16() {
      const nextInstructionAddress = this.getRegister('ip');
      const instruction = this.memory.getUint16(nextInstructionAddress);
      this.setRegister('ip', nextInstructionAddress + 2);
      return instruction;
   }

   push(value) {
      const spAddress = this.getRegister('sp');
      this.memory.setUint16(spAddress, value);
      this.setRegister('sp', spAddress - 2);
      this.stackFrameSize += 2;
   }

   pop() {
      const nextSpAddress = this.getRegister('sp') + 2;
      this.setRegister('sp', nextSpAddress);
      this.stackFrameSize -= 2;
      return this.memory.getUint16(nextSpAddress);
   }

   pushState() {
      this.push(this.getRegister('r1'));
      this.push(this.getRegister('r2'));
      this.push(this.getRegister('r3'));
      this.push(this.getRegister('r4'));
      this.push(this.getRegister('r5'));
      this.push(this.getRegister('r6'));
      this.push(this.getRegister('r7'));
      this.push(this.getRegister('r8'));
      this.push(this.getRegister('ip'));
      this.push(this.stackFrameSize + 2);

      this.setRegister('fp', this.getRegister('sp'));
      this.stackFrameSize = 0;
   }

   popState() {
      const framePointerAddress = this.getRegister('fp');
      this.setRegister('sp', framePointerAddress);

      this.stackFrameSize = this.pop();
      const stackFrameSize = this.stackFrameSize;

      this.setRegister('ip', this.pop());
      this.setRegister('r8', this.pop());
      this.setRegister('r7', this.pop());
      this.setRegister('r6', this.pop());
      this.setRegister('r5', this.pop());
      this.setRegister('r4', this.pop());
      this.setRegister('r3', this.pop());
      this.setRegister('r2', this.pop());
      this.setRegister('r1', this.pop());

      const nArgs = this.pop();
      for (let i = 0; i < nArgs; i++) {
         this.pop();
      }

      this.setRegister('fp', framePointerAddress + stackFrameSize);
   }

   fetchRegisterIndex() {
      return (this.fetch() % registers.length) * 2;
   }

   handleInterupt(value) {
      const interruptBit = value % 0xf;
      console.log(`CPU Interrupt :: ${interruptBit}`);

      // If the interrupt is masked by the interrupt mask register
      // then do not enter the interrupt handler
      const isUnmasked = Boolean((1 << interruptBit) & this.getRegister('im'));
      if (!isUnmasked) {
         return;
      }

      // Calculate where in the interupt vector we'll look
      const addressPointer = this.interuptVectorAddress + (interruptBit * 2);
      // Get the address from the interupt vector at that address
      const address = this.memory.getUint16(addressPointer);

      // We only save state when not already in an interupt
      if (!this.isInInteruptHandler) {
         // 0 = 0 args. This is just to maintain our calling convention
         // If this were a software defined interrupt, the caller is expected
         // to supply any required data in registers
         this.push(0);
         // Save the state
         this.pushState();
      }

      this.isInInteruptHandler = true;

      // Jump to the interupt handler
      this.setRegister('ip', address);
   }

   execute(instruction) {
      switch (instruction) {
         case instructions.RET_INT.opcode: {
            console.log('Return from interupt');
            this.isInInteruptHandler = false;
            this.popState();
            return;
         }

         case instructions.INT.opcode: {
            // We're only looking at the least significant nibble
            const interuptValue = this.fetch16() & 0xf;
            this.handleInterupt(interuptValue);
            return;
         }

         // Move literal into register
         case instructions.MOV_LIT_REG.opcode: {
            const literal = this.fetch16();
            const register = this.fetchRegisterIndex();
            this.registers.setUint16(register, literal);
            return;
         }

         // Move register to register
         case instructions.MOV_REG_REG.opcode: {
            const registerFrom = this.fetchRegisterIndex();
            const registerTo = this.fetchRegisterIndex();
            const value = this.registers.getUint16(registerFrom);
            this.registers.setUint16(registerTo, value);
            return;
         }

         // Move register to memory
         case instructions.MOV_REG_MEM.opcode: {
            const registerFrom = this.fetchRegisterIndex();
            const address = this.fetch16();
            const value = this.registers.getUint16(registerFrom);
            this.memory.setUint16(address, value);
            return;
         }

         // Move memory to register
         case instructions.MOV_MEM_REG.opcode: {
            const address = this.fetch16();
            const registerTo = this.fetchRegisterIndex();
            const value = this.memory.getUint16(address);
            this.registers.setUint16(registerTo, value);
            return;
         }

         // Move literal to memory
         case instructions.MOV_LIT_MEM.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();
            this.memory.setUint16(address, value);
            return;
         }

         // Move register* to register
         case instructions.MOV_REG_PTR_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const ptr = this.registers.getUint16(r1);
            const value = this.memory.getUint16(ptr);
            this.registers.setUint16(r2, value);
            return;
         }

         // Move value at [literal + register] to register
         case instructions.MOV_LIT_OFF_REG.opcode: {
            const baseAddress = this.fetch16();
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const offset = this.registers.getUint16(r1);

            const value = this.memory.getUint16(baseAddress + offset);
            this.registers.setUint16(r2, value);
            return;
         }

         // Add register to register
         case instructions.ADD_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);
            this.setRegister('acc', registerValue1 + registerValue2);
            return;
         }

         // Add literal to register
         case instructions.ADD_LIT_REG.opcode: {
            const literal = this.fetch16();
            const r1 = this.fetchRegisterIndex();
            const registerValue = this.registers.getUint16(r1);
            this.setRegister('acc', literal + registerValue);
            return;
         }

         // Subtract literal from register value
         case instructions.SUB_LIT_REG.opcode: {
            const literal = this.fetch16();
            const r1 = this.fetchRegisterIndex();
            const registerValue = this.registers.getUint16(r1);
            const res = registerValue - literal;
            this.setRegister('acc', res);
            return;
         }

         // Subtract register value from literal
         case instructions.SUB_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch16();
            const registerValue = this.registers.getUint16(r1);
            const res = literal - registerValue;
            this.setRegister('acc', res);
            return;
         }

         // Subtract register value from register value
         case instructions.SUB_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);
            const res = registerValue1 - registerValue2;
            this.setRegister('acc', res);
            return;
         }

         // Multiply literal by register value
         case instructions.MUL_LIT_REG.opcode: {
            const literal = this.fetch16();
            const r1 = this.fetchRegisterIndex();
            const registerValue = this.registers.getUint16(r1);
            const res = literal * registerValue;
            this.setRegister('acc', res);
            return;
         }

         // Multiply register value by register value
         case instructions.MUL_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);
            const res = registerValue1 * registerValue2;
            this.setRegister('acc', res);
            return;
         }

         // Increment value in register (in place)
         case instructions.INC_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const oldValue = this.registers.getUint16(r1);
            const newValue = oldValue + 1;
            this.registers.setUint16(r1, newValue);
            return;
         }

         // Decrement value in register (in place)
         case instructions.DEC_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const oldValue = this.registers.getUint16(r1);
            const newValue = oldValue - 1;
            this.registers.setUint16(r1, newValue);
            return;
         }

         // Left shift register by literal (in place)
         case instructions.LSF_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch();
            const oldValue = this.registers.getUint16(r1);
            const res = oldValue << literal;
            this.registers.setUint16(r1, res);
            return;
         }

         // Left shift register by register (in place)
         case instructions.LSF_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const oldValue = this.registers.getUint16(r1);
            const shiftBy = this.registers.getUint16(r2);
            const res = oldValue << shiftBy;
            this.registers.setUint16(r1, res);
            return;
         }

         // Right shift register by literal (in place)
         case instructions.RSF_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch();
            const oldValue = this.registers.getUint16(r1);
            const res = oldValue >> literal;
            this.registers.setUint16(r1, res);
            return;
         }

         // Right shift register by register (in place)
         case instructions.RSF_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const oldValue = this.registers.getUint16(r1);
            const shiftBy = this.registers.getUint16(r2);
            const res = oldValue >> shiftBy;
            this.registers.setUint16(r1, res);
            return;
         }

         // And register with literal
         case instructions.AND_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch16();
            const registerValue = this.registers.getUint16(r1);

            const res = registerValue & literal;
            this.setRegister('acc', res);
            return;
         }

         // And register with register
         case instructions.AND_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);

            const res = registerValue1 & registerValue2;
            this.setRegister('acc', res);
            return;
         }

         // Or register with literal
         case instructions.OR_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch16();
            const registerValue = this.registers.getUint16(r1);

            const res = registerValue | literal;
            this.setRegister('acc', res);
            return;
         }

         // Or register with register
         case instructions.OR_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);

            const res = registerValue1 | registerValue2;
            this.setRegister('acc', res);
            return;
         }

         // Xor register with literal
         case instructions.XOR_REG_LIT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const literal = this.fetch16();
            const registerValue = this.registers.getUint16(r1);

            const res = registerValue ^ literal;
            this.setRegister('acc', res);
            return;
         }

         // Xor register with register
         case instructions.XOR_REG_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const r2 = this.fetchRegisterIndex();
            const registerValue1 = this.registers.getUint16(r1);
            const registerValue2 = this.registers.getUint16(r2);

            const res = registerValue1 ^ registerValue2;
            this.setRegister('acc', res);
            return;
         }

         // Not (invert) register
         case instructions.NOT.opcode: {
            const r1 = this.fetchRegisterIndex();
            const registerValue = this.registers.getUint16(r1);

            const res = (~registerValue) & 0xffff;
            this.setRegister('acc', res);
            return;
         }

         // Jump if literal not equal
         case instructions.JMP_NOT_EQ.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value !== this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if register not equal
         case instructions.JNE_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value !== this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if literal equal
         case instructions.JEQ_LIT.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value === this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if register equal
         case instructions.JEQ_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value === this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if literal less than
         case instructions.JLT_LIT.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value < this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if register less than
         case instructions.JLT_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value < this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if literal greater than
         case instructions.JGT_LIT.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value > this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if register greater than
         case instructions.JGT_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value > this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if literal less than or equal to
         case instructions.JLE_LIT.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value <= this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         function fib() {
            return 1;
         }

            // Example string containing email addresses
            const text = 'Email me at john.doe@example.com or jane@example.com.';

            // Regular expression to match email addresses
            const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

            // Find all matches of email addresses in the string
            const matches = text.match(emailRegex);

            // Log the matched email addresses
            console.log(matches);


         // Jump if register less than or equal to
         case instructions.JLE_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value <= this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if literal greater than or equal to
         case instructions.JGE_LIT.opcode: {
            const value = this.fetch16();
            const address = this.fetch16();

            if (value >= this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Jump if register greater than or equal to
         case instructions.JGE_REG.opcode: {
            const r1 = this.fetchRegisterIndex();
            const value = this.registers.getUint16(r1);
            const address = this.fetch16();

            if (value >= this.getRegister('acc')) {
               this.setRegister('ip', address);
            }

            return;
         }

         // Push Literal
         case instructions.PSH_LIT.opcode: {
            const value = this.fetch16();
            this.push(value);
            return;
         }

         // Push Register
         case instructions.PSH_REG.opcode: {
            const registerIndex = this.fetchRegisterIndex();
            this.push(this.registers.getUint16(registerIndex));
            return;
         }

         // Pop
         case instructions.POP.opcode: {
            const registerIndex = this.fetchRegisterIndex();
            const value = this.pop();
            this.registers.setUint16(registerIndex, value);
            return;
         }

         // Call literal
         case instructions.CAL_LIT.opcode: {
            const address = this.fetch16();
            this.pushState();
            this.setRegister('ip', address);
            return;
         }

         // Call register
         case instructions.CAL_REG.opcode: {
            const registerIndex = this.fetchRegisterIndex();
            const address = this.registers.getUint16(registerIndex);
            this.pushState();
            this.setRegister('ip', address);
            return;
         }

         // Return from subroutine
         case instructions.RET.opcode: {
            this.popState();
            return;
         }

         // Halt all computation
         case instructions.HLT.opcode: {
            return true;
         }
      }
   }

   step() {
      const instruction = this.fetch();
      return this.execute(instruction);
   }

   run() {
      const halt = this.step();
      if (!halt) {
         setImmediate(() => this.run());
      }
   }
}

module.exports = CPU;

const parsePackets = packets => {
   return {
      speedKPH: packets.readFloatLE(8),
      speedMPH: packets.readFloatLE(12),
      speedMPS: packets.readFloatLE(16),

      absEnabled: packets.readInt8(20),
      absActive: packets.readInt8(21),
      tcEnabled: packets.readInt8(23),
      tcActive: packets.readInt8(22),
      inPit: packets.readInt8(24),
      engineLimitedOn: packets.readInt8(25),

      accelerationGVertical: packets.readFloatLE(28),
      accelerationGHorizontal: packets.readFloatLE(32),
      accelerationGFrontal: packets.readFloatLE(36),

      currentLap: packets.readInt32LE(40),
      lastLap: packets.readInt32LE(44),
      bestLap: packets.readInt32LE(48),
      laps: packets.readInt32LE(52),

      gas: packets.readFloatLE(56),
      brake: packets.readFloatLE(60),
      clutch: packets.readFloatLE(64),
      engineRPM: packets.readFloatLE(68),
      steering: packets.readFloatLE(72),
      gear: packets.readInt32LE(76),
      cgHeight: packets.readFloatLE(80),

      wheelAngularSpdFL: packets.readFloatLE(84),
      wheelAngularSpdFR: packets.readFloatLE(88),
      wheelAngularSpdRL: packets.readFloatLE(92),
      wheelAngularSpdRR: packets.readFloatLE(96),

      slipAngleFL: packets.readFloatLE(100),
      slipAngleFR: packets.readFloatLE(104),
      slipAngleRL: packets.readFloatLE(108),
      slipAngleRR: packets.readFloatLE(112),
      slipAngleConatctPatchFL: packets.readFloatLE(116),
      slipAngleConatctPatchFR: packets.readFloatLE(120),
      slipAngleConatctPatchRL: packets.readFloatLE(124),
      slipAngleConatctPatchRR: packets.readFloatLE(128),
      slipRatioFL: packets.readFloatLE(132),
      slipRatioFR: packets.readFloatLE(136),
      slipRatioRL: packets.readFloatLE(140),
      slipRatioRR: packets.readFloatLE(144),

      tireSlipFL: packets.readFloatLE(148),
      tireSlipFR: packets.readFloatLE(152),
      tireSlipRL: packets.readFloatLE(156),
      tireSlipRR: packets.readFloatLE(160),

      ndSlipFL: packets.readFloatLE(164),
      ndSlipFR: packets.readFloatLE(168),
      ndSlipRL: packets.readFloatLE(172),
      ndSlipRR: packets.readFloatLE(176),

      loadFL: packets.readFloatLE(180),
      loadFR: packets.readFloatLE(184),
      loadRL: packets.readFloatLE(188),
      loadRR: packets.readFloatLE(192),

      DyFL: packets.readFloatLE(196),
      DyFR: packets.readFloatLE(200),
      DyRL: packets.readFloatLE(204),
      DyRR: packets.readFloatLE(208),
      MxFL: packets.readFloatLE(212),
      MxFR: packets.readFloatLE(216),
      MxRL: packets.readFloatLE(220),
      MxRR: packets.readFloatLE(224),

      tireDirtyLevelFL: packets.readFloatLE(228),
      tireDirtyLevelFR: packets.readFloatLE(232),
      tireDirtyLevelRL: packets.readFloatLE(236),
      tireDirtyLevelRR: packets.readFloatLE(240),

      camberRADFL: packets.readFloatLE(244),
      camberRADFR: packets.readFloatLE(248),
      camberRADRL: packets.readFloatLE(252),
      camberRADRR: packets.readFloatLE(256),

      tireRadiusFL: packets.readFloatLE(260),
      tireRadiusFR: packets.readFloatLE(264),
      tireRadiusRL: packets.readFloatLE(268),
      tireRadiusRR: packets.readFloatLE(272),
      tireLoadedRadiusFL: packets.readFloatLE(276),
      tireLoadedRadiusFR: packets.readFloatLE(280),
      tireLoadedRadiusRL: packets.readFloatLE(284),
      tireLoadedRadiusRR: packets.readFloatLE(288),

      suspensionHeightFL: packets.readFloatLE(292),
      suspensionHeightFR: packets.readFloatLE(296),
      suspensionHeightRL: packets.readFloatLE(300),
      suspensionHeightRR: packets.readFloatLE(304),

      carPosNormalized: packets.readFloatLE(308),
      carSlope: packets.readFloatLE(312),

      carCoordinatesX: packets.readFloatLE(316),
      carCoordinatesY: packets.readFloatLE(320),
      carCoordinatesZ: packets.readFloatLE(324)
   }
}

const populateRenderer = data => {
}

class Hello { }
let hello = new Hello();



startSession();

server.on('listening', () => {
   console.log(`Listening: ${HOST}:${PORT}`);
});

// main update loop
server.on('message', packets => {
   // let carName = readString(packets, 0, 100);
   // let driverName = readString(packets, 100, 100);

   // if (state = 1) {
   data = parsePackets(packets);
   if (RECORDING) RACE_DATA += `\n${Object.values(data).join(',')}`;
   console.log(data.speedKPH);
   // }
});

process.on('SIGINT', () => {
   stopSession();
   console.log(`Terminating Session...`);
   process.exit();
});
