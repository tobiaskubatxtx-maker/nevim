/** Production integration boundary; deliberately unused by the in-memory demo. */
import {createClient, type SupabaseClient} from '@supabase/supabase-js';
export type StoredReservation={id:string;area_id:string;user_id:string;starts_at:string;ends_at:string;note:string;kind:'booking'|'closure'};
export function createBackend(url:string,publishableKey:string):SupabaseClient {
 if(!url.startsWith('https://')||!publishableKey)throw new Error('Chybí veřejné nastavení projektu Supabase.');
 return createClient(url,publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}
export function backendMessage(error:{code?:string;message:string}):string {
 if(error.code==='23P01')return 'Tento termín už někdo obsadil. Obnovte kalendář a vyberte jiný čas.';
 if(error.code==='42501')return 'K této změně nemáte oprávnění. Zkontrolujte přihlášení.';
 if(error.code==='P0001')return error.message;
 return 'Změnu se nepodařilo uložit. Zkontrolujte připojení a zkuste to znovu.';
}
export async function signIn(backend:SupabaseClient,email:string,password:string){
 const {data,error}=await backend.auth.signInWithPassword({email,password});
 if(error)throw new Error('Přihlášení se nezdařilo. Zkontrolujte e-mail a heslo.');
 return data;
}
export async function listReservations(backend:SupabaseClient,fromISO:string,toISO:string){
 const {data,error}=await backend.from('reservations').select('*').lt('starts_at',toISO).gt('ends_at',fromISO).order('starts_at');
 if(error)throw new Error(backendMessage(error));
 return data as StoredReservation[];
}
/** Pass absolute ISO timestamps with explicit offset, not local date strings.
 * Member user_id must come from auth.getUser(), never from a demo selector.
 * The database, rather than a client precheck, makes the final decision. */
export async function saveReservation(backend:SupabaseClient,row:Omit<StoredReservation,'id'>&{id?:string},existing=false){
 const query=existing?backend.from('reservations').update(row).eq('id',row.id!):backend.from('reservations').insert(row);
 const {data,error}=await query.select().single();
 if(error)throw new Error(backendMessage(error));
 return data as StoredReservation;
}
export async function cancelReservation(backend:SupabaseClient,id:string){
 const {data,error}=await backend.from('reservations').delete().eq('id',id).select('id');
 if(error)throw new Error(backendMessage(error));
 if(!data?.length)throw new Error('Termín už neexistuje nebo nemáte oprávnění jej zrušit.');
}
