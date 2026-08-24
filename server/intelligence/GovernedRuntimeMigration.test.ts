import { describe, expect, it } from "vitest";
import { ZCOS_INTELLIGENCE_SCHEMA_VERSION, type ZcosSourceEnvelope } from "../../shared/zcos-intelligence.js";
import { SourceConfluenceEngine } from "./SourceConfluenceEngine.js";
import { ZcosPolicyEngine } from "./ZcosPolicyEngine.js";
import { ZcosRequestInterpreter } from "./ZcosRequestInterpreter.js";

const source=(id:string,value:string,key=id):ZcosSourceEnvelope=>({sourceId:id,type:"external_search",authority:"source",originGalaxy:"ZCOS",originClass:"external_primary",title:id,content:value,confidence:.9,currency:"current",claims:[{key:"claim",value}],provenance:{retrievedAt:new Date().toISOString(),independenceKey:key,lineage:[id]}});
describe("governed migration contracts",()=>{
 it("preserves independent claim conflicts",()=>{const r=SourceConfluenceEngine.evaluate([source("a","A"),source("b","B")]);expect(r.report.conflicts).toHaveLength(1);expect(r.uncertainties[0].resolution).toBe("preserve");});
 it("interprets freshness and never grants external actions implicitly",()=>{const r=ZcosRequestInterpreter.interpret({traceId:"t",userId:"u",message:"Deploy the latest build",route:"/zar"});expect(r.intent.explicitFreshness).toBe(true);expect(r.permissions.externalActions).toBe(false);});
 it("blocks canonical mutation from external adapters",()=>{const s=source("a","A");expect(()=>ZcosPolicyEngine.verifyExternalResult({schemaVersion:ZCOS_INTELLIGENCE_SCHEMA_VERSION,resultId:"r",requestId:"q",type:"execution",status:"success",data:{},sourceIds:["a"],uncertainties:[],errors:[],provenance:{retrievedAt:new Date().toISOString(),independenceKey:"x",lineage:["a"]},writeDisposition:"approved_mutation"},[s],"q")).toThrow(/cannot write canonical/i);});
});
