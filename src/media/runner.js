import {spawn} from 'node:child_process';

export function run(command,args=[],options={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(command,args,{stdio:['ignore','pipe','pipe'],...options});
  let stdout='',stderr='';
  child.stdout?.on('data',d=>stdout+=d);
  child.stderr?.on('data',d=>stderr+=d);
  child.on('error',reject);
  child.on('close',code=>{
   if(code===0)return resolve({stdout:String(stdout),stderr:String(stderr)});
   const error=new Error((stderr||stdout||('Command exited with code '+code)).trim());
   error.code=code;
   reject(error);
  });
 });
}
