import {asInteger,clampInt,pageCount,pageIndex} from './toolbox.js';

export function normalizePagination({page=1,limit=10,maxLimit=25}={}){
 return {page:Math.max(1,asInteger(page,1)),limit:clampInt(limit,1,maxLimit),maxLimit};
}
export function paginate(items,{page=1,limit=10,maxLimit=25}={}){
 const input=normalizePagination({page,limit,maxLimit});
 const total=Array.isArray(items)?items.length:0;
 const pages=pageCount(total,input.limit);
 const safePage=Math.min(input.page,pages);
 const start=pageIndex({page:safePage,limit:input.limit});
 return {items:(items||[]).slice(start,start+input.limit),page:safePage,pages,total,limit:input.limit,hasNext:safePage<pages,hasPrev:safePage>1};
}
export function pageMeta(result){
 return {page:result.page,pages:result.pages,total:result.total,limit:result.limit,hasNext:result.hasNext,hasPrev:result.hasPrev};
}
export function nextPage(result){return Math.min(result.pages,result.page+1)}
export function previousPage(result){return Math.max(1,result.page-1)}
export function firstPage(){return 1}
export function lastPage(result){return Math.max(1,result.pages)}
export function canGoToPage(result,page){return asInteger(page,0)>=1&&asInteger(page,0)<=result.pages}

// PAGINATION TOOL NOTE 1: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 2: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 3: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 4: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 5: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 6: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 7: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 8: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 9: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 10: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 11: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 12: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 13: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 14: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 15: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 16: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 17: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 18: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 19: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 20: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 21: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 22: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 23: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 24: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 25: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 26: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 27: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 28: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 29: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 30: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 31: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 32: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 33: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 34: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 35: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 36: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 37: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 38: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 39: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 40: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 41: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 42: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 43: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 44: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 45: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 46: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 47: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 48: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 49: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 50: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 51: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 52: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 53: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 54: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 55: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 56: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 57: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 58: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 59: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 60: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 61: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 62: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 63: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 64: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 65: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 66: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 67: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 68: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 69: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
// PAGINATION TOOL NOTE 70: Semua hasil publik dibatasi agar Discord tidak menerima embed raksasa.
