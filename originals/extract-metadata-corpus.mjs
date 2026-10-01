#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

export function decodeEntities(value) {
  return value.replace(/&nbsp;|&#160;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;|&#34;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
}
export function plain(value='') { return decodeEntities(value.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim(); }
function attr(tag, name) {
  return decodeEntities(tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1] || '');
}
function tagWithAttribute(html, tagName, name, value) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))]
    .map(match => match[0])
    .find(tag => attr(tag, name).toLocaleLowerCase().split(/\s+/).includes(value)) || '';
}
export function parseMetadata(html, definition={}) {
  const title = plain(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
  const description = attr(tagWithAttribute(html, 'meta', 'name', 'description'), 'content');
  const canonical = attr(tagWithAttribute(html, 'link', 'rel', 'canonical'), 'href');
  const h1 = plain(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');
  const fingerprint = createHash('sha256').update([title, description, h1, canonical].join('\n')).digest('hex');
  return {...definition, title, description, h1, canonical, title_length:[...title].length, description_length:[...description].length, source_hash:`sha256:${fingerprint}`};
}
export function similarity(a,b) {
  const grams = value => { const words=plain(value).toLocaleLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean); return new Set(words.length<2?words:words.slice(0,-1).map((w,i)=>`${w} ${words[i+1]}`)); };
  const x=grams(a), y=grams(b); if (!x.size && !y.size) return 1; let common=0; for (const item of x) if (y.has(item)) common++; return common/(x.size+y.size-common);
}
export function annotate(rows, threshold=.72) {
  return rows.map((row,i) => { const exact=[], near=[]; rows.forEach((other,j)=>{ if(i===j)return; if(row.title && row.title===other.title) exact.push(other.url); else { const score=similarity(row.title,other.title); if(score>=threshold) near.push(`${other.url} (${score.toFixed(2)})`); }}); return {...row, exact_title_duplicates:exact.join(' | '), near_title_duplicates:near.join(' | '), similarity_method:`word_bigram_jaccard_${threshold}`, human_decision:'pending_review'}; });
}
export function csv(rows) { const keys=['url','locale','page_type','title','description','h1','canonical','title_length','description_length','source_hash','exact_title_duplicates','near_title_duplicates','similarity_method','human_decision']; const q=v=>`"${String(v??'').replaceAll('"','""')}"`; return [keys.join(','),...rows.map(r=>keys.map(k=>q(r[k])).join(','))].join('\n')+'\n'; }

export async function fetchMetadata(definition, origin='', fetchImpl=fetch) {
  const source=new URL(definition.url);
  const fetchUrl=origin ? new URL(source.pathname+source.search,origin) : source;
  let response;
  try {
    response=await fetchImpl(fetchUrl,{headers:{accept:'text/html'}});
  } catch (error) {
    throw new Error(`${fetchUrl}: network error: ${error instanceof Error ? error.message : String(error)}`);
  }
  if(!response.ok) throw new Error(`${fetchUrl}: HTTP ${response.status}`);
  return parseMetadata(await response.text(),definition);
}

async function main() {
  const args=Object.fromEntries(process.argv.slice(2).map(v=>v.replace(/^--/,'').split(/=(.*)/s).slice(0,2)));
  if (!args.input || !args.output) throw new Error('Usage: --input=pages.json --output=corpus.csv [--origin=https://edikka:8890]');
  const definitions=JSON.parse(await readFile(args.input,'utf8'));
  const rows=[];
  for (const definition of definitions) rows.push(await fetchMetadata(definition,args.origin));
  await writeFile(args.output,csv(annotate(rows)),'utf8');
  process.stdout.write(JSON.stringify({status:'written',rows:rows.length,output:args.output})+'\n');
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});
