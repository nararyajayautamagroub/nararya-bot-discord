export function safeCalculator(expression){
 const value=String(expression??"");
 if(!/^[0-9+*/().%\s-]+$/.test(value))throw new Error("Ekspresi tidak diizinkan");
 return Function("return ("+value+")")();
}