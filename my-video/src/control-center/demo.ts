import {buildOverview, type OverviewInput} from '@/lib/dashboard/overview';
import {staticFile} from 'remotion';

export const demoProducts = [
  {id:'demo-coffee', title:'Café de altura salvadoreño', category:'Café', price:'6.50', quantity:'5000', unit:'kg', country:'El Salvador', state:'Santa Ana', status:'activa', views:1400, videoImage:'cafe-premium-salvadoreno.jpg', company_name:'Finca El Roble', user_id:'demo-seller', description:'Café arábica de altura. Cosecha seleccionada a mano, notas de cacao y caramelo.', created_at:'2026-09-04T12:00:00Z'},
  {id:'demo-cacao', title:'Cacao en grano fermentado', category:'Cacao', price:'4.80', quantity:'3000', unit:'kg', country:'El Salvador', state:'Sonsonate', status:'activa', views:870, videoImage:'cacao-grano-fermentado-chocolate.jpg', company_name:'Cooperativa Los Andes', user_id:'demo-andes', description:'Cacao seleccionado, fermentado y secado al sol.', created_at:'2026-09-08T12:00:00Z'},
  {id:'demo-avocado', title:'Aguacate Hass de exportación', category:'Frutas', price:'2.20', quantity:'8000', unit:'kg', country:'México', state:'Michoacán', status:'activa', views:410, videoImage:'aguacate-mexicano-hass.jpg', company_name:'Tropical Exports', user_id:'demo-tropical', description:'Aguacate Hass fresco para compradores mayoristas.', created_at:'2026-09-12T12:00:00Z'},
];
const time = (day:number, previous=false) => new Date(Date.UTC(2026,previous?7:8,(previous?2:1)+day,12)).toISOString();
const current = [1,1,2,1,2,1,2,2,1,3,2,1,3,2,2,1,2,2,3,2,1,2,3,2,2,3,2,3,2,4];
const input:OverviewInput = {
  userId:'demo-seller', profile:{id:'demo-seller',company_name:'Finca El Roble',user_type:'vendedor',avatar_url:staticFile('finca-el-roble-logo.jpg')},
  products:demoProducts.map(p=>({...p,user_id:'demo-seller',is_visible:true})),
  quotes:[...current.flatMap((count,day)=>Array.from({length:count},(_,n)=>({id:`q-${day}-${n}`,buyer_id:'demo-buyer',seller_id:'demo-seller',product_id:'demo-coffee',product_title:demoProducts[0].title,buyer_name:'Agroindustrias Pacífico',status:day>=28&&n===0?'pending':'accepted',created_at:time(day)}))),...Array.from({length:32},(_,i)=>({id:`previous-${i}`,buyer_id:'demo-buyer',seller_id:'demo-seller',status:'accepted',created_at:time(i%30,true)}))],
  orders:[...Array.from({length:21},(_,i)=>({id:`order-${i}`,buyer_id:'demo-buyer',seller_id:'demo-seller',status:i<14?'delivered':i<16?'pending':i<18?'processing':'shipped',total_price:650,currency:'USD',created_at:time(i+4)})),...Array.from({length:10},(_,i)=>({id:`old-${i}`,buyer_id:'demo-buyer',seller_id:'demo-seller',status:'delivered',total_price:650,currency:'USD',created_at:time(i+5,true)}))],
  conversations:Array.from({length:12},(_,i)=>({id:`chat-${i}`,buyer_id:'demo-buyer',seller_id:'demo-seller',product_id:'demo-coffee'})),
  messages:Array.from({length:12},(_,i)=>[{id:`m-${i}`,conversation_id:`chat-${i}`,sender_id:'demo-buyer',content:'¿Tienes disponibilidad para 1,000 kg de café?',created_at:time(i+15)},...(i<10?[{id:`r-${i}`,conversation_id:`chat-${i}`,sender_id:'demo-seller',content:'Sí, podemos coordinar la entrega dentro de Agrilpa.',created_at:new Date(new Date(time(i+15)).getTime()+18*60000).toISOString()}]:[])]).flat(),
  profiles:[{id:'demo-buyer',company_name:'Agroindustrias Pacífico'}],productNames:{'demo-coffee':demoProducts[0].title},chatAvailable:true,
};
export const demoOverview = buildOverview(input,30,new Date('2026-10-01T18:00:00Z'),'2026-09-30');
export const demoQuotationCount = input.quotes.length;
