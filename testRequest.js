(
async ()=>{
  try{
    const r = await fetch('http://localhost:3001/api/models');
    console.log('status', r.status);
    const t = await r.text();
    console.log('body', t.substring(0,1000));
  }catch(e){
    console.error(e);
  }
})();

